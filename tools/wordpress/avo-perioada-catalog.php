<?php
/**
 * Plugin Name: AVO — Perioada catalogului
 * Description: Expune prin WPGraphQL perioada de valabilitate a catalogului, ca site-ul Next.js să afișeze luna corectă fără modificări de cod. Citește meta scrisă de importatorul CSV și acceptă o corectură manuală din WooCommerce → Setări → Produse → Catalog AVO.
 * Version:     1.0.0
 * Author:      Avo Grup Invest
 * Requires PHP: 7.4
 *
 * Instalare: copiază fișierul în wp-content/plugins/ și activează-l din
 * Plugins, sau pune-l în wp-content/mu-plugins/ ca să fie activ permanent.
 *
 * Depinde de WPGraphQL și WooCommerce. Dacă lipsesc, nu face nimic — nu dă
 * eroare fatală.
 */

if (!defined('ABSPATH')) {
    exit;
}

// Dacă fișierul ajunge din greșeală și în mu-plugins, și în plugins, PHP ar da
// eroare fatală la redeclararea constantelor și a funcțiilor — adică ecran alb
// pe tot site-ul. A doua încărcare iese aici, tăcut.
if (defined('AVO_PERIOADA_CATALOG_VERSIUNE')) {
    return;
}
define('AVO_PERIOADA_CATALOG_VERSIUNE', '1.0.0');

const AVO_OPT_ETICHETA = 'avo_perioada_eticheta';
const AVO_OPT_DE       = 'avo_perioada_valabil_de';
const AVO_OPT_PANA     = 'avo_perioada_valabil_pana';

/* -------------------------------------------------------------------------
 * 1. Normalizarea datelor
 * ---------------------------------------------------------------------- */

/**
 * Aduce o dată la formatul zz.ll.aaaa, cel tipărit pe coperta catalogului.
 *
 * Acceptă și 1.9.2026, și 2026-09-01, și 01/09/2026 — un coleg care completează
 * câmpul manual nu trebuie să ghicească formatul. Ce nu poate fi interpretat ca
 * dată reală se întoarce ca null, nu ca text pe jumătate corect: front-end-ul
 * preferă să ascundă ștampila decât să afișeze o perioadă greșită.
 */
function avo_normalizeaza_data($valoare) {
    $t = trim((string) $valoare);
    if ($t === '') {
        return null;
    }

    // zz.ll.aaaa  /  zz-ll-aaaa  /  zz/ll/aaaa
    if (preg_match('/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/', $t, $m)) {
        [$zi, $luna, $an] = [(int) $m[1], (int) $m[2], (int) $m[3]];
    // aaaa-ll-zz (formatul ISO, cel pe care îl dau input-urile de tip date)
    } elseif (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $t, $m)) {
        [$an, $luna, $zi] = [(int) $m[1], (int) $m[2], (int) $m[3]];
    } else {
        return null;
    }

    if (!checkdate($luna, $zi, $an)) {
        return null;
    }

    return sprintf('%02d.%02d.%04d', $zi, $luna, $an);
}

/* -------------------------------------------------------------------------
 * 2. Sursa datelor
 * ---------------------------------------------------------------------- */

/**
 * Citește perioada de pe cel mai recent produs publicat.
 *
 * Importatorul CSV scrie aceleași trei valori pe toate produsele din catalog
 * (vezi tools/catalog-import/parse-catalog.js), deci oricare produs le are.
 * Îl luăm pe cel mai recent modificat ca să nimerim ultimul import, nu unul
 * rămas dintr-o lună veche.
 */
function avo_perioada_din_produse() {
    if (!function_exists('wc_get_products')) {
        return null;
    }

    $produse = wc_get_products([
        'limit'   => 1,
        'status'  => 'publish',
        'orderby' => 'modified',
        'order'   => 'DESC',
        'return'  => 'objects',
    ]);

    if (empty($produse)) {
        return null;
    }

    $p = $produse[0];
    $eticheta = trim((string) $p->get_meta('_perioada_eticheta'));

    if ($eticheta === '') {
        return null;
    }

    return [
        'eticheta'     => $eticheta,
        'valabilDe'    => avo_normalizeaza_data($p->get_meta('_valabil_de')),
        'valabilPana'  => avo_normalizeaza_data($p->get_meta('_valabil_pana')),
        'sursaCatalog' => trim((string) $p->get_meta('_sursa_catalog')) ?: null,
    ];
}

/**
 * Corectura manuală din setările WooCommerce. Are prioritate față de produse.
 *
 * Se activează dacă e completată eticheta SAU data de început. Cerând obligatoriu
 * eticheta, un coleg care completează doar cele două date n-ar vedea nicio
 * schimbare pe site și n-ar avea cum să-și dea seama de ce; când lipsește,
 * eticheta se deduce oricum din luna în care începe valabilitatea.
 */
function avo_perioada_din_setari() {
    $eticheta = trim((string) get_option(AVO_OPT_ETICHETA, ''));
    $de       = avo_normalizeaza_data(get_option(AVO_OPT_DE, ''));

    if ($eticheta === '' && $de === null) {
        return null;
    }

    return [
        'eticheta'     => $eticheta !== '' ? $eticheta : null,
        'valabilDe'    => $de,
        'valabilPana'  => avo_normalizeaza_data(get_option(AVO_OPT_PANA, '')),
        'sursaCatalog' => 'Setare manuală WooCommerce',
    ];
}

/**
 * Valoarea finală.
 *
 * Ordinea contează: în mod normal perioada vine automat cu importul lunar și
 * nimeni nu trebuie să atingă nimic. Câmpul manual e portița pentru cazul în
 * care coperta PDF-ului e scrisă altfel decât se aștepta importatorul, sau
 * pentru o corectură rapidă între două importuri. Golește câmpurile ca să revii
 * la valoarea automată.
 */
function avo_perioada_catalog() {
    return avo_perioada_din_setari() ?? avo_perioada_din_produse();
}

/* -------------------------------------------------------------------------
 * 3. Expunerea în GraphQL
 * ---------------------------------------------------------------------- */

add_action('graphql_register_types', function () {
    register_graphql_object_type('PerioadaCatalog', [
        'description' => 'Perioada de valabilitate a catalogului de prețuri curent.',
        'fields'      => [
            'eticheta' => [
                'type'        => 'String',
                'description' => 'Eticheta tipărită pe copertă, ex. "Septembrie 2026".',
            ],
            'valabilDe' => [
                'type'        => 'String',
                'description' => 'Prima zi de valabilitate, în format zz.ll.aaaa.',
            ],
            'valabilPana' => [
                'type'        => 'String',
                'description' => 'Ultima zi de valabilitate, în format zz.ll.aaaa.',
            ],
            'sursaCatalog' => [
                'type'        => 'String',
                'description' => 'Catalogul din care provin prețurile, ex. "Catalog Solar One 09.2026".',
            ],
        ],
    ]);

    register_graphql_field('RootQuery', 'perioadaCatalog', [
        'type'        => 'PerioadaCatalog',
        'description' => 'Perioada de valabilitate a catalogului curent. null când nu e cunoscută.',
        'resolve'     => function () {
            return avo_perioada_catalog();
        },
    ]);
});

/* -------------------------------------------------------------------------
 * 4. Interfața din WooCommerce
 * ---------------------------------------------------------------------- */

// O secțiune proprie, nu câmpuri adăugate la coada setărilor de produse: un
// coleg trebuie să găsească asta fără să i se explice unde s-o caute.
add_filter('woocommerce_get_sections_products', function ($sectiuni) {
    $sectiuni['avo_catalog'] = 'Catalog AVO';
    return $sectiuni;
});

add_filter('woocommerce_get_settings_products', function ($setari, $sectiune_curenta) {
    if ($sectiune_curenta !== 'avo_catalog') {
        return $setari;
    }

    $automat = avo_perioada_din_produse();
    $stare = $automat
        ? sprintf(
            'Detectat automat din ultimul import: <strong>%s</strong> (%s – %s).',
            esc_html($automat['eticheta']),
            esc_html($automat['valabilDe'] ?? '?'),
            esc_html($automat['valabilPana'] ?? '?')
        )
        : 'Nu s-a găsit nicio perioadă pe produse. Ori catalogul nu a fost încă importat, ori CSV-ul nu conținea coloanele <code>Meta: _perioada_eticheta</code>, <code>Meta: _valabil_de</code> și <code>Meta: _valabil_pana</code>.';

    return [
        [
            'title' => 'Perioada catalogului',
            'type'  => 'title',
            'desc'  => 'Perioada afișată pe pagina de start a site-ului, în titlul „Gama de produse" și pe eticheta „Prețuri valabile".<br><br>'
                . 'În mod normal <strong>nu trebuie completat nimic aici</strong>: perioada vine automat cu fiecare import lunar de catalog. '
                . 'Completează câmpurile de mai jos doar dacă valoarea automată e greșită sau lipsește. '
                . 'Ca să revii la detectarea automată, golește toate câmpurile de mai jos.<br><br>'
                . $stare,
            'id'    => 'avo_perioada_sectiune',
        ],
        [
            'title'    => 'Eticheta perioadei',
            'desc'     => 'Ex. <code>Septembrie 2026</code>. Lăsat gol, se folosește valoarea din import.',
            'id'       => AVO_OPT_ETICHETA,
            'type'     => 'text',
            'css'      => 'min-width:300px;',
            'desc_tip' => false,
        ],
        [
            'title'    => 'Valabil de la',
            'desc'     => 'Ex. <code>01.09.2026</code>.',
            'id'       => AVO_OPT_DE,
            'type'     => 'text',
            'css'      => 'min-width:300px;',
            'desc_tip' => false,
        ],
        [
            'title'    => 'Valabil până la',
            'desc'     => 'Ex. <code>30.09.2026</code>. Lăsate goale, ambele date se deduc din etichetă ca lună calendaristică întreagă.',
            'id'       => AVO_OPT_PANA,
            'type'     => 'text',
            'css'      => 'min-width:300px;',
            'desc_tip' => false,
        ],
        [
            'type' => 'sectionend',
            'id'   => 'avo_perioada_sectiune',
        ],
    ];
}, 10, 2);
