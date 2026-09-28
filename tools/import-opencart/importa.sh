#!/usr/bin/env bash
#
# Importul complet în WordPress-ul de test, cu raport de diferențe.
#
#   ./importa.sh              extrage din OpenCart, transformă, importă
#   ./importa.sh simulare     la fel, dar importul doar raportează ce ar schimba
#   ./importa.sh fara-extragere [simulare]   folosește ultimul export din date/
#
# Raportul se scrie în date/raport-import-AAAA-LL-ZZ.md.

set -euo pipefail
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1

SIMULARE=""
EXTRAGE=1
for a in "$@"; do
  case "$a" in
    simulare) SIMULARE="simulare" ;;
    fara-extragere) EXTRAGE=0 ;;
  esac
done

if [ "$EXTRAGE" = 1 ]; then node extrage.mjs; fi
node transforma.mjs

RAPORT="date/raport-import-$(date +%F)${SIMULARE:+-simulare}.md"
echo "==> Import în WordPress-ul de test${SIMULARE:+ (simulare)}"
( cd ../wp-test && docker compose run --rm -T wpcli eval-file /import/importa.php ${SIMULARE} ) > "$RAPORT"
sed -n '1,14p' "$RAPORT"
echo
echo "Raport complet: tools/import-opencart/$RAPORT"
