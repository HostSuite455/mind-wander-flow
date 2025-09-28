// Script per creare dati di test per iCal usando il client Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://blsiiqhijlubzhpmtswc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2lpcWhpamx1YnpocG10c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTA4NjUsImV4cCI6MjA2NDE2Njg2NX0.ruVpCtcbHeWa5mYQ67mX6AnIMp_6s7SXMfMp_LwJmek'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestIcalData() {
  try {
    console.log('🔄 Creazione dati di test iCal...')

    // ID delle proprietà dai log
    const propertyIds = [
      '84785210-eaf7-43ec-9e33-f0d354cac2f4', // Appartamento moderno
      'dba94783-c312-4af0-aca2-d8311f5895e6'  // Centro storico
    ]

    for (const propertyId of propertyIds) {
      console.log(`📝 Creazione configurazione per proprietà: ${propertyId}`)

      // Crea configurazione iCal
      const { data: configData, error: configError } = await supabase
        .from('ical_configs')
        .insert({
          property_id: propertyId,
          config_type: 'ota_direct',
          is_active: true,
          status: 'active'
        })
        .select()
        .single()

      if (configError) {
        console.error('❌ Errore creazione config:', configError)
        continue
      }

      console.log('✅ Configurazione creata:', configData.id)

      // Crea URL iCal di test
      const testUrls = [
        {
          url: 'https://admin.booking.com/hotel/hoteladmin/ical.html?ses=12345&hotel_id=67890&lang=it',
          source: 'booking'
        },
        {
          url: 'https://www.airbnb.it/calendar/ical/123456789.ics?s=abcdef123456',
          source: 'airbnb'
        }
      ]

      for (const [index, urlData] of testUrls.entries()) {
        const { data: urlResult, error: urlError } = await supabase
          .from('ical_urls')
          .insert({
            ical_config_id: configData.id,
            url: urlData.url,
            source: urlData.source,
            is_active: true,
            is_primary: index === 0
          })
          .select()

        if (urlError) {
          console.error('❌ Errore creazione URL:', urlError)
        } else {
          console.log(`✅ URL ${urlData.source} creato`)
        }
      }
    }

    // Verifica i dati creati
    console.log('\n🔍 Verifica dati creati:')
    const { data: verification, error: verifyError } = await supabase
      .from('ical_urls')
      .select(`
        id, url, source, is_active,
        ical_configs!inner(
          id, property_id, config_type, is_active
        )
      `)
      .eq('ical_configs.is_active', true)

    if (verifyError) {
      console.error('❌ Errore verifica:', verifyError)
    } else {
      console.log('📊 Dati iCal creati:', verification.length)
      verification.forEach(url => {
        console.log(`  - ${url.source}: ${url.url.substring(0, 50)}...`)
      })
    }

  } catch (error) {
    console.error('❌ Errore generale:', error)
  }
}

createTestIcalData()