const { createClient } = require('@supabase/supabase-js');

// Configurazione Supabase con chiavi hardcoded per semplicità
const supabaseUrl = 'https://blsiiqhijlubzhpmtswc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2lpcWhpamx1YnpocG10c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTA4NjUsImV4cCI6MjA2NDE2Njg2NX0.ruVpCtcbHeWa5mYQ67mX6AnIMp_6s7SXMfMp_LwJmek';

const supabase = createClient(supabaseUrl, supabaseKey);

// Email dell'utente da verificare
const USER_EMAIL = 'deborascialabba@gmail.com';

async function checkUserData() {
  console.log(`🔍 Verificando dati residui per l'utente: ${USER_EMAIL}`);
  console.log('============================================================');

  try {
    // Dato che non possiamo accedere ad auth.users, cerchiamo direttamente nelle tabelle pubbliche
    // usando l'email come riferimento dove possibile
    
    console.log('\n=== STEP 1: Verifica profili ===');
    
    // Cerchiamo profili che potrebbero essere collegati all'utente
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.log('❌ Errore nella ricerca profiles:', profileError.message);
    } else {
      console.log(`📊 Totale profili nel sistema: ${profiles.length}`);
      if (profiles.length > 0) {
        console.log('⚠️  Profili presenti:', profiles.map(p => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          role: p.role,
          created_at: p.created_at
        })));
      } else {
        console.log('✅ Nessun profilo trovato nella tabella profiles');
      }
    }

    console.log('\n=== STEP 2: Verifica proprietà ===');
    
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*');

    if (propError) {
      console.log('❌ Errore nella ricerca properties:', propError.message);
    } else {
      console.log(`📊 Totale proprietà nel sistema: ${properties.length}`);
      if (properties.length > 0) {
        console.log('⚠️  Proprietà presenti:', properties.map(p => ({
          id: p.id,
          nome: p.nome,
          host_id: p.host_id,
          created_at: p.created_at
        })));
      } else {
        console.log('✅ Nessuna proprietà trovata nella tabella properties');
      }
    }

    console.log('\n=== STEP 3: Verifica configurazioni canali ===');
    
    const { data: channels, error: channelError } = await supabase
      .from('ical_configs')
      .select('*');

    if (channelError) {
      console.log('❌ Errore nella ricerca ical_configs:', channelError.message);
    } else {
      console.log(`📊 Totale configurazioni canali: ${channels.length}`);
      if (channels.length > 0) {
        console.log('⚠️  Configurazioni presenti:', channels.map(c => ({
          id: c.id,
          property_id: c.property_id,
          channel_manager_name: c.channel_manager_name,
          created_at: c.created_at
        })));
      } else {
        console.log('✅ Nessuna configurazione canale trovata');
      }
    }

    console.log('\n=== STEP 4: Verifica prenotazioni ===');
    
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*');

    if (bookingError) {
      console.log('❌ Errore nella ricerca bookings:', bookingError.message);
    } else {
      console.log(`📊 Totale prenotazioni: ${bookings.length}`);
      if (bookings.length > 0) {
        console.log('⚠️  Prenotazioni presenti:', bookings.map(b => ({
          id: b.id,
          property_id: b.property_id,
          guest_name: b.guest_name,
          check_in: b.check_in,
          check_out: b.check_out
        })));
      } else {
        console.log('✅ Nessuna prenotazione trovata');
      }
    }

    console.log('\n=== STEP 5: Verifica blocchi calendario ===');
    
    const { data: calendarBlocks, error: calendarError } = await supabase
      .from('calendar_blocks')
      .select('*');

    if (calendarError) {
      console.log('❌ Errore nella ricerca calendar_blocks:', calendarError.message);
    } else {
      console.log(`📊 Totale blocchi calendario: ${calendarBlocks.length}`);
      if (calendarBlocks.length > 0) {
        console.log('⚠️  Blocchi calendario presenti:', calendarBlocks.map(cb => ({
          id: cb.id,
          property_id: cb.property_id,
          start_date: cb.start_date,
          end_date: cb.end_date,
          reason: cb.reason
        })));
      } else {
        console.log('✅ Nessun blocco calendario trovato');
      }
    }

    console.log('\n============================================================');
    console.log('🏁 RIEPILOGO VERIFICA COMPLETATA');
    console.log('============================================================');

  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
  }
}

checkUserData();