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

async function analyzeDatabase() {
  console.log('🔍 Analisi completa del database Supabase...\n');

  try {
    // Query per ottenere tutte le tabelle nel database
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Errore nel recupero delle tabelle:', tablesError);
      return;
    }

    console.log(`📊 Trovate ${tables.length} tabelle nel database:\n`);

    // Analizza ogni tabella
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        // Conta i record in ogni tabella
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.log(`⚠️  ${tableName}: Errore nel conteggio - ${countError.message}`);
        } else {
          console.log(`📋 ${tableName}: ${count || 0} record`);
        }

        // Per le tabelle con dati, mostra alcuni esempi
        if (count > 0) {
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(3);

          if (!sampleError && sampleData && sampleData.length > 0) {
            console.log(`   📝 Esempio di colonne: ${Object.keys(sampleData[0]).join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`⚠️  ${tableName}: Errore nell'analisi - ${error.message}`);
      }
      
      console.log(''); // Riga vuota per separare
    }

    // Analisi specifica per tabelle correlate alle proprietà
    console.log('\n🏠 ANALISI TABELLE CORRELATE ALLE PROPRIETÀ:');
    const propertyRelatedTables = tables.filter(t => 
      t.table_name.includes('propert') || 
      t.table_name.includes('booking') || 
      t.table_name.includes('reservation') ||
      t.table_name.includes('listing')
    );

    for (const table of propertyRelatedTables) {
      const tableName = table.table_name;
      console.log(`\n🔍 Analisi dettagliata di: ${tableName}`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);

        if (error) {
          console.log(`   ❌ Errore: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`   📊 ${data.length} record trovati`);
          console.log(`   🔑 Colonne: ${Object.keys(data[0]).join(', ')}`);
          
          // Mostra i primi record
          data.forEach((record, index) => {
            console.log(`   📄 Record ${index + 1}:`, JSON.stringify(record, null, 2));
          });
        } else {
          console.log(`   ✅ Tabella vuota`);
        }
      } catch (error) {
        console.log(`   ⚠️  Errore nell'analisi: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Errore generale nell\'analisi:', error);
  }
}

analyzeDatabase().then(() => {
  console.log('\n✅ Analisi completata!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});