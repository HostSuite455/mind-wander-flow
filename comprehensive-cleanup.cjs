const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase
const supabaseUrl = 'https://blsiiqhijlubzhpmtswc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2lpcWhpamx1YnpocG10c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTA4NjUsImV4cCI6MjA2NDE2Njg2NX0.ruVpCtcbHeWa5mYQ67mX6AnIMp_6s7SXMfMp_LwJmek';

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_EMAIL = 'deborascialabba@gmail.com';

async function comprehensiveCleanup() {
  console.log('🧹 AVVIO CLEANUP COMPLETO DEL DATABASE');
  console.log('=====================================');
  
  try {
    // 1. Trova l'ID utente - la tabella profiles non ha email, cerchiamo direttamente nelle proprietà
    console.log('🔍 Ricerca proprietà per utente:', USER_EMAIL);
    
    // Prima controlliamo se ci sono proprietà nel database
    const { data: allProperties } = await supabase
      .from('properties')
      .select('*');
    
    console.log('📊 Proprietà totali nel database:', allProperties?.length || 0);
    if (allProperties && allProperties.length > 0) {
      console.log('🏠 Prime 3 proprietà:', allProperties.slice(0, 3));
    }
    
    // Cerchiamo anche nella tabella auth.users se accessibile
    let userId = null;
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      console.log('👥 Utenti auth trovati:', authUsers?.users?.length || 0);
      
      const targetUser = authUsers?.users?.find(user => user.email === USER_EMAIL);
      if (targetUser) {
        userId = targetUser.id;
        console.log('✅ Utente trovato in auth:', targetUser.email, 'ID:', userId);
      } else {
        console.log('⚠️ Utente non trovato in auth per email:', USER_EMAIL);
      }
    } catch (authError) {
      console.log('⚠️ Impossibile accedere a auth.users:', authError.message);
    }
    
    // 2. ELIMINAZIONE COMPLETA - TUTTE LE TABELLE
    console.log('\n🗑️ ELIMINAZIONE DATI DA TUTTE LE TABELLE');
    console.log('==========================================');
    
    const tablesToClean = [
      // Tabelle principali
      'properties',
      'cleaners', 
      'bookings',
      'calendar_blocks',
      'unanswered_questions',
      
      // Tabelle iCal e canali
      'ical_configs',
      'ical_urls', 
      'channel_accounts',
      'channel_integrations',
      
      // Tabelle di configurazione
      'property_settings',
      'property_amenities',
      'property_images',
      'property_pricing',
      
      // Tabelle di gestione
      'guest_communications',
      'maintenance_requests',
      'reviews',
      'analytics_data',
      
      // Tabelle di sistema
      'notifications',
      'activity_logs',
      'user_preferences'
    ];
    
    const results = {};
    
    for (const table of tablesToClean) {
      try {
        console.log(`\n🧹 Pulizia tabella: ${table}`);
        
        // Prima conta i record
        const { count: beforeCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   📊 Record prima della pulizia: ${beforeCount || 0}`);
        
        if (beforeCount && beforeCount > 0) {
          // Elimina tutti i record dalla tabella
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina tutto tranne un ID impossibile
          
          if (deleteError) {
            console.log(`   ⚠️ Errore eliminazione da ${table}:`, deleteError.message);
            results[table] = { error: deleteError.message, before: beforeCount };
          } else {
            // Verifica eliminazione
            const { count: afterCount } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
            
            console.log(`   ✅ Record dopo la pulizia: ${afterCount || 0}`);
            results[table] = { before: beforeCount, after: afterCount || 0, success: true };
          }
        } else {
          console.log(`   ✅ Tabella già vuota`);
          results[table] = { before: 0, after: 0, success: true };
        }
        
      } catch (error) {
        console.log(`   ❌ Errore con tabella ${table}:`, error.message);
        results[table] = { error: error.message };
      }
    }
    
    // 3. PULIZIA SPECIFICA PER UTENTE (se trovato)
    if (userId) {
      console.log('\n🎯 PULIZIA SPECIFICA PER UTENTE');
      console.log('===============================');
      
      const userSpecificTables = [
        { table: 'profiles', column: 'id' },
        { table: 'user_sessions', column: 'user_id' },
        { table: 'user_metadata', column: 'user_id' }
      ];
      
      for (const { table, column } of userSpecificTables) {
        try {
          const { count: beforeCount } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq(column, userId);
          
          if (beforeCount && beforeCount > 0) {
            console.log(`🧹 Eliminazione da ${table} per utente: ${beforeCount} record`);
            
            const { error } = await supabase
              .from(table)
              .delete()
              .eq(column, userId);
            
            if (error) {
              console.log(`   ⚠️ Errore:`, error.message);
            } else {
              console.log(`   ✅ Eliminati ${beforeCount} record da ${table}`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Errore con ${table}:`, error.message);
        }
      }
    }
    
    // 4. VERIFICA FINALE
    console.log('\n🔍 VERIFICA FINALE');
    console.log('==================');
    
    let totalRecordsRemaining = 0;
    
    for (const table of tablesToClean) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (count && count > 0) {
          console.log(`⚠️ ${table}: ${count} record rimanenti`);
          totalRecordsRemaining += count;
        } else {
          console.log(`✅ ${table}: 0 record`);
        }
      } catch (error) {
        console.log(`❌ Errore verifica ${table}:`, error.message);
      }
    }
    
    // 5. RIEPILOGO FINALE
    console.log('\n📋 RIEPILOGO CLEANUP');
    console.log('====================');
    console.log(`🎯 Utente target: ${USER_EMAIL}`);
    console.log(`🆔 User ID: ${userId || 'Non trovato'}`);
    console.log(`📊 Tabelle processate: ${tablesToClean.length}`);
    console.log(`🗑️ Record totali rimanenti: ${totalRecordsRemaining}`);
    
    if (totalRecordsRemaining === 0) {
      console.log('🎉 CLEANUP COMPLETATO CON SUCCESSO!');
      console.log('✨ Database completamente pulito e pronto per il setup wizard');
    } else {
      console.log('⚠️ Alcuni record sono ancora presenti nel database');
      console.log('🔍 Controlla i dettagli sopra per identificare le tabelle con dati residui');
    }
    
    console.log('\n📈 DETTAGLI PER TABELLA:');
    Object.entries(results).forEach(([table, result]) => {
      if (result.error) {
        console.log(`❌ ${table}: ERRORE - ${result.error}`);
      } else if (result.success) {
        console.log(`✅ ${table}: ${result.before} → ${result.after} record`);
      }
    });
    
  } catch (error) {
    console.error('💥 ERRORE FATALE:', error);
  }
}

// Esegui il cleanup
comprehensiveCleanup()
  .then(() => {
    console.log('\n🏁 Script completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Errore durante l\'esecuzione:', error);
    process.exit(1);
  });