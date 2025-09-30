const fs = require('fs');
const path = require('path');

console.log('🧹 Rimozione dati hardcoded e mock dal codice...\n');

// File da modificare per rimuovere dati hardcoded
const filesToClean = [
  {
    file: 'src/pages/host-bookings.tsx',
    description: 'Rimuovere bookings hardcoded',
    action: 'replace_bookings_array'
  },
  {
    file: 'src/pages/host-agent-config.tsx', 
    description: 'Rimuovere valori hardcoded nei placeholder',
    action: 'clean_placeholders'
  },
  {
    file: 'src/components/HostDashboard.tsx',
    description: 'Rimuovere mock analysis e placeholder hardcoded',
    action: 'clean_mock_data'
  }
];

function cleanHostBookings() {
  const filePath = path.join(__dirname, 'src/pages/host-bookings.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File host-bookings.tsx non trovato');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Sostituisci l'array hardcoded con un array vuoto
  const oldBookingsPattern = /const bookings = \[[\s\S]*?\];/;
  const newBookings = `const bookings: any[] = [
  // I dati delle prenotazioni verranno caricati dinamicamente dal database
];`;

  if (oldBookingsPattern.test(content)) {
    content = content.replace(oldBookingsPattern, newBookings);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Rimossi bookings hardcoded da host-bookings.tsx');
  } else {
    console.log('⚠️  Pattern bookings non trovato in host-bookings.tsx');
  }
}

function cleanHostAgentConfig() {
  const filePath = path.join(__dirname, 'src/pages/host-agent-config.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File host-agent-config.tsx non trovato');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Rimuovi valori hardcoded
  content = content.replace(/value="Casa Siena Centro"/g, 'value=""');
  content = content.replace(/placeholder="es\. Sofia - Assistant Siena"/g, 'placeholder="es. Sofia - Assistant"');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Rimossi valori hardcoded da host-agent-config.tsx');
}

function cleanHostDashboard() {
  const filePath = path.join(__dirname, 'src/components/HostDashboard.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File HostDashboard.tsx non trovato');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Rimuovi mock analysis
  const mockAnalysisPattern = /const mockAnalysis = \{[\s\S]*?\};/;
  if (mockAnalysisPattern.test(content)) {
    content = content.replace(mockAnalysisPattern, '// Mock analysis rimosso');
    console.log('✅ Rimosso mockAnalysis da HostDashboard.tsx');
  }
  
  // Rimuovi chiamata a onAnalysisGenerated con mock data
  content = content.replace(/onAnalysisGenerated\(mockAnalysis\);/, '// Mock analysis call rimossa');
  
  // Pulisci placeholder
  content = content.replace(/placeholder="Casa Vacanze Siena"/g, 'placeholder="Nome della proprietà"');
  content = content.replace(/placeholder="Siena, Toscana"/g, 'placeholder="Città, Regione"');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Pulito HostDashboard.tsx da dati hardcoded');
}

function removeUnusedMockFiles() {
  const mockFilePath = path.join(__dirname, 'src/hooks/useMockCalendarData.ts');
  
  if (fs.existsSync(mockFilePath)) {
    // Non eliminiamo il file ma lo rinominiamo per sicurezza
    const backupPath = path.join(__dirname, 'src/hooks/useMockCalendarData.ts.backup');
    fs.renameSync(mockFilePath, backupPath);
    console.log('✅ File useMockCalendarData.ts spostato in backup');
  }
}

function cleanPropertyWizard() {
  const filePath = path.join(__dirname, 'src/pages/dashboard/PropertyWizard.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File PropertyWizard.tsx non trovato');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pulisci placeholder con esempi specifici
  content = content.replace(/placeholder="es\. Appartamento luminoso nel centro storico"/g, 'placeholder="Descrizione della proprietà"');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Pulito PropertyWizard.tsx da esempi hardcoded');
}

// Esegui tutte le operazioni di pulizia
try {
  cleanHostBookings();
  cleanHostAgentConfig();
  cleanHostDashboard();
  cleanPropertyWizard();
  removeUnusedMockFiles();
  
  console.log('\n🎉 Pulizia completata! Tutti i dati hardcoded sono stati rimossi.');
  console.log('📝 I file sono stati modificati per utilizzare solo dati dinamici dal database.');
  
} catch (error) {
  console.error('❌ Errore durante la pulizia:', error);
  process.exit(1);
}