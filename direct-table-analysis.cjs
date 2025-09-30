const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leggi le variabili di ambiente dal file .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').replace(/"/g, ''); // Rimuovi le virgolette
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili di ambiente Supabase mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista delle tabelle che sappiamo esistere o potrebbero esistere
const knownTables = [
  'properties',
  'bookings', 
  'reservations',
  'listings',
  'property_data',
  'property_info',
  'property_details',
  'accommodations',
  'units',
  'rooms',
  'availability_blocks',
  'calendar_blocks',
  'ical_configs',
  'channel_accounts',
  'channel_manager',
  'cleaning_schedules',
  'cleaning_tasks',
  'cleaner_assignments',
  'cleaner_rates',
  'guest_codes',
  'ical_sources',
  'message_feedback',
  'payouts',
  'profiles',
  'property_ai_data',
  'subscriptions',
  'sync_logs',
  'task_accounting',
  'unanswered_questions',
  'users',
  'user_profiles'
];

async function analyzeKnownTables() {
  console.log('🔍 Analisi diretta delle tabelle conosciute...\n');

  const existingTables = [];
  const tablesWithData = [];

  for (const tableName of knownTables) {
    try {
      console.log(`📋 Controllo tabella: ${tableName}`);
      
      // Prova a contare i record
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`   ❌ Errore o tabella non esistente: ${countError.message}`);
      } else {
        existingTables.push(tableName);
        const recordCount = count || 0;
        console.log(`   ✅ Esiste - ${recordCount} record`);
        
        if (recordCount > 0) {
          tablesWithData.push({ name: tableName, count: recordCount });
          
          // Mostra alcuni dati di esempio
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(2);

          if (!sampleError && sampleData && sampleData.length > 0) {
            console.log(`   📝 Colonne: ${Object.keys(sampleData[0]).join(', ')}`);
            console.log(`   📄 Esempio record:`, JSON.stringify(sampleData[0], null, 2));
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Errore nell'analisi di ${tableName}: ${error.message}`);
    }
    
    console.log(''); // Riga vuota
  }

  // Riepilogo
  console.log('\n📊 RIEPILOGO ANALISI:');
  console.log(`✅ Tabelle esistenti: ${existingTables.length}`);
  console.log(`📦 Tabelle con dati: ${tablesWithData.length}`);
  
  console.log('\n🏠 TABELLE CON DATI:');
  tablesWithData.forEach(table => {
    console.log(`   • ${table.name}: ${table.count} record`);
  });

  // Analisi specifica per properties
  console.log('\n🔍 ANALISI DETTAGLIATA TABELLA PROPERTIES:');
  try {
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('*');

    if (propertiesError) {
      console.log(`❌ Errore nel recupero properties: ${propertiesError.message}`);
    } else if (propertiesData && propertiesData.length > 0) {
      console.log(`📊 TROVATI ${propertiesData.length} RECORD IN PROPERTIES!`);
      propertiesData.forEach((property, index) => {
        console.log(`\n📄 Proprietà ${index + 1}:`);
        console.log(JSON.stringify(property, null, 2));
      });
    } else {
      console.log('✅ Tabella properties vuota');
    }
  } catch (error) {
    console.log(`⚠️  Errore nell'analisi properties: ${error.message}`);
  }
}

analyzeKnownTables().then(() => {
  console.log('\n✅ Analisi completata!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});