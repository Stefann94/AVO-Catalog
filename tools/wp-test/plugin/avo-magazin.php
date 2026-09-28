<?php
/**
 * Plugin Name: AVO — Magazinul de test
 * Description: Expune prin WPGraphQL datele scrise de importul din OpenCart: brandul, specificațiile tehnice normalizate, codul producătorului și textele SEO proprii. Fără interfață; datele se scriu din tools/import-opencart.
 * Version:     1.0.0
 * Requires PHP: 8.1
 *
 * Nu desenează nimic pe WordPress — site-ul e Next.js. Dacă WPGraphQL lipsește,
 * nu face nimic.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Brandul stă în taxonomia `product_brand`, pe care WooCommerce o are în nucleu
 * din 9.6. Aici doar o înregistrăm pentru cazul în care WooCommerce e mai vechi,
 * ca importul să nu depindă de versiune.
 */
add_action('init', function () {
    if (taxonomy_exists('product_brand')) {
        return;
    }
    register_taxonomy('product_brand', ['product'], [
        'label'        => 'Branduri',
        'public'       => false,
        'show_ui'      => true,
        'hierarchical' => true,
        'rewrite'      => false,
    ]);
}, 20);

/**
 * Meta-urile scrise de import. Toate încep cu `_avo_`, ca să nu se amestece cu
 * câmpurile WooCommerce și să poată fi găsite și șterse dintr-o singură căutare.
 */
function avo_magazin_meta($id, $cheie) {
    $v = get_post_meta($id, $cheie, true);
    return is_string($v) ? trim($v) : $v;
}

function avo_magazin_id($sursa) {
    if (is_object($sursa)) {
        if (!empty($sursa->ID)) return (int) $sursa->ID;
        if (!empty($sursa->databaseId)) return (int) $sursa->databaseId;
    }
    return 0;
}

add_action('graphql_register_types', function () {
    register_graphql_object_type('AvoSpecificatie', [
        'description' => 'Un rând din tabelul de specificații, cu cheie normalizată.',
        'fields'      => [
            'cheie'    => ['type' => 'String', 'description' => 'Cheie stabilă, ex. putere_ac_w. Null pentru rândurile nenormalizate.'],
            'eticheta' => ['type' => 'String', 'description' => 'Denumirea afișată.'],
            'valoare'  => ['type' => 'String', 'description' => 'Valoarea, așa cum apare în fișa tehnică.'],
        ],
    ]);

    register_graphql_object_type('AvoBrand', [
        'fields' => [
            'nume' => ['type' => 'String'],
            'slug' => ['type' => 'String'],
        ],
    ]);

    register_graphql_object_type('AvoDateProdus', [
        'description' => 'Datele magazinului de test, scrise de importul din OpenCart.',
        'fields'      => [
            'brand'          => ['type' => 'AvoBrand'],
            'codProducator'  => ['type' => 'String', 'description' => 'Codul de model al producătorului (MPN).'],
            'gtin'           => ['type' => 'String', 'description' => 'EAN/GTIN, doar când există în date. Niciodată inventat.'],
            'titluSeo'       => ['type' => 'String'],
            'descriereSeo'   => ['type' => 'String'],
            'specificatii'   => ['type' => ['list_of' => 'AvoSpecificatie']],
            'atribute'       => ['type' => 'String', 'description' => 'JSON cu valorile de filtrare deduse (putere, fază, tensiune…).'],
            'ocId'           => ['type' => 'Int', 'description' => 'product_id din OpenCart; cheia importului.'],
            'actualizatLa'   => ['type' => 'String', 'description' => 'Data exportului din care vin prețul și stocul.'],
        ],
    ]);

    register_graphql_field('Product', 'avo', [
        'type'    => 'AvoDateProdus',
        'resolve' => function ($sursa) {
            $id = avo_magazin_id($sursa);
            if (!$id) return null;

            $termeni = wp_get_post_terms($id, 'product_brand');
            $brand = (!is_wp_error($termeni) && $termeni)
                ? ['nume' => $termeni[0]->name, 'slug' => $termeni[0]->slug]
                : null;

            $spec = json_decode((string) avo_magazin_meta($id, '_avo_specificatii'), true);
            $oc = avo_magazin_meta($id, '_avo_oc_id');
            $gol = fn($v) => ($v === '' || $v === null) ? null : $v;

            return [
                'brand'         => $brand,
                'codProducator' => $gol(avo_magazin_meta($id, '_avo_mpn')),
                'gtin'          => $gol(avo_magazin_meta($id, '_avo_gtin')),
                'titluSeo'      => $gol(avo_magazin_meta($id, '_avo_titlu_seo')),
                'descriereSeo'  => $gol(avo_magazin_meta($id, '_avo_descriere_seo')),
                'specificatii'  => is_array($spec) ? $spec : [],
                'atribute'      => $gol(avo_magazin_meta($id, '_avo_atribute')),
                'ocId'          => $oc === '' ? null : (int) $oc,
                'actualizatLa'  => $gol(avo_magazin_meta($id, '_avo_actualizat_la')),
            ];
        },
    ]);

    /**
     * Textul și imaginea categoriei, scrise de import în term meta. WooGraphQL
     * expune deja `description`; aici vine textul SEO separat, ca descrierea
     * scurtă de sub H1 și textul lung de sub grilă să nu fie același câmp.
     */
    register_graphql_field('ProductCategory', 'avoSeo', [
        'type'    => 'AvoDateCategorie',
        'resolve' => function ($termen) {
            $id = is_object($termen) ? (int) ($termen->term_id ?? $termen->databaseId ?? 0) : 0;
            if (!$id) return null;
            $v = fn($k) => ($x = trim((string) get_term_meta($id, $k, true))) === '' ? null : $x;
            return [
                'titluSeo'     => $v('_avo_titlu_seo'),
                'descriereSeo' => $v('_avo_descriere_seo'),
                'intro'        => $v('_avo_intro'),
                'ghid'         => $v('_avo_ghid'),
            ];
        },
    ]);

    register_graphql_object_type('AvoDateCategorie', [
        'fields' => [
            'titluSeo'     => ['type' => 'String'],
            'descriereSeo' => ['type' => 'String'],
            'intro'        => ['type' => 'String', 'description' => 'Paragraf scurt sub H1.'],
            'ghid'         => ['type' => 'String', 'description' => 'Ghidul de alegere, HTML, sub grila de produse.'],
        ],
    ]);
});
