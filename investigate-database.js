// Script per investigare i dati rimasti nel database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://blsiiqhijlubzhpmtswc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2lpcWhpamx1YnpocG10c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTA4NjUsImV4cCI6MjA2NDE2Njg2NX0.ruVpCtcbHeWa5mYQ67mX6AnIMp_6s7SXMfMp_LwJmek'

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateDatabase() {
  console.log('🔍 Investigando dati rimasti nel database...\n')
  
  // Controlla tutte le tabelle principali
  const tables = [
    'properties', 'cleaners', 'ical_configs', 'ical_urls', 'ical_sources',
    'bookings', 'reservations', 'cleaning_tasks', 'calendar_blocks',
    'channel_accounts', 'cleaner_assignments', 'cleaner_rates',
    'task_accounting', 'payouts', 'property_ai_data'
  ]
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Tabella: ${table}`)
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
      
      if (error) {
        console.log(`❌ Errore: ${error.message}`)
        continue
      }
      
      console.log(`📊 Record totali: ${count}`)
      
      if (data && data.length > 0) {
        console.log('🔍 Primi 3 record:')
        data.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. ID: ${record.id || 'N/A'}`)
          if (record.nome) console.log(`     Nome: ${record.nome}`)
          if (record.name) console.log(`     Name: ${record.name}`)
          if (record.host_id) console.log(`     Host ID: ${record.host_id}`)
          if (record.property_id) console.log(`     Property ID: ${record.property_id}`)
          if (record.user_id) console.log(`     User ID: ${record.user_id}`)
          if (record.url) console.log(`     URL: ${record.url}`)
          if (record.source) console.log(`     Source: ${record.source}`)
          if (record.created_at) console.log(`     Created: ${record.created_at}`)
          console.log('')
        })
      }
    } catch (err) {
      console.log(`❌ Errore catch: ${err.message}`)
    }
  }
  
  // Controlla specificamente per l'utente deborascialabba@gmail.com
  console.log('\n🔍 Investigando dati per deborascialabba@gmail.com...')
  
  try {
    // Prima ottieni l'ID utente
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user?.email || 'Non autenticato')
    
    // Cerca nelle tabelle profiles se esiste
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (!profilesError && profiles) {
      console.log(`\n📋 Profiles trovati: ${profiles.length}`)
      profiles.forEach(profile => {
        console.log(`  - ID: ${profile.id}, Email: ${profile.email || 'N/A'}`)
      })
    }
    
  } catch (err) {
    console.log(`❌ Errore nella ricerca utente: ${err.message}`)
  }
}

// Esegui l'investigazione
investigateDatabase()