@echo off
rem ── Cauta pe solarone.ro pozele produselor care n-au poza pe site-ul nostru ─
rem
rem NU URCA NIMIC. Scrie fisiere in poze-produse-pas2\, plus un manifest cu ce
rem a gasit si pe ce baza. Urcarea si legarea raman pasii urmatori.
rem
rem Nu-i trebuie nicio credentiala: lista produselor fara poza vine prin
rem WPGraphQL, care e public.
rem
rem   cauta-poze-lipsa.cmd                toate
rem   cauta-poze-lipsa.cmd --limita 5     doar primele 5 (recomandat prima data)
rem   cauta-poze-lipsa.cmd --doar-cauta   nu descarca, doar raporteaza ce ar lua
rem   cauta-poze-lipsa.cmd --pauza 4000   mai incet
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

node cauta-poze-lipsa.js %*
set COD=%errorlevel%

echo.
echo Jurnalul complet: %~dp0cauta-poze-jurnal.txt

if not "%COD%"=="0" pause
exit /b %COD%
