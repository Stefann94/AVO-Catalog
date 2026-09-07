@echo off
rem ── Raport despre starea pozelor in WooCommerce ────────────────────────────
rem
rem NU SCRIE NIMIC. Doar citeste si spune ce e acolo. Poate fi rulat oricand,
rem inclusiv in timp ce incarcarea merge.
rem
rem Rezultatul: raport-poze.txt (de citit si de trimis mai departe)
rem             raport-poze.json (aceleasi date, complete)

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
  echo Lipseste .env.local — acolo stau adresa site-ului si parola de aplicatie.
  echo Copiaza .env.local.exemplu ca .env.local si completeaza-l.
  echo.
  pause
  exit /b 1
)

node raport-poze.js %*
echo.
pause
