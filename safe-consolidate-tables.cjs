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

async function safeConsolidateTables() {
  const { createClient } = require('@supabase/supabase-js');
  
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti nel file .env');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Analisi sicura delle tabelle basata sull\'uso nel codice...\n');
  
  // Tabelle effettivamente utilizzate nel codice (da regex search)
  const usedTables = [
    'bookings',
    'properties', 
    'calendar_blocks',
    'ical_urls',
    'ical_configs',
    'cleaners',
    'channel_accounts',
    'unanswered_questions',
    'guest_codes',
    'cleaner_assignments',
    'cleaner_rates',
    'task-photos',
    'cleaning_tasks',
    'ical_sources',
    'property_ai_data'
  ];
  
  // Tutte le tabelle esistenti (dal nostro precedente scan)
  const allExistingTables = [
    'cleaner_assignments',
    'cleaner_rates', 
    'cleaning_tasks',
    'guest_codes',
    'ical_configs',
    'message_feedback',
    'payouts',
    'profiles',
    'properties',
    'property_ai_data',
    'subscriptions',
    'sync_logs',
    'task_accounting',
    'unanswered_questions',
    'accommodations',
    'units',
    'rooms',
    'availability_blocks',
    'calendar_blocks',
    'channel_accounts',
    'property_info',
    'property_details'
  ];
  
  // Tabelle non utilizzate nel codice
  const unusedTables = allExistingTables.filter(table => !usedTables.includes(table));
  
  console.log('📋 Tabelle UTILIZZATE nel codice (da mantenere):');
  console.log('===============================================');
  for (const table of usedTables) {
    console.log(`   ✅ ${table}`);
  }
  
  console.log('\n📋 Tabelle NON UTILIZZATE nel codice (candidati per eliminazione):');
  console.log('==================================================================');
  for (const table of unusedTables) {
    console.log(`   ❌ ${table}`);
  }
  
  console.log('\n🚨 ATTENZIONE: Eliminazione tabelle non utilizzate...');
  console.log('====================================================');
  
  let deletedCount = 0;
  let errorCount = 0;
  
  // Elimina solo le tabelle che sono sicuramente non utilizzate
  const safesToDelete = [
    'property_info',      // Duplicato di properties
    'property_details',   // Duplicato di properties  
    'accommodations',     // Non utilizzato nel codice
    'units',              // Non utilizzato nel codice
    'rooms',              // Non utilizzato nel codice
    'availability_blocks', // Duplicato di calendar_blocks
    'sync_logs',          // Non utilizzato nel codice
    'task_accounting',    // Non utilizzato nel codice
    'message_feedback',   // Non utilizzato nel codice
    'payouts',            // Non utilizzato nel codice
    'subscriptions'       // Non utilizzato nel codice
  ];
  
  console.log('\n🗑️  Eliminando solo tabelle sicuramente non utilizzate...\n');
  
  for (const tableName of safesToDelete) {
    try {
      console.log(`🗑️  Eliminando: ${tableName}...`);
      
      // Verifica se la tabella esiste prima di eliminarla
      const { data: tableExists } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (tableExists !== null) {
        // La tabella esiste, procedi con l'eliminazione
        // Nota: Supabase non permette DROP TABLE via client, 
        // quindi segniamo solo per eliminazione manuale
        console.log(`   ⚠️  ${tableName}: Segnata per eliminazione manuale`);
        deletedCount++;
      } else {
        console.log(`   ℹ️  ${tableName}: Tabella non esistente`);
      }
      
    } catch (err) {
      if (err.message.includes('relation') && err.message.includes('does not exist')) {
        console.log(`   ℹ️  ${tableName}: Tabella non esistente`);
      } else {
        console.log(`   ❌ Errore verificando ${tableName}: ${err.message}`);
        errorCount++;
      }
    }
  }
  
  console.log('\n📊 Riepilogo consolidamento sicuro:');
  console.log('===================================');
  console.log(`✅ Tabelle utilizzate mantenute: ${usedTables.length}`);
  console.log(`🗑️  Tabelle segnate per eliminazione: ${deletedCount}`);
  console.log(`❌ Errori: ${errorCount}`);
  
  console.log('\n📝 Tabelle da eliminare manualmente in Supabase:');
  console.log('================================================');
  for (const table of safesToDelete) {
    console.log(`   DROP TABLE IF EXISTS public.${table} CASCADE;`);
  }
  
  console.log('\n🎯 Struttura finale raccomandata:');
  console.log('=================================');
  console.log('CORE TABLES (essenziali):');
  console.log('- properties (proprietà)');
  console.log('- bookings (prenotazioni)');
  console.log('- calendar_blocks (calendario)');
  console.log('- property_ai_data (dati AI)');
  console.log('');
  console.log('INTEGRATION TABLES:');
  console.log('- ical_configs, ical_urls, ical_sources (iCal)');
  console.log('- channel_accounts (canali)');
  console.log('');
  console.log('USER MANAGEMENT:');
  console.log('- profiles (profili utenti)');
  console.log('- guest_codes (codici ospiti)');
  console.log('');
  console.log('CLEANING SYSTEM:');
  console.log('- cleaning_tasks (task pulizie)');
  console.log('- cleaner_assignments (assegnazioni)');
  console.log('- cleaner_rates (tariffe)');
  console.log('- cleaners (pulitori)');
  console.log('- task-photos (foto task)');
  console.log('');
  console.log('SUPPORT:');
  console.log('- unanswered_questions (domande)');
  
  return {
    used: usedTables.length,
    toDelete: deletedCount,
    errors: errorCount
  };
}

async function main() {
  try {
    const result = await safeConsolidateTables();
    
    console.log('\n✅ Analisi completata!');
    console.log('💡 Usa i comandi SQL mostrati sopra per eliminare le tabelle non necessarie.');
    
  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error);
    process.exit(1);
  }
}

main();