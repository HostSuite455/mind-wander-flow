const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase
const supabaseUrl = 'https://blsiiqhijlubzhpmtswc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2lpcWhpamx1YnpocG10c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTA4NjUsImV4cCI6MjA2NDE2Njg2NX0.ruVpCtcbHeWa5mYQ67mX6AnIMp_6s7SXMfMp_LwJmek';

const supabase = createClient(supabaseUrl, supabaseKey);

// ID dell'utente specifico da pulire
const USER_ID = '8b5b8b5b-8b5b-8b5b-8b5b-8b5b8b5b8b5b'; // Sostituire con l'ID utente reale

async function cleanupDatabase() {
  console.log('🧹 Inizio pulizia completa del database...');
  
  try {
    // 1. Elimina tutti i dati dalle tabelle correlate alle proprietà
    const tablesToClean = [
      'property_questions',
      'property_answers', 
      'property_bookings',
      'property_reviews',
      'property_amenities',
      'property_photos',
      'property_availability',
      'property_pricing',
      'property_settings',
      'ical_configurations',
      'calendar_events',
      'cleaning_schedules',
      'maintenance_requests',
      'guest_communications',
      'property_analytics',
      'property_documents',
      'property_templates',
      'property_integrations',
      'properties' // Tabella principale delle proprietà per ultima
    ];

    for (const table of tablesToClean) {
      console.log(`🗑️ Pulizia tabella: ${table}`);
      
      try {
        // Prima prova a eliminare tutti i record della tabella
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina tutto tranne un ID impossibile
        
        if (deleteError) {
          console.log(`⚠️ Errore durante l'eliminazione da ${table}:`, deleteError.message);
          
          // Se fallisce, prova a eliminare per user_id o host_id
          if (deleteError.message.includes('RLS') || deleteError.message.includes('policy')) {
            console.log(`🔄 Tentativo alternativo per ${table} con filtro utente...`);
            
            const { error: userDeleteError } = await supabase
              .from(table)
              .delete()
              .eq('user_id', USER_ID);
            
            if (userDeleteError) {
              const { error: hostDeleteError } = await supabase
                .from(table)
                .delete()
                .eq('host_id', USER_ID);
              
              if (hostDeleteError) {
                console.log(`❌ Impossibile eliminare da ${table}:`, hostDeleteError.message);
              } else {
                console.log(`✅ Eliminati record da ${table} per host_id`);
              }
            } else {
              console.log(`✅ Eliminati record da ${table} per user_id`);
            }
          }
        } else {
          console.log(`✅ Tabella ${table} pulita completamente`);
        }
      } catch (tableError) {
        console.log(`⚠️ Tabella ${table} potrebbe non esistere o non essere accessibile:`, tableError.message);
      }
    }

    // 2. Pulizia aggiuntiva per dati dell'utente specifico
    console.log('\n🔍 Pulizia dati utente specifici...');
    
    const userTables = [
      'user_profiles',
      'user_preferences', 
      'user_notifications',
      'user_sessions',
      'user_activity_logs'
    ];

    for (const table of userTables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', USER_ID);
        
        if (error) {
          console.log(`⚠️ Errore pulizia ${table}:`, error.message);
        } else {
          console.log(`✅ Pulita tabella utente: ${table}`);
        }
      } catch (error) {
        console.log(`⚠️ Tabella ${table} non accessibile:`, error.message);
      }
    }

    // 3. Verifica finale
    console.log('\n🔍 Verifica finale...');
    
    const { data: remainingProperties, error: checkError } = await supabase
      .from('properties')
      .select('id, name')
      .limit(10);
    
    if (checkError) {
      console.log('⚠️ Errore durante la verifica:', checkError.message);
    } else {
      console.log(`📊 Proprietà rimanenti nel database: ${remainingProperties?.length || 0}`);
      if (remainingProperties && remainingProperties.length > 0) {
        console.log('🏠 Proprietà trovate:', remainingProperties.map(p => `${p.name} (${p.id})`).join(', '));
      }
    }

    console.log('\n✅ Pulizia completa del database terminata!');
    console.log('🔄 Ricarica l\'applicazione per verificare che non ci siano più dati residui.');
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia del database:', error);
  }
}

// Esegui la pulizia
cleanupDatabase().then(() => {
  console.log('\n🎯 Script di pulizia completato. Controlla i risultati sopra.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Errore fatale:', error);
  process.exit(1);
});