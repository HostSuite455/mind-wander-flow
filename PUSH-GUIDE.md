# 🚀 GUIDA PUSH VELOCE - EVERGREEN

## Metodo 1: SUPER VELOCE - MCP GitHub (RACCOMANDATO)

### Comando Rapido
```bash
# 1. Verifica i file modificati
git status --porcelain

# 2. Se hai modifiche importanti, usa direttamente MCP GitHub
# Apri Trae AI e usa: mcp_GitHub_push_files
```

### Procedura Completa MCP
1. **Verifica modifiche**: `git status --porcelain`
2. **Nell'interfaccia Trae AI**, usa il tool `mcp_GitHub_push_files` con:
   - `owner`: HostSuite455
   - `repo`: mind-wander-flow  
   - `branch`: main
   - `message`: "Il tuo messaggio di commit"
   - `files`: Array dei file modificati con contenuto
3. **Allinea repo locale**: `git reset --hard origin/main`

### ✅ Vantaggi MCP
- ⚡ **VELOCISSIMO** (bypassa Git locale)
- 🔒 **SICURO** (no problemi token)
- 🎯 **PRECISO** (carica solo file specifici)
- 🛡️ **AFFIDABILE** (sempre funziona)

---

## Metodo 2: Script PowerShell Automatico

### Esecuzione
```powershell
# Esegui lo script
.\quick-push.ps1

# Con messaggio personalizzato
.\quick-push.ps1 -CommitMessage "Il mio commit"
```

Lo script `quick-push.ps1` ti guiderà attraverso tutto il processo.

---

## Metodo 3: Git Tradizionale (Backup)

### Solo se MCP non disponibile
```bash
# 1. Aggiungi file
git add .

# 2. Commit
git commit -m "Il tuo messaggio"

# 3. Push (potrebbe fallire per token)
git push origin main
```

### ⚠️ Se Git fallisce
- Torna al **Metodo 1 (MCP)** - sempre funziona!

---

## 🔧 Risoluzione Problemi

### Problema: "Your branch is ahead of origin/main"
```bash
git reset --hard origin/main
```

### Problema: Token Git non funziona
- Usa **MCP GitHub** (Metodo 1) - bypassa completamente Git locale

### Problema: File non sincronizzati
1. Verifica su GitHub che i file siano stati caricati
2. Esegui: `git reset --hard origin/main`

---

## 📋 Checklist Pre-Push

- [ ] `git status --porcelain` per vedere modifiche
- [ ] Verifica che i file importanti siano inclusi
- [ ] Scegli messaggio commit descrittivo
- [ ] Usa MCP per push veloce
- [ ] Allinea repo locale con `git reset --hard origin/main`

---

## 🎯 Comando Evergreen Finale

```bash
# IL COMANDO PIÙ VELOCE
git status --porcelain && echo "Ora usa MCP GitHub in Trae AI!"
```

**Ricorda**: MCP GitHub è SEMPRE la scelta migliore per velocità e affidabilità! 🚀