<#
.SYNOPSIS
    Comite, urcă pe GitHub și publică pe catalog.avogrupinvest.ro.

.DESCRIPTION
    Pași:
      1. Comite toate modificările locale (cu mesaj dat ca argument)
      2. Push pe main
      3. Workflow-ul „Publică site-ul" pornește automat la push
         și construiește + urcă prin FTP pe Hostico (~18-25 min)

    Workflow-ul trebuie să fie ACTIVAT pe GitHub.
    Pentru a-l activa:  gh workflow enable "Publică site-ul"
    Pentru a-l opri:    gh workflow disable "Publică site-ul"

.PARAMETER Mesaj
    Mesajul de commit. Obligatoriu dacă există modificări necomise.

.PARAMETER FaraPush
    Doar comite local, fără push. Util când vrei să aduni mai
    multe schimbări înainte de a publica.

.EXAMPLE
    .\tools\publica.ps1 "Căutarea mai îngustă în navbar"
    .\tools\publica.ps1 "Corecție footer" -FaraPush
#>

param(
    [string]$Mesaj,
    [switch]$FaraPush
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

# ── Culori ───────────────────────────────────────────────────────────────
function Scrie-OK    ($t) { Write-Host "  ✓ $t" -ForegroundColor Green }
function Scrie-Info  ($t) { Write-Host "  · $t" -ForegroundColor Cyan }
function Scrie-Atentie($t) { Write-Host "  ! $t" -ForegroundColor Yellow }
function Scrie-Eroare($t) { Write-Host "  ✗ $t" -ForegroundColor Red }
function Linie { Write-Host "" }

Write-Host ""
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host "   AVO Catalog — publicare" -ForegroundColor White
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Blue
Linie

# ── 1. Verifică starea repo-ului ─────────────────────────────────────────

# Fișiere modificate + untracked
$modificate = git diff --name-only 2>&1
$staged = git diff --cached --name-only 2>&1
$untracked = git ls-files --others --exclude-standard 2>&1
$areModificari = ($modificate -or $staged -or $untracked)

# Comituri neurcate
$neurcate = git log origin/main..HEAD --oneline 2>&1
$nrNeurcate = if ($neurcate) { ($neurcate | Measure-Object -Line).Lines } else { 0 }

if ($areModificari) {
    Scrie-Info "Fișiere modificate:"
    if ($modificate) { $modificate | ForEach-Object { Write-Host "      M  $_" -ForegroundColor Yellow } }
    if ($staged)     { $staged     | ForEach-Object { Write-Host "      S  $_" -ForegroundColor Green } }
    if ($untracked)  { $untracked  | ForEach-Object { Write-Host "      ?  $_" -ForegroundColor DarkGray } }
    Linie
}

if ($nrNeurcate -gt 0) {
    Scrie-Info "$nrNeurcate comituri locale neurcate"
    Linie
}

# ── 2. Comit dacă e cazul ────────────────────────────────────────────────

if ($areModificari) {
    if (-not $Mesaj) {
        Scrie-Eroare "Există modificări necomise dar nu ai dat un mesaj."
        Write-Host "      Folosește:  .\tools\publica.ps1 `"Mesajul tău`"" -ForegroundColor DarkGray
        Linie
        exit 1
    }

    Scrie-Info "Comit: $Mesaj"
    git add -A 2>&1 | Out-Null
    git commit -m $Mesaj 2>&1 | Out-Null
    Scrie-OK "Comis local"
    $nrNeurcate++
    Linie
}
elseif ($Mesaj) {
    Scrie-Atentie "Nu sunt modificări de comis (mesajul a fost ignorat)"
    Linie
}

# ── 3. Push ──────────────────────────────────────────────────────────────

if ($FaraPush) {
    Scrie-Info "Fără push (ai cerut -FaraPush)"
    Scrie-Info "$nrNeurcate comituri așteaptă local"
    Linie
    exit 0
}

if ($nrNeurcate -eq 0) {
    Scrie-OK "Totul e deja pe GitHub, nimic de urcat"
    Linie
    exit 0
}

Scrie-Info "Se urcă $nrNeurcate comituri pe GitHub..."
$pushResult = git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Scrie-Eroare "Push eșuat:"
    Write-Host $pushResult -ForegroundColor Red
    Linie
    exit 1
}
Scrie-OK "Urcat pe GitHub"
Linie

# ── 4. Verifică workflow-ul ──────────────────────────────────────────────

$stareWf = (gh api repos/Stefann94/AVO-Catalog/actions/workflows/365145058 --jq '.state' 2>&1)
if ($stareWf -eq "active") {
    Scrie-OK "Workflow-ul „Publică site-ul" e ACTIV"
    Scrie-Info "Publicarea pornește automat. Durează 18-25 de minute."
    Scrie-Info "Urmărește: https://github.com/Stefann94/AVO-Catalog/actions"
}
elseif ($stareWf -eq "disabled_manually") {
    Scrie-Atentie "Workflow-ul „Publică site-ul" e OPRIT"
    Scrie-Info "Codul e pe GitHub, dar site-ul nu se reconstruiește."
    Scrie-Info "Pentru a activa:  gh workflow enable `"Publică site-ul`""
}
else {
    Scrie-Atentie "Stare workflow: $stareWf"
}

Linie
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host "   Gata." -ForegroundColor White
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Blue
Linie
