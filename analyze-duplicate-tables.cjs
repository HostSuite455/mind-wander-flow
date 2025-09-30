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

async function analyzeTableStructures() {
  const { createClient } = require('@supabase/supabase-js');
  
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti nel file .env');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Analisi struttura tabelle per identificare duplicati...\n');
  
  // Tabelle che potrebbero essere duplicate o correlate
  const tableGroups = {
    'Gestione Proprietà': [
      'properties',
      'property_info', 
      'property_details',
      'property_ai_data',
      'accommodations',
      'units',
      'rooms'
    ],
    'Gestione Calendario': [
      'availability_blocks',
      'calendar_blocks',
      'ical_configs',
      'ical_sources'
    ],
    'Gestione Utenti': [
      'users',
      'user_profiles', 
      'profiles'
    ],
    'Gestione Pulizie': [
      'cleaning_schedules',
      'cleaning_tasks',
      'cleaner_assignments',
      'cleaner_rates'
    ],
    'Gestione Canali': [
      'channel_accounts',
      'channel_manager'
    ],
    'Altri': [
      'guest_codes',
      'message_feedback',
      'payouts',
      'subscriptions',
      'sync_logs',
      'task_accounting',
      'unanswered_questions'
    ]
  };
  
  for (const [groupName, tables] of Object.entries(tableGroups)) {
    console.log(`\n📋 ${groupName}:`);
    console.log('=' + '='.repeat(groupName.length + 3));
    
    for (const tableName of tables) {
      try {
        // Ottieni la struttura della tabella
        const { data: columns, error } = await supabase
          .rpc('get_table_columns', { table_name: tableName })
          .single();
          
        if (error) {
          // Prova un approccio alternativo per ottenere le colonne
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (sampleError) {
            console.log(`   ❌ ${tableName}: Tabella non accessibile`);
            continue;
          }
          
          const columnNames = sampleData && sampleData.length > 0 
            ? Object.keys(sampleData[0]) 
            : [];
            
          console.log(`   📊 ${tableName}:`);
          console.log(`      Colonne: ${columnNames.join(', ')}`);
          
        } else {
          console.log(`   📊 ${tableName}:`);
          console.log(`      Struttura: ${JSON.stringify(columns)}`);
        }
        
        // Conta i record
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        if (!countError) {
          console.log(`      Record: ${count || 0}`);
        }
        
      } catch (err) {
        console.log(`   ❌ ${tableName}: Errore nell'analisi - ${err.message}`);
      }
    }
  }
  
  console.log('\n🎯 Raccomandazioni per la consolidazione:');
  console.log('=====================================');
  
  // Analisi specifica per proprietà
  console.log('\n🏠 PROPRIETÀ:');
  console.log('- properties: Tabella principale per le proprietà');
  console.log('- property_info: Potrebbe essere ridondante con properties');
  console.log('- property_details: Potrebbe essere ridondante con properties');
  console.log('- property_ai_data: Dati AI specifici, mantenere separato');
  console.log('- accommodations/units/rooms: Struttura gerarchica, valutare se necessaria');
  
  console.log('\n📅 CALENDARIO:');
  console.log('- availability_blocks vs calendar_blocks: Potrebbero essere duplicate');
  console.log('- ical_configs vs ical_sources: Valutare se consolidabili');
  
  console.log('\n👤 UTENTI:');
  console.log('- users vs user_profiles vs profiles: Probabilmente ridondanti');
  
  console.log('\n🧹 PULIZIE:');
  console.log('- Struttura complessa, valutare se tutte le tabelle sono necessarie');
  
  return tableGroups;
}

async function main() {
  try {
    await analyzeTableStructures();
  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error);
    process.exit(1);
  }
}

main();