// Script per creare dati di test nel database Supabase
const SUPABASE_URL = "https://blsiiqhijlubzhpmtswc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2lpcWhpamx1YnpocG10c3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTA4NjUsImV4cCI6MjA2NDE2Njg2NX0.ruVpCtcbHeWa5mYQ67mX6AnIMp_6s7SXMfMp_LwJmek";

const USER_ID = "6c8c88fe-b9ff-4ded-9c1a-f3d8f81fe99b";

// Funzione per generare UUID validi
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createTestData() {
  console.log("Creazione dati di test per l'utente:", USER_ID);

  // 1. Creare proprietà di test
  const prop1Id = generateUUID();
  const prop2Id = generateUUID();
  
  const properties = [
    {
      id: prop1Id,
      host_id: USER_ID,
      nome: "Villa Toscana",
      address: "Via del Sole 123, Firenze",
      max_guests: 6,
      status: "active",
      created_at: new Date().toISOString()
    },
    {
      id: prop2Id, 
      host_id: USER_ID,
      nome: "Appartamento Roma Centro",
      address: "Via del Corso 456, Roma",
      max_guests: 4,
      status: "active",
      created_at: new Date().toISOString()
    }
  ];

  // 2. Creare prenotazioni di test
  const bookings = [
    {
      id: generateUUID(),
      property_id: prop1Id,
      host_id: USER_ID,
      external_booking_id: "ext-booking-1",
      guest_name: "Mario Rossi",
      guests_count: 4,
      check_in: "2025-02-15",
      check_out: "2025-02-20",
      total_price: 750.00,
      booking_status: "confirmed",
      created_at: new Date().toISOString()
    },
    {
      id: generateUUID(),
      property_id: prop2Id,
      host_id: USER_ID,
      external_booking_id: "ext-booking-2",
      guest_name: "Anna Bianchi",
      guests_count: 2,
      check_in: "2025-03-01",
      check_out: "2025-03-05",
      total_price: 400.00,
      booking_status: "confirmed",
      created_at: new Date().toISOString()
    }
  ];

  // 3. Creare blocchi calendario di test
  const calendarBlocks = [
    {
      id: generateUUID(),
      host_id: USER_ID,
      property_id: prop1Id,
      start_date: "2025-02-25",
      end_date: "2025-02-28",
      reason: "Manutenzione",
      source: "manual",
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  try {
    // Inserire proprietà
    console.log("Inserimento proprietà...");
    for (const property of properties) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(property)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Errore inserimento proprietà ${property.nome}:`, error);
      } else {
        console.log(`✓ Proprietà creata: ${property.nome}`);
      }
    }

    // Inserire prenotazioni
    console.log("Inserimento prenotazioni...");
    for (const booking of bookings) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(booking)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Errore inserimento prenotazione ${booking.guest_name}:`, error);
      } else {
        console.log(`✓ Prenotazione creata: ${booking.guest_name}`);
      }
    }

    // Inserire blocchi calendario
    console.log("Inserimento blocchi calendario...");
    for (const block of calendarBlocks) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/calendar_blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(block)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Errore inserimento blocco calendario:`, error);
      } else {
        console.log(`✓ Blocco calendario creato: ${block.reason}`);
      }
    }

    console.log("\n✅ Dati di test creati con successo!");
    console.log("Ora puoi ricaricare la pagina del calendario per vedere i dati.");

  } catch (error) {
    console.error("Errore durante la creazione dei dati di test:", error);
  }
}

// Eseguire lo script
createTestData();