const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase
const supabaseUrl = 'https://ixqjqfkgqxqjqfkgqxqj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZmtncXhxanFma2dxeHFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjY2MzE5MSwiZXhwIjoyMDQyMjM5MTkxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllTables() {
  console.log('🔍 VERIFICA COMPLETA DATABASE - Ricerca dati residui');
  console.log('=' .repeat(60));
  
  const userEmail = 'deborascialabba@gmail.com';
  console.log(`📧 Email utente: ${userEmail}`);
  console.log('');

  // Lista di tutte le tabelle da verificare
  const tablesToCheck = [
    'profiles',
    'properties', 
    'ical_configs',
    'ical_urls',
    'bookings',
    'calendar_blocks',
    'channel_accounts',
    'listings',
    'reservations',
    'availability_blocks',
    'sync_logs',
    'ical_sources',
    'cleaners',
    'cleaning_tasks',
    'cleaner_assignments',
    'cleaner_rates',
    'task_accounting',
    'payouts',
    'guest_codes',
    'unanswered_questions',
    'property_ai_data'
  ];

  let totalRecordsFound = 0;
  let tablesWithData = [];

  for (let i = 0; i < tablesToCheck.length; i++) {
    const tableName = tablesToCheck[i];
    console.log(`STEP ${i + 1}: Verifica tabella "${tableName}"`);
    
    try {
      // Prima verifica: conteggio totale record
      const { count: totalCount, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ Errore nel conteggio per ${tableName}: ${countError.message}`);
        continue;
      }

      console.log(`   📊 Record totali in ${tableName}: ${totalCount || 0}`);

      if (totalCount > 0) {
        // Seconda verifica: ottieni alcuni record di esempio
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);

        if (sampleError) {
          console.log(`   ⚠️ Errore nel recupero dati di esempio: ${sampleError.message}`);
        } else {
          console.log(`   📋 Primi ${Math.min(5, sampleData.length)} record:`);
          sampleData.forEach((record, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(record).substring(0, 100)}...`);
          });
          
          totalRecordsFound += totalCount;
          tablesWithData.push({ table: tableName, count: totalCount });
        }
      } else {
        console.log(`   ✅ Tabella ${tableName} vuota`);
      }

    } catch (error) {
      console.log(`❌ Errore durante la verifica di ${tableName}: ${error.message}`);
    }
    
    console.log('');
  }

  // Riepilogo finale
  console.log('=' .repeat(60));
  console.log('📊 RIEPILOGO FINALE');
  console.log('=' .repeat(60));
  console.log(`🔢 Record totali trovati: ${totalRecordsFound}`);
  console.log(`📋 Tabelle con dati: ${tablesWithData.length}`);
  
  if (tablesWithData.length > 0) {
    console.log('\n📋 DETTAGLIO TABELLE CON DATI:');
    tablesWithData.forEach(({ table, count }) => {
      console.log(`   • ${table}: ${count} record`);
    });
  } else {
    console.log('✅ Nessuna tabella contiene dati');
  }

  // Verifica specifica per l'utente
  console.log('\n🔍 VERIFICA SPECIFICA UTENTE');
  console.log('-' .repeat(40));
  
  try {
    // Cerca nelle tabelle che potrebbero avere riferimenti all'utente
    const userSpecificTables = ['profiles', 'properties', 'channel_accounts'];
    
    for (const table of userSpecificTables) {
      console.log(`Verifica ${table} per host_id specifico...`);
      
      // Prima cerca per email (se la tabella ha il campo email)
      if (table === 'profiles') {
        const { data: profileData, error: profileError } = await supabase
          .from(table)
          .select('*')
          .eq('email', userEmail);
          
        if (!profileError && profileData && profileData.length > 0) {
          console.log(`   ⚠️ Trovati ${profileData.length} record in ${table} per email ${userEmail}`);
          profileData.forEach(record => {
            console.log(`      ID: ${record.id}, Nome: ${record.first_name} ${record.last_name}`);
          });
        }
      }
      
      // Poi cerca per host_id (se disponibile)
      const { data: hostData, error: hostError } = await supabase
        .from(table)
        .select('*')
        .limit(10);
        
      if (!hostError && hostData && hostData.length > 0) {
        console.log(`   📋 Trovati ${hostData.length} record in ${table}`);
        hostData.forEach((record, index) => {
          console.log(`      ${index + 1}. ${JSON.stringify(record).substring(0, 150)}...`);
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Errore nella verifica specifica utente: ${error.message}`);
  }

  console.log('\n🏁 Verifica completata!');
}

// Esegui la verifica
checkAllTables().catch(console.error);