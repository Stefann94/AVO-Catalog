#!/usr/bin/env bash
#
# Ridică de la zero un WordPress local pentru AVO Catalog.
#
#   ./configureaza.sh
#
# Rulează-l de câte ori vrei: e idempotent, nu strică o instalare existentă.
# Ca s-o iei complet de la capăt:  docker compose down -v && ./configureaza.sh
#
# Mediul e independent de orice alt proiect de pe calculator: are propriul nume
# de proiect Docker, propria rețea și propriile volume. Toate plugin-urile se
# descarcă de la sursele lor oficiale.

set -euo pipefail
cd "$(dirname "$0")"

# Git Bash pe Windows rescrie automat argumentele care arata a cale absoluta:
# "/plugins-externe/x.zip" ajunge la container ca "C:/Program Files/Git/plugins-externe/x.zip",
# iar WP-CLI raspunde "Invalid plugin slug" - un mesaj care nu spune nimic despre
# cauza. Pe Linux si macOS variabila nu are niciun efect.
export MSYS_NO_PATHCONV=1

PORT="${PORT_WP:-8090}"
BAZA="http://localhost:${PORT}"

# WPGraphQL for WooCommerce nu e publicat pe wordpress.org, ci ca release pe
# GitHub. Versiunea e fixată intenționat: un mediu de test care se schimbă
# singur sub tine nu mai e un mediu de test.
WOOGQL_VERSIUNE="1.0.3"
WOOGQL_URL="https://github.com/wp-graphql/wp-graphql-woocommerce/releases/download/v${WOOGQL_VERSIUNE}/wp-graphql-woocommerce.zip"

# `-T` opreste alocarea unui pseudo-terminal. Fara el, scriptul rulat altfel
# decat dintr-un terminal interactiv - dintr-un job de fundal, dintr-un hook sau
# din CI - se blocheaza la primul apel, fara niciun mesaj.
wpcli() { docker compose run --rm -T wpcli "$@"; }

echo "==> Pornesc containerele"
docker compose up -d

echo "==> Aștept WordPress pe ${BAZA}"
until curl -sf -o /dev/null -m 3 "${BAZA}/" 2>/dev/null; do sleep 1; done

if wpcli core is-installed >/dev/null 2>&1; then
  echo "==> WordPress e deja instalat"
else
  echo "==> Instalez WordPress (admin / admin)"
  wpcli core install \
    --url="${BAZA}" \
    --title="AVO Catalog (local)" \
    --admin_user=admin \
    --admin_password=admin \
    --admin_email=local@example.com \
    --skip-email
fi

echo "==> WooCommerce și WPGraphQL, de pe wordpress.org"
wpcli plugin install woocommerce wp-graphql --activate

# Descărcarea se face aici, pe gazdă, nu în container: descărcătorul din
# WordPress nu duce redirecturile GitHub la capăt și cade cu mesajul derutant
# „A valid URL was not provided", care n-are nicio legătură cu cauza reală.
echo "==> WPGraphQL for WooCommerce ${WOOGQL_VERSIUNE}, de pe GitHub"
mkdir -p plugins-externe
if [ ! -s "plugins-externe/wp-graphql-woocommerce.zip" ]; then
  curl -sfL -m 180 -o "plugins-externe/wp-graphql-woocommerce.zip" "${WOOGQL_URL}"
fi
wpcli plugin install /plugins-externe/wp-graphql-woocommerce.zip --force --activate

echo "==> Plugin-ul nostru, montat direct din tools/wordpress"
wpcli plugin activate avo-legatura

echo
echo "==> Gata."
wpcli plugin list --status=active --fields=name,version
echo
echo "  WordPress : ${BAZA}/wp-admin   (admin / admin)"
echo "  GraphQL   : ${BAZA}/graphql"
echo
echo "  Ca site-ul Next.js să citească de aici, pune în .env.local:"
echo "    WP_GRAPHQL_URL=${BAZA}/graphql"
