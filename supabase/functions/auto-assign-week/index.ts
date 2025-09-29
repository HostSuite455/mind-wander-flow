import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

type ReqBody = { 
  property_id: string; 
  from: string; 
  to: string; 
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405, 
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const { property_id, from, to } = body;

    if (!property_id || !from || !to) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Missing required fields: property_id, from, to" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    // Get active cleaner assignments for this property, ordered by weight
    const { data: assignments, error: assignError } = await supabase
      .from('cleaner_assignments')
      .select(`
        id,
        cleaner_id,
        weight,
        cleaners(id, name)
      `)
      .eq('property_id', property_id)
      .eq('active', true)
      .order('weight', { ascending: false });

    if (assignError) throw assignError;

    if (!assignments || assignments.length === 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "No active cleaners assigned to this property" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    // Get unassigned tasks in the date range
    const { data: tasks, error: tasksError } = await supabase
      .from('cleaning_tasks')
      .select('id, scheduled_start, type')
      .eq('property_id', property_id)
      .gte('scheduled_start', from)
      .lt('scheduled_start', to)
      .is('assigned_cleaner_id', null)
      .eq('status', 'todo')
      .order('scheduled_start');

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ 
        ok: true, 
        assigned: 0, 
        message: "No unassigned tasks found in the specified date range" 
      }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    console.log(`Auto-assigning ${tasks.length} tasks to ${assignments.length} cleaners`);

    // Round-robin assignment
    let assignedCount = 0;
    let cleanerIndex = 0;

    for (const task of tasks) {
      const assignment = assignments[cleanerIndex % assignments.length];
      
      try {
        const { error: updateError } = await supabase
          .from('cleaning_tasks')
          .update({ assigned_cleaner_id: assignment.cleaner_id })
          .eq('id', task.id);

        if (updateError) {
          console.error(`Failed to assign task ${task.id}:`, updateError);
          continue;
        }

        assignedCount++;
        cleanerIndex++;
        
        console.log(`Assigned task ${task.id} to cleaner ${assignment.cleaner_id}`);
      } catch (error) {
        console.error(`Error assigning task ${task.id}:`, error);
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      assigned: assignedCount,
      total_tasks: tasks.length,
      cleaners_used: assignments.length
    }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });

  } catch (e) {
    console.error('Auto-assign function error:', e);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: String(e) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});