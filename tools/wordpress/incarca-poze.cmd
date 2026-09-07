@echo off
rem ── Încărcarea pozelor de produs în WooCommerce ────────────────────────────
rem
rem   incarca-poze.cmd                    toate pozele
rem   incarca-poze.cmd --limita 3         proba: primele 3 (recomandat prima dată)
rem   incarca-poze.cmd --proba            nu scrie nimic, doar arată ce ar face
rem   incarca-poze.cmd --doar-sigure      doar potrivirile certe (59 din 79)
rem   incarca-poze.cmd --pauza 120        mai încet, dacă găzduirea se plânge
rem
rem În fundal, cu fereastra minimizată:
rem
rem   start "AVO poze" /min incarca-poze.cmd
rem
rem Progresul se vede oricum în incarca-poze-jurnal.txt, care e scris de script.
rem Se poate opri oricând cu Ctrl+C — reia de unde a rămas.

rem 65001 = UTF-8. Fără el, consola Windows taie diacriticele din mesaje.
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

node incarca-poze.js %*
set COD=%errorlevel%

echo.
echo Jurnalul complet: %~dp0incarca-poze-jurnal.txt
echo Starea (pentru reluare): %~dp0incarca-poze-stare.json

rem Pauză doar la eroare: altfel o rulare în fundal ar rămâne agățată la final.
if not "%COD%"=="0" pause
exit /b %COD%
