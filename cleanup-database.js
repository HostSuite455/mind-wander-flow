// Script per pulire il database da tutti i dati di test
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://blsiiqhijlubzhpmtswc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2lpcWhpamx1YnpocG10c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTA4NjUsImV4cCI6MjA2NDE2Njg2NX0.ruVpCtcbHeWa5mYQ67mX6AnIMp_6s7SXMfMp_LwJmek'

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupDatabase() {
  console.log('🧹 Iniziando pulizia database...')
  
  try {
    // Delete in order to respect foreign key constraints
    console.log('Eliminando payouts...')
    const { error: payoutsError } = await supabase.from('payouts').delete().neq('id', '')
    if (payoutsError) console.error('Errore payouts:', payoutsError)
    
    console.log('Eliminando task_accounting...')
    const { error: taskAccountingError } = await supabase.from('task_accounting').delete().neq('id', '')
    if (taskAccountingError) console.error('Errore task_accounting:', taskAccountingError)
    
    console.log('Eliminando cleaning_tasks...')
    const { error: cleaningTasksError } = await supabase.from('cleaning_tasks').delete().neq('id', '')
    if (cleaningTasksError) console.error('Errore cleaning_tasks:', cleaningTasksError)
    
    console.log('Eliminando reservations...')
    const { error: reservationsError } = await supabase.from('reservations').delete().neq('id', '')
    if (reservationsError) console.error('Errore reservations:', reservationsError)
    
    console.log('Eliminando bookings...')
    const { error: bookingsError } = await supabase.from('bookings').delete().neq('id', '')
    if (bookingsError) console.error('Errore bookings:', bookingsError)
    
    console.log('Eliminando calendar_blocks...')
    const { error: calendarBlocksError } = await supabase.from('calendar_blocks').delete().neq('id', '')
    if (calendarBlocksError) console.error('Errore calendar_blocks:', calendarBlocksError)
    
    console.log('Eliminando cleaner_rates...')
    const { error: cleanerRatesError } = await supabase.from('cleaner_rates').delete().neq('id', '')
    if (cleanerRatesError) console.error('Errore cleaner_rates:', cleanerRatesError)
    
    console.log('Eliminando cleaner_assignments...')
    const { error: cleanerAssignmentsError } = await supabase.from('cleaner_assignments').delete().neq('id', '')
    if (cleanerAssignmentsError) console.error('Errore cleaner_assignments:', cleanerAssignmentsError)
    
    console.log('Eliminando cleaners...')
    const { error: cleanersError } = await supabase.from('cleaners').delete().neq('id', '')
    if (cleanersError) console.error('Errore cleaners:', cleanersError)
    
    console.log('Eliminando channel_accounts...')
    const { error: channelAccountsError } = await supabase.from('channel_accounts').delete().neq('id', '')
    if (channelAccountsError) console.error('Errore channel_accounts:', channelAccountsError)
    
    console.log('Eliminando ical_urls...')
    const { error: icalUrlsError } = await supabase.from('ical_urls').delete().neq('id', '')
    if (icalUrlsError) console.error('Errore ical_urls:', icalUrlsError)
    
    console.log('Eliminando ical_configs...')
    const { error: icalConfigsError } = await supabase.from('ical_configs').delete().neq('id', '')
    if (icalConfigsError) console.error('Errore ical_configs:', icalConfigsError)
    
    console.log('Eliminando ical_sources...')
    const { error: icalSourcesError } = await supabase.from('ical_sources').delete().neq('id', '')
    if (icalSourcesError) console.error('Errore ical_sources:', icalSourcesError)
    
    console.log('Eliminando property_ai_data...')
    const { error: propertyAiDataError } = await supabase.from('property_ai_data').delete().neq('id', '')
    if (propertyAiDataError) console.error('Errore property_ai_data:', propertyAiDataError)
    
    console.log('Eliminando properties...')
    const { error: propertiesError } = await supabase.from('properties').delete().neq('id', '')
    if (propertiesError) console.error('Errore properties:', propertiesError)
    
    console.log('✅ Pulizia completata!')
    
    // Verify cleanup
    console.log('\n📊 Verifica stato database:')
    
    const tables = [
      'payouts', 'task_accounting', 'cleaning_tasks', 'reservations', 
      'bookings', 'calendar_blocks', 'cleaner_rates', 'cleaner_assignments',
      'cleaners', 'channel_accounts', 'ical_urls', 'ical_configs', 
      'ical_sources', 'property_ai_data', 'properties'
    ]
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
        if (error) {
          console.log(`❌ ${table}: Errore nel conteggio - ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count} record`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Errore - ${err.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error)
  }
}

// Esegui la pulizia
cleanupDatabase()
