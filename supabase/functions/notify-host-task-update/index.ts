import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SB_URL")!;
const supabaseKey = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_id, event, duration_min, has_issues } = await req.json();
    
    console.log(`[notify-host] Processing ${event} for task ${task_id}`);
    
    // Get task + property + host info
    const { data: task, error } = await supabase
      .from('cleaning_tasks')
      .select(`
        id,
        status,
        property_id,
        properties!inner (
          nome,
          host_id
        ),
        cleaners (name)
      `)
      .eq('id', task_id)
      .single();
    
    if (error || !task) {
      console.error('[notify-host] Task not found:', error);
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const hostId = task.properties.host_id;
    const cleanerName = task.cleaners?.name || 'Cleaner';
    const propertyName = task.properties.nome;
    
    let title = '';
    let message = '';
    
    if (event === 'task_started') {
      title = `🧹 Pulizia iniziata - ${propertyName}`;
      message = `${cleanerName} ha iniziato la pulizia di "${propertyName}".\n\nOrario: ${new Date().toLocaleString('it-IT')}\n\nMonitora il progresso dalla dashboard.`;
    } else if (event === 'task_completed') {
      title = `✅ Pulizia completata - ${propertyName}`;
      message = `${cleanerName} ha completato la pulizia di "${propertyName}".\n\nDurata effettiva: ${duration_min} minuti\n${has_issues ? '⚠️ Sono stati rilevati dei problemi. Controlla le note.' : '✅ Nessun problema rilevato.'}\n\nVerifica le foto sulla dashboard.`;
    }
    
    // Log notification (in produzione: inviare email via Resend)
    console.log(`[notify-host] To host: ${hostId}, Title: ${title}`);
    
    // Insert notification record
    const { error: insertError } = await supabase
      .from('host_notifications')
      .insert({
        host_id: hostId,
        task_id: task_id,
        type: event,
        title: title,
        message: message,
        read: false
      });
    
    if (insertError) {
      console.error('[notify-host] Insert error:', insertError);
      throw insertError;
    }
    
    console.log(`[notify-host] Notification created successfully`);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('[notify-host-task-update] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
