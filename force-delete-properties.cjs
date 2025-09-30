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

async function investigateAndForceDelete() {
  const { createClient } = require('@supabase/supabase-js');
  
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti nel file .env');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Investigazione tabella properties...\n');
  
  // 1. Verifica i record esistenti
  console.log('📋 Record attuali nella tabella properties:');
  console.log('==========================================');
  
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('*');
    
  if (propError) {
    console.log('❌ Errore leggendo properties:', propError.message);
    return;
  }
  
  console.log(`Trovati ${properties?.length || 0} record:`);
  if (properties && properties.length > 0) {
    properties.forEach((prop, index) => {
      console.log(`\n${index + 1}. ID: ${prop.id}`);
      console.log(`   Nome: ${prop.nome || 'N/A'}`);
      console.log(`   Host ID: ${prop.host_id || 'N/A'}`);
      console.log(`   Creato: ${prop.created_at || 'N/A'}`);
    });
  }
  
  // 2. Verifica tabelle che potrebbero avere riferimenti
  console.log('\n🔗 Verifica vincoli di chiave esterna...');
  console.log('========================================');
  
  const tablesToCheck = [
    'bookings',
    'calendar_blocks', 
    'ical_configs',
    'unanswered_questions',
    'property_ai_data',
    'cleaning_tasks'
  ];
  
  const referencingTables = [];
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('property_id')
        .not('property_id', 'is', null);
        
      if (!error && data && data.length > 0) {
        const uniquePropertyIds = [...new Set(data.map(item => item.property_id))];
        console.log(`📌 ${tableName}: ${data.length} record con property_id (${uniquePropertyIds.join(', ')})`);
        referencingTables.push({ table: tableName, count: data.length, propertyIds: uniquePropertyIds });
      } else {
        console.log(`✅ ${tableName}: Nessun riferimento`);
      }
    } catch (err) {
      console.log(`⚠️  ${tableName}: Errore verifica - ${err.message}`);
    }
  }
  
  // 3. Elimina prima i riferimenti, poi le proprietà
  console.log('\n🗑️  Eliminazione forzata...');
  console.log('===========================');
  
  if (referencingTables.length > 0) {
    console.log('🧹 Eliminando prima i riferimenti...');
    
    for (const ref of referencingTables) {
      try {
        const { error } = await supabase
          .from(ref.table)
          .delete()
          .not('property_id', 'is', null);
          
        if (error) {
          console.log(`❌ Errore eliminando da ${ref.table}: ${error.message}`);
        } else {
          console.log(`✅ Eliminati ${ref.count} record da ${ref.table}`);
        }
      } catch (err) {
        console.log(`❌ Errore eliminando da ${ref.table}: ${err.message}`);
      }
    }
  }
  
  // 4. Ora elimina le proprietà
  console.log('\n🏠 Eliminando le proprietà...');
  
  if (properties && properties.length > 0) {
    for (const prop of properties) {
      try {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', prop.id);
          
        if (error) {
          console.log(`❌ Errore eliminando proprietà ${prop.id}: ${error.message}`);
        } else {
          console.log(`✅ Eliminata proprietà: ${prop.nome} (ID: ${prop.id})`);
        }
      } catch (err) {
        console.log(`❌ Errore eliminando proprietà ${prop.id}: ${err.message}`);
      }
    }
  }
  
  // 5. Verifica finale
  console.log('\n🔍 Verifica finale...');
  console.log('====================');
  
  const { data: finalCheck, error: finalError } = await supabase
    .from('properties')
    .select('*');
    
  if (finalError) {
    console.log('❌ Errore verifica finale:', finalError.message);
  } else {
    console.log(`📊 Record rimanenti in properties: ${finalCheck?.length || 0}`);
    
    if (finalCheck && finalCheck.length === 0) {
      console.log('🎉 Tabella properties completamente pulita!');
    } else {
      console.log('⚠️  Alcuni record sono ancora presenti:');
      finalCheck?.forEach(prop => {
        console.log(`   - ${prop.nome} (ID: ${prop.id})`);
      });
    }
  }
  
  return {
    initialCount: properties?.length || 0,
    finalCount: finalCheck?.length || 0,
    referencingTables: referencingTables.length
  };
}

async function main() {
  try {
    console.log('🚀 Avvio eliminazione forzata dei record properties...\n');
    
    const result = await investigateAndForceDelete();
    
    console.log('\n📊 Riepilogo operazione:');
    console.log('========================');
    console.log(`Record iniziali: ${result.initialCount}`);
    console.log(`Record finali: ${result.finalCount}`);
    console.log(`Tabelle con riferimenti: ${result.referencingTables}`);
    
    if (result.finalCount === 0) {
      console.log('\n✅ SUCCESSO: Tabella properties completamente pulita!');
    } else {
      console.log('\n⚠️  ATTENZIONE: Alcuni record sono ancora presenti.');
      console.log('💡 Potrebbe essere necessario eliminare manualmente via SQL.');
    }
    
  } catch (error) {
    console.error('❌ Errore durante l\'operazione:', error);
    process.exit(1);
  }
}

main();