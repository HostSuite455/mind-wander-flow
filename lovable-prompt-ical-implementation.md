# Prompt per Lovable: Implementazione Funzionalità iCal Complete

## Obiettivo
Implementare completamente le funzionalità iCal per permettere l'inserimento di link iCal e la lettura delle prenotazioni nel calendario dell'applicazione.

## Contesto Attuale
L'applicazione ha già:
- ✅ Interfaccia utente per gestire configurazioni iCal (`/dashboard/channels`)
- ✅ Database tables: `ical_configs`, `ical_urls`, `calendar_blocks`
- ✅ Funzioni helper in `src/lib/supaIcal.ts`
- ✅ Edge functions stub: `ics-sync` e `ics-export`
- ✅ Componenti UI per gestire URL iCal

## Funzionalità da Implementare

### 1. Edge Function `ics-export` (PRIORITÀ ALTA)
**File:** `supabase/functions/ics-export/index.ts`

**Obiettivo:** Generare feed iCal delle disponibilità per export verso canali esterni

**Implementazione richiesta:**
```typescript
// Endpoint: GET /functions/v1/ics-export?property_id=xxx&token=xxx
// Deve:
// 1. Validare il token di accesso per la proprietà
// 2. Recuperare tutti i calendar_blocks per la proprietà
// 3. Generare formato iCal standard (RFC 5545)
// 4. Restituire Content-Type: text/calendar
// 5. Includere eventi VEVENT per ogni blocco calendario
```

**Specifiche tecniche:**
- Formato iCal RFC 5545 compliant
- Timezone support (Europe/Rome)
- VEVENT per ogni calendar_block con:
  - DTSTART/DTEND dalle date del blocco
  - SUMMARY: "Non disponibile" o descrizione custom
  - UID univoco basato su block_id
  - DTSTAMP corrente

### 2. Edge Function `ics-sync` (PRIORITÀ ALTA)
**File:** `supabase/functions/ics-sync/index.ts`

**Obiettivo:** Sincronizzare prenotazioni da URL iCal esterni

**Implementazione richiesta:**
```typescript
// Endpoint: POST /functions/v1/ics-sync
// Body: { ical_url_id: string }
// Deve:
// 1. Recuperare l'URL iCal dal database
// 2. Fare fetch del contenuto iCal
// 3. Parsare gli eventi VEVENT
// 4. Creare/aggiornare calendar_blocks corrispondenti
// 5. Aggiornare last_sync_at nell'ical_url
```

**Specifiche tecniche:**
- Parser iCal robusto (gestire RRULE, timezone, etc.)
- Deduplicazione eventi esistenti
- Gestione errori di rete e parsing
- Logging dettagliato per debug
- Supporto per eventi ricorrenti (RRULE)

### 3. Integrazione Calendario Frontend (PRIORITÀ MEDIA)
**File:** `src/pages/calendario/index.tsx`

**Miglioramenti richiesti:**
- Visualizzare eventi importati da iCal con icona distintiva
- Mostrare fonte dell'evento (Booking.com, Airbnb, etc.)
- Permettere refresh manuale delle sincronizzazioni
- Indicatori visivi per stato sincronizzazione

### 4. Automazione Sincronizzazione (PRIORITÀ MEDIA)
**Implementazione:** Cron job o webhook per sincronizzazione automatica

**Opzioni:**
1. **Supabase Cron:** Trigger periodico ogni 30 minuti
2. **GitHub Actions:** Workflow schedulato
3. **Webhook:** Trigger da canali esterni quando disponibile

### 5. Gestione Token Export (PRIORITÀ BASSA)
**File:** `src/pages/dashboard/ChannelsPage.tsx`

**Miglioramenti:**
- Generazione automatica token sicuri per export
- Copia URL export completo con un click
- Validazione e refresh token
- Monitoraggio utilizzo export

## Specifiche Tecniche Dettagliate

### Formato iCal Export
```ical
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MindWanderFlow//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VTIMEZONE
TZID:Europe/Rome
...
END:VTIMEZONE
BEGIN:VEVENT
UID:block-{block_id}@mindwanderflow.com
DTSTART;TZID=Europe/Rome:20241201T150000
DTEND;TZID=Europe/Rome:20241203T110000
SUMMARY:Non disponibile
DESCRIPTION:Periodo bloccato
DTSTAMP:20241201T120000Z
END:VEVENT
END:VCALENDAR
```

### Database Schema Utilizzo
```sql
-- Recuperare blocchi per export
SELECT * FROM calendar_blocks 
WHERE property_id = $1 
AND (end_date >= CURRENT_DATE OR end_date IS NULL);

-- Creare blocco da iCal import
INSERT INTO calendar_blocks (
  property_id, 
  start_date, 
  end_date, 
  block_type, 
  source_type,
  external_id,
  description
) VALUES (...);
```

### Gestione Errori
- Timeout per fetch iCal (30 secondi)
- Retry automatico con backoff esponenziale
- Logging strutturato per debugging
- Notifiche utente per errori critici

### Security
- Validazione token export
- Rate limiting per endpoint pubblici
- Sanitizzazione input iCal
- CORS appropriato per export

## Test Cases Richiesti

### Test Export iCal
1. ✅ Export con proprietà valida e token corretto
2. ✅ Rifiuto accesso con token invalido
3. ✅ Formato iCal valido e parsabile
4. ✅ Timezone corretti per eventi

### Test Import iCal
1. ✅ Import da URL Booking.com valido
2. ✅ Import da URL Airbnb valido
3. ✅ Gestione URL iCal malformato
4. ✅ Deduplicazione eventi esistenti
5. ✅ Gestione eventi ricorrenti

### Test Integrazione
1. ✅ Sincronizzazione manuale da UI
2. ✅ Visualizzazione eventi importati in calendario
3. ✅ Aggiornamento stato sincronizzazione
4. ✅ Gestione conflitti date

## Priorità Implementazione
1. **ALTA:** Edge functions `ics-export` e `ics-sync`
2. **MEDIA:** Integrazione frontend calendario
3. **MEDIA:** Automazione sincronizzazione
4. **BASSA:** Miglioramenti UX e token management

## Note Implementative
- Utilizzare librerie standard per parsing iCal (es. `ical.js`)
- Implementare logging strutturato con Supabase
- Seguire pattern esistenti per error handling
- Mantenere compatibilità con RLS policies esistenti
- Testare con dati reali da Booking.com/Airbnb

## Risultato Atteso
Dopo l'implementazione, gli utenti potranno:
1. ✅ Copiare URL iCal per export verso canali esterni
2. ✅ Aggiungere URL iCal da canali per import automatico
3. ✅ Vedere prenotazioni importate nel calendario
4. ✅ Sincronizzare manualmente o automaticamente
5. ✅ Monitorare stato sincronizzazioni

Questo completerà il ciclo bidirezionale di sincronizzazione calendario con i channel manager esterni.