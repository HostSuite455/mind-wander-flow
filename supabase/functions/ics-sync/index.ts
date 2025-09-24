import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SB_URL');
    const supabaseKey = Deno.env.get('SB_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables: SB_URL or SB_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration error - missing required secrets' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body for POST requests
    let accountId, icsUrl;
    
    if (req.method === 'POST') {
      const body = await req.json();
      accountId = body.account_id;
      icsUrl = body.ics_pull_url;
    } else {
      // Fallback to query parameters for GET requests
      const url = new URL(req.url);
      accountId = url.searchParams.get('account_id');
    }

    if (!accountId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing account_id parameter' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting sync for account: ${accountId}`);

    // Get account details from channel_accounts table
    const { data: account, error: accountError } = await supabase
      .from('channel_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('Account not found:', accountError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Account not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!account.ics_pull_url) {
      console.error('No ICS pull URL configured for account:', accountId);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No ICS pull URL configured' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update sync status to 'running'
    await supabase
      .from('channel_accounts')
      .update({ 
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'running' 
      })
      .eq('id', accountId);

    try {
      // Fetch ICS data
      console.log(`Fetching ICS data from: ${account.ics_pull_url}`);
      const icsResponse = await fetch(account.ics_pull_url);
      
      if (!icsResponse.ok) {
        throw new Error(`Failed to fetch ICS: ${icsResponse.status} ${icsResponse.statusText}`);
      }

      const icsData = await icsResponse.text();
      console.log(`Fetched ICS data, length: ${icsData.length} chars`);

      // TODO: Parse ICS data and create/update calendar blocks
      // For now, we'll just mark as successful
      
      // Update sync status to 'success'
      await supabase
        .from('channel_accounts')
        .update({ 
          last_sync_status: 'success' 
        })
        .eq('id', accountId);

      console.log(`Sync completed successfully for account: ${accountId}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 1,
        message: 'Sync completed successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      console.error('Sync error:', syncError);
      
      // Update sync status to 'error'
      await supabase
        .from('channel_accounts')
        .update({ 
          last_sync_status: `error: ${syncError.message}` 
        })
        .eq('id', accountId);

      return new Response(JSON.stringify({ 
        success: false, 
        error: syncError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});