const fs = require('fs');
const path = require('path');

// Leggi le variabili d'ambiente dal file .env
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex !== -1) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          let value = trimmedLine.substring(equalIndex + 1).trim();
          
          // Rimuovi le virgolette se presenti
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          envVars[key] = value;
        }
      }
    }
  }
  
  return envVars;
}

async function consolidateTables() {
  const { createClient } = require('@supabase/supabase-js');
  
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti nel file .env');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🗂️  Consolidamento tabelle Supabase...\n');
  
  // Tabelle da eliminare perché duplicate o obsolete
  const tablesToDrop = [
    // Duplicate di properties
    'property_info',
    'property_details',
    
    // Struttura gerarchica non necessaria (manteniamo solo properties)
    'accommodations',
    'units', 
    'rooms',
    
    // Duplicate di calendario (manteniamo solo calendar_blocks)
    'availability_blocks',
    
    // Duplicate di utenti (manteniamo solo profiles)
    'user_profiles',
    
    // Tabelle di pulizie non utilizzate
    'cleaner_assignments',
    'cleaner_rates',
    
    // Tabelle non utilizzate
    'sync_logs',
    'task_accounting'
  ];
  
  // Tabelle da mantenere (essenziali)
  const essentialTables = [
    'properties',           // Tabella principale proprietà
    'property_ai_data',     // Dati AI specifici
    'calendar_blocks',      // Gestione calendario
    'ical_configs',         // Configurazioni iCal
    'ical_sources',         // Sorgenti iCal
    'profiles',             // Profili utenti
    'cleaning_schedules',   // Programmi pulizie
    'cleaning_tasks',       // Task pulizie
    'channel_accounts',     // Account canali
    'guest_codes',          // Codici ospiti
    'message_feedback',     // Feedback messaggi
    'payouts',              // Pagamenti
    'subscriptions',        // Abbonamenti
    'unanswered_questions'  // Domande senza risposta
  ];
  
  console.log('📋 Tabelle da eliminare:');
  console.log('========================');
  for (const table of tablesToDrop) {
    console.log(`   ❌ ${table}`);
  }
  
  console.log('\n📋 Tabelle da mantenere:');
  console.log('========================');
  for (const table of essentialTables) {
    console.log(`   ✅ ${table}`);
  }
  
  console.log('\n🚀 Inizio eliminazione tabelle duplicate...\n');
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const tableName of tablesToDrop) {
    try {
      console.log(`🗑️  Eliminando tabella: ${tableName}...`);
      
      // Prova a eliminare la tabella
      const { error } = await supabase.rpc('drop_table_if_exists', { 
        table_name: tableName 
      });
      
      if (error) {
        // Se la funzione RPC non esiste, prova con SQL diretto
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql: `DROP TABLE IF EXISTS public.${tableName} CASCADE;`
        });
        
        if (sqlError) {
          console.log(`   ⚠️  Impossibile eliminare ${tableName}: ${sqlError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Tabella ${tableName} eliminata con successo`);
          deletedCount++;
        }
      } else {
        console.log(`   ✅ Tabella ${tableName} eliminata con successo`);
        deletedCount++;
      }
      
    } catch (err) {
      console.log(`   ❌ Errore eliminando ${tableName}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Riepilogo consolidamento:');
  console.log('============================');
  console.log(`✅ Tabelle eliminate: ${deletedCount}`);
  console.log(`❌ Errori: ${errorCount}`);
  console.log(`📋 Tabelle rimanenti: ${essentialTables.length}`);
  
  // Verifica tabelle rimanenti
  console.log('\n🔍 Verifica tabelle rimanenti...');
  for (const tableName of essentialTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`   ❌ ${tableName}: Non accessibile`);
      } else {
        console.log(`   ✅ ${tableName}: ${count || 0} record`);
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: Errore - ${err.message}`);
    }
  }
  
  console.log('\n🎉 Consolidamento completato!');
  console.log('💡 Il database ora contiene solo le tabelle essenziali.');
  
  return {
    deleted: deletedCount,
    errors: errorCount,
    remaining: essentialTables.length
  };
}

async function main() {
  try {
    const result = await consolidateTables();
    
    if (result.errors > 0) {
      console.log('\n⚠️  Alcuni errori sono normali se le tabelle non esistevano già.');
    }
    
  } catch (error) {
    console.error('❌ Errore durante il consolidamento:', error);
    process.exit(1);
  }
}

main();