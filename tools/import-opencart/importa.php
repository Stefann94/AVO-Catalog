<?php
/**
 * Pasul 3 din 3: date/transformat.json → WooCommerce. Rulat prin WP-CLI, în
 * containerul wpcli al WordPress-ului de test (vezi importa.sh):
 *
 *   wp eval-file /import/importa.php [simulare]
 *
 * Rulabil de oricâte ori. Cheia de legătură e meta `_avo_oc_id` (product_id din
 * OpenCart): a doua rulare actualizează, nu dublează.
 *
 *  - slug-ul se scrie DOAR la creare: un URL indexat nu se schimbă la reimport;
 *  - imaginile se încarcă o singură dată, recunoscute după calea sursă;
 *  - produsele dispărute din sursă trec pe ciornă, nu se șterg;
 *  - `simulare` calculează și raportează diferențele fără să scrie nimic.
 *
 * Ieșirea standard e raportul de diferențe, în Markdown.
 */

if (!defined('ABSPATH')) {
    exit;
}

$simulare = in_array('simulare', $args ?? [], true);
$date = json_decode(file_get_contents('/import/date/transformat.json'), true);
if (!$date) {
    WP_CLI::error('Nu pot citi /import/date/transformat.json — rulează întâi transforma.mjs.');
}

require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

$raport = ['adaugate' => [], 'modificate' => [], 'neschimbate' => 0, 'ciorna' => [], 'imagini_noi' => 0, 'erori' => []];

/* ─── Atribute globale ─────────────────────────────────────────────────── */

$AVO_ATRIBUTE = [
    'putere_kw'        => ['putere', 'Putere', fn($v) => str_replace('.', ',', (string) $v) . ' kW'],
    'faza'             => ['faza', 'Fază', fn($v) => $v],
    'tensiune_baterie' => ['tensiune-baterie', 'Tensiune baterie', fn($v) => str_replace('-', ' ', $v)],
    'capacitate_kwh'   => ['capacitate', 'Capacitate', fn($v) => str_replace('.', ',', (string) $v) . ' kWh'],
    'putere_w'         => ['putere-panou', 'Putere panou', fn($v) => $v . ' W'],
    'tehnologie'       => ['tehnologie', 'Tehnologie', fn($v) => $v],
];

function avo_asigura_atribut($slug, $nume, $simulare) {
    $id = wc_attribute_taxonomy_id_by_name($slug);
    if (!$id && !$simulare) {
        $id = wc_create_attribute(['name' => $nume, 'slug' => $slug, 'type' => 'select', 'order_by' => 'menu_order', 'has_archives' => false]);
        if (is_wp_error($id)) WP_CLI::error($id->get_error_message());
    }
    $tax = wc_attribute_taxonomy_name($slug);
    // Taxonomia unui atribut creat chiar acum nu e încă înregistrată în această cerere.
    if (!taxonomy_exists($tax)) register_taxonomy($tax, ['product'], ['hierarchical' => false, 'show_ui' => false, 'query_var' => false, 'rewrite' => false]);
    return [$id, $tax];
}

$atribute = [];
foreach ($AVO_ATRIBUTE as $cheie => [$slug, $nume, $format]) {
    $atribute[$cheie] = avo_asigura_atribut($slug, $nume, $simulare);
}

/* ─── Categorii ────────────────────────────────────────────────────────── */

$idCategorie = [];
foreach ($date['categorii'] as $c) {
    $parinte = $c['parinte'] ? ($idCategorie[$c['parinte']] ?? 0) : 0;
    // Slug-ul unui copil poate coincide cu al altei categorii (ex. „low-voltage"),
    // deci îl căutăm după slug ȘI părinte, iar în baza de date îl facem unic.
    $slugDb = $c['parinte'] ? "{$c['parinte']}-{$c['slug']}" : $c['slug'];
    $t = get_term_by('slug', $slugDb, 'product_cat');
    if (!$t && !$simulare) {
        $r = wp_insert_term($c['nume'], 'product_cat', ['slug' => $slugDb, 'parent' => $parinte]);
        if (is_wp_error($r)) { $raport['erori'][] = "categorie {$c['cale']}: " . $r->get_error_message(); continue; }
        $t = get_term($r['term_id'], 'product_cat');
    }
    if (!$t) { $idCategorie[$c['cale']] = 0; continue; }
    $idCategorie[$c['cale']] = $t->term_id;
    if (!$simulare) {
        wp_update_term($t->term_id, 'product_cat', ['name' => $c['nume'], 'parent' => $parinte, 'description' => $c['intro'] ?? '']);
        update_term_meta($t->term_id, '_avo_cale', $c['cale']);
        update_term_meta($t->term_id, '_avo_titlu_seo', $c['titluSeo'] ?? '');
        update_term_meta($t->term_id, '_avo_descriere_seo', $c['descriereSeo'] ?? '');
        update_term_meta($t->term_id, '_avo_intro', $c['intro'] ?? '');
        update_term_meta($t->term_id, '_avo_ghid', $c['ghid'] ?? '');
    }
}
// „Uncategorized" nu trebuie să apară pe site.
$implicita = (int) get_option('default_product_cat');

/* ─── Imagini ──────────────────────────────────────────────────────────── */

/** Atașamentul pentru o cale sursă, încărcat o singură dată. */
function avo_imagine($caleSursa, $numeAlt, $simulare, &$raport) {
    global $wpdb;
    $existent = $wpdb->get_var($wpdb->prepare("SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_avo_sursa_imagine' AND meta_value = %s LIMIT 1", $caleSursa));
    if ($existent) return (int) $existent;
    if ($simulare || !is_readable($caleSursa)) return 0;

    $tmp = wp_tempnam(basename($caleSursa));
    copy($caleSursa, $tmp);
    $id = media_handle_sideload(['name' => basename($caleSursa), 'tmp_name' => $tmp], 0, $numeAlt);
    if (is_wp_error($id)) { @unlink($tmp); $raport['erori'][] = "imagine {$caleSursa}: " . $id->get_error_message(); return 0; }
    update_post_meta($id, '_avo_sursa_imagine', $caleSursa);
    update_post_meta($id, '_wp_attachment_image_alt', $numeAlt);
    $raport['imagini_noi']++;
    return (int) $id;
}

/**
 * Căile imaginilor unui produs: întâi arhiva image/catalog de pe server (când
 * e dezarhivată în tools/import-opencart/imagini/), altfel poza din repo.
 */
function avo_cai_imagini($p) {
    $cai = [];
    foreach ($p['imaginiOpenCart'] as $rel) {
        $c = '/import/imagini/' . ltrim($rel, '/');
        if (is_readable($c)) $cai[] = $c;
    }
    if (!$cai && !empty($p['pozaRepo'])) $cai[] = '/repo/' . $p['pozaRepo'];
    return array_values(array_unique($cai));
}

/* ─── Produse ──────────────────────────────────────────────────────────── */

global $wpdb;
$existente = [];
foreach ($wpdb->get_results("SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_avo_oc_id'") as $r) {
    $existente[(int) $r->meta_value] = (int) $r->post_id;
}

// SKU-ul trebuie să fie unic în WooCommerce; codul producătorului nu e mereu.
$aparitiiMpn = array_count_values(array_filter(array_map(fn($p) => $p['mpn'] ? strtoupper($p['mpn']) : null, $date['produse'])));

$vazute = [];
foreach ($date['produse'] as $p) {
    $oc = (int) $p['ocId'];
    $vazute[$oc] = true;
    $idPost = $existente[$oc] ?? 0;
    $produs = $idPost ? wc_get_product($idPost) : null;
    if ($idPost && !$produs) $idPost = 0;
    $nou = !$produs;
    if ($nou) $produs = new WC_Product_Simple();

    $sku = $p['mpn'] && $aparitiiMpn[strtoupper($p['mpn'])] === 1 ? $p['mpn'] : ($p['mpn'] ? "{$p['mpn']}-{$oc}" : "AVO-{$oc}");

    // Categoria-frunză plus părintele, ca listarea părintelui să-l includă.
    $cats = array_values(array_filter([$idCategorie[$p['cale']] ?? 0, $idCategorie[explode('/', $p['cale'])[0]] ?? 0]));

    $stare = [
        'nume'       => $p['titlu'],
        'descriere'  => $p['descriere'],
        'scurta'     => $p['descriereScurta'] ?? '',
        'pret'       => $p['pret'] !== null ? wc_format_decimal($p['pret'], 2) : '',
        'pret_redus' => $p['pretRedus'] !== null ? wc_format_decimal($p['pretRedus'], 2) : '',
        'stoc'       => $p['stoc'],
        'cantitate'  => (int) $p['cantitate'],
        'sku'        => $sku,
        'categorii'  => implode(',', $cats),
        'brand'      => $p['brand'] ?? '',
        'atribute'   => json_encode($p['a'], JSON_UNESCAPED_UNICODE),
        'titlu_seo'  => $p['titluSeo'],
        'meta'       => $p['descriereSeo'],
        'spec'       => md5(json_encode($p['spec'])),
    ];
    $vechi = $nou ? [] : [
        'nume'       => $produs->get_name(),
        'descriere'  => $produs->get_description(),
        'scurta'     => $produs->get_short_description(),
        'pret'       => $produs->get_regular_price() !== '' ? wc_format_decimal($produs->get_regular_price(), 2) : '',
        'pret_redus' => $produs->get_sale_price() !== '' ? wc_format_decimal($produs->get_sale_price(), 2) : '',
        'stoc'       => $produs->get_stock_status(),
        'cantitate'  => (int) $produs->get_stock_quantity(),
        'sku'        => $produs->get_sku(),
        'categorii'  => implode(',', $produs->get_category_ids()),
        'brand'      => implode('', wp_get_post_terms($idPost, 'product_brand', ['fields' => 'names'])),
        'atribute'   => get_post_meta($idPost, '_avo_atribute', true),
        'titlu_seo'  => get_post_meta($idPost, '_avo_titlu_seo', true),
        'meta'       => get_post_meta($idPost, '_avo_descriere_seo', true),
        'spec'       => md5((string) get_post_meta($idPost, '_avo_specificatii', true)),
    ];
    $dif = [];
    foreach ($stare as $k => $v) {
        if (!$nou && (string) ($vechi[$k] ?? '') !== (string) $v) {
            $dif[$k] = in_array($k, ['descriere', 'spec', 'meta', 'scurta'], true) ? 'schimbat' : (($vechi[$k] ?? '') . ' → ' . $v);
        }
    }

    $imagini = avo_cai_imagini($p);
    if ($nou) $raport['adaugate'][] = "{$oc} · {$p['titlu']}";
    elseif ($dif) $raport['modificate'][] = "{$oc} · {$p['titlu']}: " . implode('; ', array_map(fn($k, $v) => "{$k} {$v}", array_keys($dif), $dif));
    else $raport['neschimbate']++;
    if ($simulare) continue;

    try {
        if ($nou) $produs->set_slug($p['slug']);
        $produs->set_name($p['titlu']);
        $produs->set_status('publish');
        $produs->set_catalog_visibility('visible');
        $produs->set_description($p['descriere']);
        $produs->set_short_description($p['descriereScurta'] ?? '');
        $produs->set_sku($sku);
        $produs->set_regular_price($stare['pret']);
        $produs->set_sale_price($stare['pret_redus']);
        $produs->set_tax_status('taxable');
        $produs->set_manage_stock(true);
        $produs->set_stock_quantity((int) $p['cantitate']);
        $produs->set_backorders($p['stoc'] === 'onbackorder' ? 'notify' : 'no');
        $produs->set_stock_status($p['stoc']);
        if (!empty($p['greutateKg'])) $produs->set_weight(wc_format_decimal($p['greutateKg'], 3));
        $produs->set_category_ids($cats ?: [$implicita]);
        $produs->set_menu_order((int) ($p['ordine'] ?? 0));

        $atr = [];
        $poz = 0;
        foreach ($AVO_ATRIBUTE as $cheie => [$slug, $nume, $format]) {
            if (!isset($p['a'][$cheie])) continue;
            [$idAtr, $tax] = $atribute[$cheie];
            $valoare = (string) $format($p['a'][$cheie]);
            $term = get_term_by('name', $valoare, $tax) ?: (($r = wp_insert_term($valoare, $tax)) && !is_wp_error($r) ? get_term($r['term_id'], $tax) : null);
            if (!$term) continue;
            $a = new WC_Product_Attribute();
            $a->set_id($idAtr);
            $a->set_name($tax);
            $a->set_options([$term->term_id]);
            $a->set_position($poz++);
            $a->set_visible(true);
            $a->set_variation(false);
            $atr[] = $a;
        }
        $produs->set_attributes($atr);

        if ($imagini) {
            $ids = array_values(array_filter(array_map(fn($c) => avo_imagine($c, $p['titlu'], false, $raport), $imagini)));
            if ($ids) {
                $produs->set_image_id($ids[0]);
                $produs->set_gallery_image_ids(array_slice($ids, 1));
            }
        }

        $id = $produs->save();

        if ($p['brand']) wp_set_object_terms($id, [$p['brand']], 'product_brand');
        else wp_set_object_terms($id, [], 'product_brand');

        update_post_meta($id, '_avo_oc_id', $oc);
        update_post_meta($id, '_avo_mpn', $p['mpn'] ?? '');
        update_post_meta($id, '_avo_titlu_seo', $p['titluSeo']);
        update_post_meta($id, '_avo_descriere_seo', $p['descriereSeo']);
        update_post_meta($id, '_avo_specificatii', wp_slash(json_encode($p['spec'], JSON_UNESCAPED_UNICODE)));
        update_post_meta($id, '_avo_atribute', wp_slash(json_encode($p['a'], JSON_UNESCAPED_UNICODE)));
        update_post_meta($id, '_avo_preturi_cantitate', wp_slash(json_encode($p['preturiCantitate'] ?? [])));
        update_post_meta($id, '_avo_actualizat_la', $date['dataExport']);
    } catch (Throwable $e) {
        $raport['erori'][] = "{$oc} · {$p['titlu']}: " . $e->getMessage();
    }
}

// Produsele care nu mai sunt în sursă: ciornă, nu ștergere.
foreach ($existente as $oc => $idPost) {
    if (isset($vazute[$oc]) || get_post_status($idPost) !== 'publish') continue;
    $raport['ciorna'][] = "{$oc} · " . get_the_title($idPost);
    if (!$simulare) wp_update_post(['ID' => $idPost, 'post_status' => 'draft']);
}

if (!$simulare) {
    // Numărătorile categoriilor și cache-ul de tranziente, după import în masă.
    wc_recount_all_terms();
    wc_delete_product_transients();
}

/* ─── Raport ───────────────────────────────────────────────────────────── */

$lista = fn($titlu, $x) => $x ? "\n## {$titlu} (" . count($x) . ")\n\n" . implode("\n", array_map(fn($l) => "- {$l}", $x)) . "\n" : '';
echo "# Raport import" . ($simulare ? ' — SIMULARE, nimic scris' : '') . "\n\n";
echo "Sursa: {$date['sursa']} · export {$date['dataExport']} · rulat " . current_time('Y-m-d H:i') . "\n\n";
echo "| | |\n|---|---|\n";
echo "| Adăugate | " . count($raport['adaugate']) . " |\n";
echo "| Modificate | " . count($raport['modificate']) . " |\n";
echo "| Neschimbate | {$raport['neschimbate']} |\n";
echo "| Trecute pe ciornă (dispărute din sursă) | " . count($raport['ciorna']) . " |\n";
echo "| Imagini încărcate acum | {$raport['imagini_noi']} |\n";
echo "| Erori | " . count($raport['erori']) . " |\n";
echo $lista('Erori', $raport['erori']);
echo $lista('Modificate', $raport['modificate']);
echo $lista('Trecute pe ciornă', $raport['ciorna']);
echo $lista('Adăugate', count($raport['adaugate']) > 40 ? array_merge(array_slice($raport['adaugate'], 0, 40), ['… și încă ' . (count($raport['adaugate']) - 40)]) : $raport['adaugate']);
