# ============================================
# QUICK PUSH SCRIPT - EVERGREEN
# Push veloce su GitHub usando MCP (bypassa problemi Git)
# ============================================

param(
    [string]$CommitMessage = "Update files via quick-push script"
)

Write-Host "🚀 QUICK PUSH - Avvio processo veloce..." -ForegroundColor Green
Write-Host ""

# 1. Verifica i file modificati
Write-Host "📋 Step 1: Verifico i file modificati..." -ForegroundColor Yellow
$modifiedFiles = git status --porcelain
if ($modifiedFiles) {
    Write-Host "File modificati trovati:" -ForegroundColor Cyan
    $modifiedFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} else {
    Write-Host "❌ Nessun file modificato trovato." -ForegroundColor Red
    exit 0
}

Write-Host ""

# 2. Identifica i file da caricare (solo file tracciati e modificati)
Write-Host "🔍 Step 2: Identifico i file da caricare..." -ForegroundColor Yellow
$filesToPush = @()

# Ottieni i file modificati rispetto al remote
$diffFiles = git diff --name-only HEAD origin/main 2>$null
if ($diffFiles) {
    $filesToPush += $diffFiles
}

# Aggiungi anche i file staged
$stagedFiles = git diff --cached --name-only 2>$null
if ($stagedFiles) {
    $filesToPush += $stagedFiles
}

# Rimuovi duplicati e file che non esistono
$filesToPush = $filesToPush | Sort-Object -Unique | Where-Object { Test-Path $_ }

if ($filesToPush.Count -eq 0) {
    Write-Host "❌ Nessun file valido da caricare." -ForegroundColor Red
    exit 0
}

Write-Host "File da caricare:" -ForegroundColor Cyan
$filesToPush | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Write-Host ""

# 3. Conferma prima del push
Write-Host "⚠️  Vuoi procedere con il push di questi $($filesToPush.Count) file(s)? (y/N): " -ForegroundColor Yellow -NoNewline
$confirmation = Read-Host
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Push annullato dall'utente." -ForegroundColor Red
    exit 0
}

Write-Host ""

# 4. Messaggio di commit personalizzato
if ($CommitMessage -eq "Update files via quick-push script") {
    Write-Host "💬 Inserisci un messaggio di commit (premi ENTER per usare quello di default): " -ForegroundColor Yellow -NoNewline
    $customMessage = Read-Host
    if ($customMessage.Trim() -ne "") {
        $CommitMessage = $customMessage.Trim()
    }
}

Write-Host ""
Write-Host "🔄 Step 3: Caricamento in corso su GitHub..." -ForegroundColor Yellow
Write-Host "Messaggio commit: $CommitMessage" -ForegroundColor Cyan
Write-Host ""

# 5. Simula il comando MCP (in realtà dovrai usare l'interfaccia Trae)
Write-Host "📤 ISTRUZIONI PER IL PUSH MCP:" -ForegroundColor Green
Write-Host "Usa questo comando nell'interfaccia Trae AI:" -ForegroundColor White
Write-Host ""
Write-Host "mcp_GitHub_push_files con i seguenti parametri:" -ForegroundColor Cyan
Write-Host "- owner: HostSuite455" -ForegroundColor White
Write-Host "- repo: mind-wander-flow" -ForegroundColor White
Write-Host "- branch: main" -ForegroundColor White
Write-Host "- message: $CommitMessage" -ForegroundColor White
Write-Host "- files:" -ForegroundColor White

$filesToPush | ForEach-Object {
    Write-Host "  * path: $_" -ForegroundColor White
    Write-Host "    content: [contenuto del file]" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Script completato! Usa le istruzioni sopra per il push MCP." -ForegroundColor Green
Write-Host ""

# 6. Opzione per aprire Trae AI (se disponibile)
Write-Host "💡 TIP: Dopo il push MCP, esegui 'git reset --hard origin/main' per allineare il repo locale." -ForegroundColor Yellow