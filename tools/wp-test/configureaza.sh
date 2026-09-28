#!/usr/bin/env bash
#
# Ridică WordPress-ul copiei de test: WooCommerce, WPGraphQL, WPGraphQL for
# WooCommerce și cele două plugin-uri proprii. Idempotent — rulează-l oricând.
#
#   ./configureaza.sh
#
# De la zero:  docker compose down -v && ./configureaza.sh

set -euo pipefail
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1

PORT="${PORT_WP:-8093}"
BAZA="http://localhost:${PORT}"

# Aceeași versiune fixată ca în tools/wp-local; arhiva se descarcă o singură
# dată și e folosită de ambele medii.
WOOGQL_VERSIUNE="1.0.3"
WOOGQL_URL="https://github.com/wp-graphql/wp-graphql-woocommerce/releases/download/v${WOOGQL_VERSIUNE}/wp-graphql-woocommerce.zip"

wpcli() { docker compose run --rm -T wpcli "$@"; }

echo "==> Pornesc containerele"
docker compose up -d

echo "==> Aștept WordPress pe ${BAZA}"
# Redirectarea o face bash, nu curl: cu MSYS_NO_PATHCONV, un `-o /dev/null`
# ajunge la curl.exe ca text literal, scrierea eșuează și bucla nu se termină.
until curl -s -m 3 "${BAZA}/" >/dev/null 2>&1; do sleep 1; done

if wpcli core is-installed >/dev/null 2>&1; then
  echo "==> WordPress e deja instalat"
else
  echo "==> Instalez WordPress (admin / admin)"
  wpcli core install \
    --url="${BAZA}" \
    --title="Magazin de test (local)" \
    --admin_user=admin \
    --admin_password=admin \
    --admin_email=local@example.com \
    --skip-email
fi

echo "==> Limba română, fus orar, permalink-uri"
wpcli language core install ro_RO --activate >/dev/null 2>&1 || true
wpcli option update timezone_string "Europe/Bucharest" >/dev/null
# WPGraphQL cere permalink-uri „frumoase" ca /graphql să existe.
wpcli rewrite structure '/%postname%/' --hard >/dev/null

echo "==> WooCommerce și WPGraphQL, de pe wordpress.org"
wpcli plugin install woocommerce wp-graphql --activate

echo "==> WPGraphQL for WooCommerce ${WOOGQL_VERSIUNE}"
mkdir -p ../wp-local/plugins-externe
if [ ! -s "../wp-local/plugins-externe/wp-graphql-woocommerce.zip" ]; then
  curl -sfL -m 180 -o "../wp-local/plugins-externe/wp-graphql-woocommerce.zip" "${WOOGQL_URL}"
fi
wpcli plugin install /plugins-externe/wp-graphql-woocommerce.zip --force --activate

echo "==> Plugin-urile proprii"
wpcli plugin activate avo-legatura avo-magazin

echo "==> Setări de magazin: RON, prețuri introduse CU TVA, România"
wpcli option update woocommerce_currency RON >/dev/null
wpcli option update woocommerce_default_country RO >/dev/null
wpcli option update woocommerce_calc_taxes yes >/dev/null
wpcli option update woocommerce_prices_include_tax yes >/dev/null
wpcli option update woocommerce_tax_display_shop incl >/dev/null
wpcli option update woocommerce_tax_display_cart incl >/dev/null
wpcli option update woocommerce_price_num_decimals 2 >/dev/null
wpcli option update woocommerce_price_thousand_sep . >/dev/null
wpcli option update woocommerce_price_decimal_sep , >/dev/null
wpcli option update woocommerce_currency_pos right_space >/dev/null
# Cota standard de TVA. Fără ea, WooCommerce n-ar avea ce scădea din prețul
# introdus cu TVA și ar raporta TVA zero în coș și în feed.
if ! wpcli wc tax list --user=admin --format=ids 2>/dev/null | grep -q '[0-9]'; then
  wpcli wc tax create --user=admin --country=RO --rate=21.0000 --name=TVA --shipping=true >/dev/null
fi
# Stocul se urmărește pe produs, din cantitatea importată.
wpcli option update woocommerce_manage_stock yes >/dev/null
# Nimeni nu trebuie să ajungă pe temele WordPress: site-ul e Next.js.
wpcli option update blog_public 0 >/dev/null

echo
echo "==> Gata."
wpcli plugin list --status=active --fields=name,version
echo
echo "  WordPress : ${BAZA}/wp-admin   (admin / admin)"
echo "  GraphQL   : ${BAZA}/graphql"
echo "  Import    : node ../import-opencart/extrage.mjs && node ../import-opencart/transforma.mjs && ../import-opencart/importa.sh"
