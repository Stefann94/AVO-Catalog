@echo off
rem ── Leaga de produse pozele DEJA urcate in biblioteca media ────────────────
rem
rem NU URCA NIMIC. Fisierele trebuie sa fie deja in biblioteca, puse acolo prin
rem Media -> Add New Media File, tragand tot continutul lui poze-produse\.
rem
rem   leaga-poze.cmd                 leaga tot ce se poate
rem   leaga-poze.cmd --proba         nu scrie nimic, doar arata ce ar face
rem   leaga-poze.cmd --limita 3      doar primele 3 (recomandat prima data)
rem   leaga-poze.cmd --forteaza      inlocuieste si imaginile existente
rem
rem Cere WC_KEY si WC_SECRET in .env.local — chei WooCommerce cu drept
rem Read/Write, din Setari -> Avansat -> REST API. Ele merg in adresa, nu in
rem antetul Authorization, deci ocolesc blocajul de pe gazduire.
rem
rem Se poate opri oricand cu Ctrl+C — reia de unde a ramas.

chcp 65001 >nul
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js nu e in PATH. Instaleaza-l de pe nodejs.org si incearca din nou.
  echo.
  pause
  exit /b 1
)

if not exist ".env.local" (
  echo.
  echo Lipseste .env.local — acolo stau adresa site-ului si cheile WooCommerce.
  echo Copiaza .env.local.exemplu ca .env.local si completeaza-l.
  echo.
  pause
  exit /b 1
)

node leaga-poze.js %*
set COD=%errorlevel%

echo.
echo Jurnalul complet: %~dp0leaga-poze-jurnal.txt

if not "%COD%"=="0" pause
exit /b %COD%
