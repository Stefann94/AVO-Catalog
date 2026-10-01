<?php
/**
 * Plugin Name: AVO — Documente și date de catalog
 * Description: Face editabile din WordPress lucrurile pe care până acum le scria doar importul CSV. (1) O casetă pe fiecare produs cu prețul la volum, pragul, unitatea, capacitatea. (2) O listă de documente — fișe tehnice, manuale, declarații — cu alegere din biblioteca media. (3) Un buton care aduce o dată cele 877 de documente din descrierile importate, le pune în bibliotecă și curăță descrierile de CSS și de marca furnizorului. Se găsește la Produse → Documente AVO.
 * Version:     1.0.1
 * Author:      Avo Grup Invest
 * Requires PHP: 7.4
 *
 * ─── DE CE UN PLUGIN SEPARAT ─────────────────────────────────────────────
 *
 * „AVO — Legătura cu site-ul" funcționează și ține site-ul în priză: el trimite
 * semnalul de reconstrucție la fiecare salvare de produs. Dacă l-aș fi extins,
 * o greșeală aici ar fi oprit și aia. Separat, se dezactivează singur.
 *
 * ─── DE CE NU PRIN API ───────────────────────────────────────────────────
 *
 * Pentru că nu se poate, și pentru că nu trebuie.
 *
 * Nu se poate: serverul întoarce 503 la orice autentificare eșuată, iar parola
 * de aplicație e respinsă. Testat: chei WooCommerce greșite → 503, chei bune →
 * 200. Deci un strat de securitate ascunde motivul real, iar `wp/v2/media` —
 * singura cale de a urca fișiere din afară — rămâne închisă.
 *
 * Nu trebuie: cerința a fost ca totul să se poată modifica din WordPress, de
 * oameni care nu scriu cod. Un import care rulează din afară, prin chei de API,
 * e exact opusul. Ăsta rulează pe server, dintr-un buton, și orice coleg îl
 * poate apăsa din nou luna viitoare.
 * ═════════════════════════════════════════════════════════════════════════
 */

if (!defined('ABSPATH')) {
    exit;
}
if (defined('AVO_DOCUMENTE_VERSIUNE')) {
    return;
}
define('AVO_DOCUMENTE_VERSIUNE', '1.0.1');

/** Cheia sub care stau documentele pe produs. */
const AVO_META_DOCUMENTE = '_avo_documente';

/** Câmpurile de catalog, cu eticheta lor în română. Ordinea e cea din casetă. */
function avo_doc_campuri() {
    return [
        '_pret_volum'     => ['Preț la volum', 'Al doilea preț din catalog, pentru cantitate. Lasă gol dacă produsul n-are.'],
        '_prag_volum'     => ['Prag de cantitate', 'De la ce cantitate se aplică: „4 paleți", „12 buc".'],
        '_unitate_pret'   => ['Unitatea prețului', '„buc" sau „panou".'],
        '_pret_container' => ['Preț pe container', 'Ex. „la cerere", la produsele ofertate pe container.'],
        '_capacitate_kwh' => ['Capacitate (kWh)', 'Capacitatea exactă, unde catalogul o declară.'],
        '_pret_fara_tva'  => ['Preț fără TVA', 'Baza de calcul. Prețul afișat îl conține pe acesta plus TVA.'],
        '_pret_b2b_eur'   => ['Preț partener (EUR)', 'Prețul din catalogul de parteneri. Nu se afișează public.'],
        '_sursa_catalog'  => ['Sursa prețului', 'Ex. „Catalog Solar One 10.2026".'],
    ];
}

/* =========================================================================
 * 1. CASETA DE PE PRODUS
 * ====================================================================== */

add_action('add_meta_boxes', function () {
    add_meta_box(
        'avo_date_catalog',
        'Date catalog AVO',
        'avo_deseneaza_caseta',
        'product',
        'normal',
        'high'
    );
});

function avo_deseneaza_caseta($post) {
    wp_nonce_field('avo_salveaza_produs', 'avo_nonce');
    $documente = get_post_meta($post->ID, AVO_META_DOCUMENTE, true);
    if (!is_array($documente)) {
        $documente = [];
    }
    ?>
    <style>
      .avo-grila{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:12px 0 24px}
      .avo-camp label{display:block;font-weight:600;margin-bottom:4px}
      .avo-camp input{width:100%}
      .avo-camp .descriere{color:#646970;font-size:12px;margin-top:4px;display:block}
      .avo-doc{display:flex;gap:10px;align-items:center;margin-bottom:8px;padding:10px;background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px}
      .avo-doc input[type=text]{flex:1 1 auto}
      .avo-doc .fisier{flex:0 0 240px;color:#646970;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .avo-titlu-sectiune{font-size:14px;font-weight:600;margin:24px 0 8px;padding-top:16px;border-top:1px solid #dcdcde}
    </style>

    <div class="avo-grila">
      <?php foreach (avo_doc_campuri() as $cheie => [$eticheta, $ajutor]) : ?>
        <div class="avo-camp">
          <label for="avo<?php echo esc_attr($cheie); ?>"><?php echo esc_html($eticheta); ?></label>
          <input type="text" id="avo<?php echo esc_attr($cheie); ?>"
                 name="avo_camp[<?php echo esc_attr($cheie); ?>]"
                 value="<?php echo esc_attr(get_post_meta($post->ID, $cheie, true)); ?>">
          <span class="descriere"><?php echo esc_html($ajutor); ?></span>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="avo-titlu-sectiune">Documente</div>
    <p class="description">Fișe tehnice, manuale, declarații de conformitate. Apar pe pagina produsului, pe site.</p>
    <div id="avo-documente"><?php
      foreach ($documente as $i => $d) {
          avo_rand_document((int) $i, $d['titlu'] ?? '', (int) ($d['id'] ?? 0));
      }
    ?></div>
    <p><button type="button" class="button" id="avo-adauga-document">Adaugă document</button></p>

    <script>
    (function () {
      var gazda = document.getElementById('avo-documente');
      var urmator = <?php echo count($documente); ?>;

      function leagaAlegerea(rand) {
        rand.querySelector('.avo-alege').addEventListener('click', function () {
          // Biblioteca media a WordPress-ului, aceeași pe care o știe oricine
          // din „Adaugă media". Nu inventăm un încărcător propriu.
          var cadru = wp.media({ title: 'Alege documentul', library: { type: ['application/pdf'] }, button: { text: 'Folosește' }, multiple: false });
          cadru.on('select', function () {
            var f = cadru.state().get('selection').first().toJSON();
            rand.querySelector('.avo-id').value = f.id;
            rand.querySelector('.fisier').textContent = f.filename;
            var titlu = rand.querySelector('.avo-titlu');
            if (!titlu.value) titlu.value = f.title || f.filename;
          });
          cadru.open();
        });
        rand.querySelector('.avo-sterge').addEventListener('click', function () { rand.remove(); });
      }

      Array.prototype.forEach.call(gazda.children, leagaAlegerea);

      document.getElementById('avo-adauga-document').addEventListener('click', function () {
        var d = document.createElement('div');
        d.className = 'avo-doc';
        d.innerHTML = '<input type="text" class="avo-titlu" name="avo_doc[' + urmator + '][titlu]" placeholder="Titlul documentului">' +
                      '<input type="hidden" class="avo-id" name="avo_doc[' + urmator + '][id]" value="">' +
                      '<span class="fisier">niciun fișier ales</span>' +
                      '<button type="button" class="button avo-alege">Alege din bibliotecă</button>' +
                      '<button type="button" class="button-link-delete avo-sterge">Șterge</button>';
        gazda.appendChild(d);
        leagaAlegerea(d);
        urmator++;
      });
    })();
    </script>
    <?php
}

function avo_rand_document($i, $titlu, $id) {
    $nume = $id ? basename(get_attached_file($id)) : 'niciun fișier ales';
    ?>
    <div class="avo-doc">
      <input type="text" class="avo-titlu" name="avo_doc[<?php echo $i; ?>][titlu]" value="<?php echo esc_attr($titlu); ?>" placeholder="Titlul documentului">
      <input type="hidden" class="avo-id" name="avo_doc[<?php echo $i; ?>][id]" value="<?php echo (int) $id; ?>">
      <span class="fisier"><?php echo esc_html($nume); ?></span>
      <button type="button" class="button avo-alege">Alege din bibliotecă</button>
      <button type="button" class="button-link-delete avo-sterge">Șterge</button>
    </div>
    <?php
}

/** Scriptul bibliotecii media nu se încarcă singur pe ecranul de produs. */
add_action('admin_enqueue_scripts', function ($ecran) {
    if ($ecran === 'post.php' || $ecran === 'post-new.php') {
        wp_enqueue_media();
    }
});

add_action('save_post_product', function ($id_post) {
    if (!isset($_POST['avo_nonce']) || !wp_verify_nonce($_POST['avo_nonce'], 'avo_salveaza_produs')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $id_post)) {
        return;
    }

    foreach (avo_doc_campuri() as $cheie => $_) {
        $v = isset($_POST['avo_camp'][$cheie]) ? sanitize_text_field(wp_unslash($_POST['avo_camp'][$cheie])) : '';
        // Gol înseamnă „nu există", nu „zero". Ștergem cheia, ca site-ul să
        // distingă un produs fără preț de volum de unul cu prețul 0.
        if ($v === '') {
            delete_post_meta($id_post, $cheie);
        } else {
            update_post_meta($id_post, $cheie, $v);
        }
    }

    $documente = [];
    if (!empty($_POST['avo_doc']) && is_array($_POST['avo_doc'])) {
        foreach (wp_unslash($_POST['avo_doc']) as $d) {
            $id = isset($d['id']) ? (int) $d['id'] : 0;
            if (!$id) {
                continue; // un rând fără fișier ales n-are ce salva
            }
            $documente[] = [
                'titlu' => sanitize_text_field($d['titlu'] ?? ''),
                'id'    => $id,
            ];
        }
    }
    if ($documente) {
        update_post_meta($id_post, AVO_META_DOCUMENTE, $documente);
    } else {
        delete_post_meta($id_post, AVO_META_DOCUMENTE);
    }
}, 10, 1);

/* =========================================================================
 * 2. DOCUMENTELE, ÎN GRAPHQL
 * ====================================================================== */

add_action('graphql_register_types', function () {
    register_graphql_object_type('DocumentProdus', [
        'description' => 'Un document atașat produsului: fișă tehnică, manual, declarație.',
        'fields'      => [
            'titlu'  => ['type' => 'String', 'description' => 'Cum se numește documentul pe pagină.'],
            'url'    => ['type' => 'String', 'description' => 'Adresa fișierului.'],
            'tip'    => ['type' => 'String', 'description' => 'Categoria: fisa, manual, conformitate, brosura, altul.'],
            'octeti' => ['type' => 'Int',    'description' => 'Mărimea, ca pagina să poată scrie „PDF, 2,4 MB".'],
        ],
    ]);

    register_graphql_field('Product', 'documente', [
        'type'        => ['list_of' => 'DocumentProdus'],
        'description' => 'Documentele atașate produsului. Listă goală când n-are.',
        'resolve'     => function ($sursa) {
            $id = null;
            foreach (['ID', 'databaseId', 'id'] as $c) {
                if (is_object($sursa) && isset($sursa->$c) && is_numeric($sursa->$c)) {
                    $id = (int) $sursa->$c;
                    break;
                }
            }
            if (!$id) {
                return [];
            }
            $lista = get_post_meta($id, AVO_META_DOCUMENTE, true);
            if (!is_array($lista)) {
                return [];
            }
            $iesire = [];
            foreach ($lista as $d) {
                $att = (int) ($d['id'] ?? 0);
                $url = $att ? wp_get_attachment_url($att) : '';
                if (!$url) {
                    continue;
                }
                $cale = get_attached_file($att);
                $iesire[] = [
                    'titlu'  => (string) ($d['titlu'] ?? ''),
                    'url'    => $url,
                    'tip'    => avo_tip_document((string) ($d['titlu'] ?? '') . ' ' . basename((string) $cale)),
                    'octeti' => ($cale && file_exists($cale)) ? (int) filesize($cale) : null,
                ];
            }
            return $iesire;
        },
    ]);
});

/** Categoria documentului, ghicită din denumire. Pentru grupare pe pagină. */
function avo_tip_document($text) {
    $t = remove_accents(mb_strtolower($text));
    if (preg_match('/fisa|fișă|tehnic|datasheet/u', $t))            return 'fisa';
    if (preg_match('/manual|instalare|utilizare|user/u', $t))        return 'manual';
    if (preg_match('/conformitate|certificat|declarat|doc\b/u', $t)) return 'conformitate';
    if (preg_match('/brosura|brochure|catalog/u', $t))               return 'brosura';
    return 'altul';
}

/* =========================================================================
 * 3. IMPORTUL DE O SINGURĂ DATĂ
 * ====================================================================== */

/**
 * Cât se procesează la o apăsare.
 *
 * Trei produse, nu toate. Un produs are până la zece documente, iar unele
 * manuale au 40 MB; o sută de descărcări într-o singură cerere ar depăși orice
 * limită de timp PHP și ar lăsa treaba pe jumătate, fără să se vadă unde.
 * La trei, pagina se reîncarcă la fiecare douăzeci de secunde și arată unde a
 * ajuns. Se poate închide oricând și relua — ce s-a făcut rămâne făcut.
 */
const AVO_PE_TURA = 3;

add_action('admin_menu', function () {
    add_submenu_page(
        'edit.php?post_type=product',
        'Documente AVO',
        'Documente AVO',
        'manage_woocommerce',
        'avo-documente',
        'avo_pagina_import'
    );
});

/** Produsele care mai au linkuri PDF în descriere, deci n-au fost procesate. */
function avo_produse_de_procesat($limita = -1) {
    $q = new WP_Query([
        'post_type'      => 'product',
        'post_status'    => ['publish', 'draft'],
        'posts_per_page' => $limita,
        's'              => 'solarone.ro/catalog/pdfs/',
        'fields'         => 'ids',
        'orderby'        => 'ID',
        'order'          => 'ASC',
    ]);
    return $q->posts;
}

function avo_pagina_import() {
    if (!current_user_can('manage_woocommerce')) {
        wp_die('Nu ai dreptul.');
    }
    $ramase = count(avo_produse_de_procesat());
    $raport = get_transient('avo_raport_import');
    delete_transient('avo_raport_import');
    ?>
    <div class="wrap">
      <h1>Documente AVO</h1>

      <?php if ($raport) : ?>
        <div class="notice notice-<?php echo esc_attr($raport['fel']); ?>"><p><?php echo wp_kses_post($raport['text']); ?></p></div>
      <?php endif; ?>

      <p>Descrierile venite din catalog conțin linkuri către fișele tehnice, manualele și declarațiile de pe solarone.ro,
         plus foaia de stil a furnizorului și numele lui. Butonul de mai jos, la fiecare apăsare:</p>
      <ol>
        <li>descarcă documentele pe serverul vostru și le pune în biblioteca media;</li>
        <li>le atașează produsului, în secțiunea <em>Documente</em>;</li>
        <li>scoate din descriere CSS-ul, bannerul „Configurator Solar One" și numele furnizorului.</li>
      </ol>

      <p><strong>Produse rămase de procesat: <?php echo (int) $ramase; ?></strong></p>

      <?php if ($ramase > 0) : ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
          <input type="hidden" name="action" value="avo_importa_documente">
          <?php wp_nonce_field('avo_importa_documente'); ?>
          <p>
            <button type="submit" class="button button-primary button-hero">
              Importă documentele (<?php echo min(AVO_PE_TURA, $ramase); ?> produse)
            </button>
          </p>
        </form>
        <p class="description">Apasă din nou după fiecare rundă. Se poate întrerupe oricând — ce s-a importat rămâne.</p>
      <?php else : ?>
        <p><strong>Gata.</strong> Toate descrierile sunt curățate și documentele atașate.</p>
      <?php endif; ?>
    </div>
    <?php
}

add_action('admin_post_avo_importa_documente', function () {
    if (!current_user_can('manage_woocommerce')) {
        wp_die('Nu ai dreptul.');
    }
    check_admin_referer('avo_importa_documente');

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $produse  = avo_produse_de_procesat(AVO_PE_TURA);
    $documente = 0;
    $erori     = [];

    foreach ($produse as $id) {
        $post = get_post($id);
        if (!$post) {
            continue;
        }
        $html = (string) $post->post_content;

        // ── Documentele ──
        $lista = get_post_meta($id, AVO_META_DOCUMENTE, true);
        if (!is_array($lista)) {
            $lista = [];
        }
        $deja = [];
        foreach ($lista as $d) {
            $deja[(int) ($d['id'] ?? 0)] = true;
        }

        if (preg_match_all('#href="(https://www\.solarone\.ro/catalog/pdfs/[^"]+\.pdf)"#i', $html, $m)) {
            foreach (array_unique($m[1]) as $url) {
                $rezultat = avo_adu_documentul($url, $id, $html);
                if (is_wp_error($rezultat)) {
                    $erori[] = basename(parse_url($url, PHP_URL_PATH)) . ': ' . $rezultat->get_error_message();
                    continue;
                }
                if (!isset($deja[$rezultat['id']])) {
                    $lista[] = ['titlu' => $rezultat['titlu'], 'id' => $rezultat['id']];
                    $deja[$rezultat['id']] = true;
                    $documente++;
                }
            }
        }
        if ($lista) {
            update_post_meta($id, AVO_META_DOCUMENTE, $lista);
        }

        // ── Curățarea descrierii ──
        wp_update_post([
            'ID'           => $id,
            'post_content' => avo_curata_descrierea($html),
        ]);
    }

    set_transient('avo_raport_import', [
        'fel'  => $erori ? 'warning' : 'success',
        'text' => sprintf(
            'Procesate %d produse, %d documente aduse.%s',
            count($produse),
            $documente,
            $erori ? ' Probleme: ' . esc_html(implode('; ', array_slice($erori, 0, 5))) : ''
        ),
    ], 120);

    wp_safe_redirect(admin_url('edit.php?post_type=product&page=avo-documente'));
    exit;
});

/**
 * Aduce un PDF în biblioteca media, dacă nu e deja acolo.
 *
 * Caută întâi după numele fișierului: aceeași fișă tehnică apare la mai multe
 * produse — panourile Canadian Solar împart manualul de instalare — iar fără
 * verificarea asta am fi avut aceeași arhivă de 40 MB de zece ori pe disc.
 */
function avo_adu_documentul($url, $id_produs, $html) {
    $nume = basename(parse_url($url, PHP_URL_PATH));
    $nume = urldecode($nume);

    $existent = get_posts([
        'post_type'      => 'attachment',
        'posts_per_page' => 1,
        'fields'         => 'ids',
        'meta_query'     => [['key' => '_avo_sursa_document', 'value' => $url]],
    ]);
    if ($existent) {
        return ['id' => (int) $existent[0], 'titlu' => avo_titlu_document($nume, $html, $url)];
    }

    $temp = download_url($url, 300);
    if (is_wp_error($temp)) {
        return $temp;
    }

    $fisier = ['name' => $nume, 'tmp_name' => $temp];
    $id = media_handle_sideload($fisier, 0, null, ['post_mime_type' => 'application/pdf']);
    if (is_wp_error($id)) {
        @unlink($temp);
        return $id;
    }

    update_post_meta($id, '_avo_sursa_document', $url);
    return ['id' => (int) $id, 'titlu' => avo_titlu_document($nume, $html, $url)];
}

/**
 * Titlul documentului, luat din tabelul descrierii dacă e scris acolo.
 *
 * Descrierea conține perechi „Fisa Tehnica Canadian Solar CS6.2-48TD-460 (EN)"
 * → link. Titlul scris de om e mai bun decât numele fișierului, care e un slug
 * cu o amprentă la coadă: `solar-one-manual-...-bafbf94a36.pdf`.
 */
function avo_titlu_document($nume, $html, $url) {
    $u = preg_quote($url, '#');
    if (preg_match('#<td[^>]*>([^<]{4,120})</td>\s*<td[^>]*>\s*<a[^>]*href="' . $u . '"#i', $html, $m)) {
        return trim(html_entity_decode($m[1], ENT_QUOTES, 'UTF-8'));
    }
    if (preg_match('#href="' . $u . '"[^>]*>([^<]{4,160})<#i', $html, $m)) {
        return trim(html_entity_decode($m[1], ENT_QUOTES, 'UTF-8'));
    }
    // Ultima soluție: numele fișierului, fără amprentă și fără cratime.
    $t = preg_replace('/-[0-9a-f]{8,}\.pdf$/i', '', $nume);
    $t = preg_replace('/\.pdf$/i', '', $t);
    return ucfirst(trim(str_replace(['-', '_'], ' ', $t)));
}

/**
 * Scoate din descriere ce nu are ce căuta pe site-ul AVO.
 *
 * CE SE SCOATE, ȘI DE CE:
 *
 *   <style>  ... site-ul afișează descrierea ca text simplu, scoțând doar
 *               etichetele. Conținutul foii de stil rămânea — 9.000 de
 *               caractere de CSS, pe fiecare fișă de produs.
 *   <script> ... același motiv, plus că n-are ce căuta în conținut.
 *   bannerul „Configurator Solar One" — trimite clientul pe site-ul
 *               furnizorului, de pe pagina de produs a AVO.
 *   „SolarOne / <marcă>" — prima linie a fiecărei descrieri era numele
 *               furnizorului.
 *   tabelul de documente — a fost mutat în secțiunea Documente, unde se poate
 *               edita. Lăsat aici, ar fi apărut de două ori.
 *   linkurile rămase către solarone.ro — textul se păstrează, dispare doar
 *               legătura.
 *
 * CE SE PĂSTREAZĂ: titlul, modelul, descrierea, punctele cheie, utilizarea,
 * siguranța și tabelul de specificații. Adică tot ce e despre produs.
 */
function avo_curata_descrierea($html) {
    $h = $html;

    $h = preg_replace('#<style\b[^>]*>.*?</style>#is', '', $h);
    $h = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $h);

    // CSS rămas FĂRĂ eticheta lui.
    //
    // Excel nu ține mai mult de 32.767 de caractere într-o celulă. Trei
    // descrieri din export sunt tăiate fix la limită, în mijlocul foii de
    // stil — iar tăietura a înghițit și `<style>`-ul de deschidere. Ce
    // rămâne e CSS gol-goluț, uneori împachetat de WordPress într-un `<p>`.
    // Regula de mai sus nu-l vede, fiindcă nu mai există etichetă.
    //
    // Se taie de la prima regulă CSS până la capăt: tot ce urmează acolo e
    // foaie de stil trunchiată, iar conținutul produsului s-a terminat deja
    // cu `</section>`.
    if (preg_match('#(<p>\s*)?\.so-[a-z-]+\s*\{#i', $h, $m, PREG_OFFSET_CAPTURE)) {
        $h = substr($h, 0, $m[0][1]);
    }
    $h = preg_replace('#<a[^>]*class="[^"]*so-badge2[^"]*"[^>]*>.*?</a>#is', '', $h);
    $h = preg_replace('#<p[^>]*class="[^"]*so-eyebrow[^"]*"[^>]*>.*?</p>#is', '', $h);

    // Tabelul de documente, cu titlul „Documentație:" de deasupra lui.
    $h = preg_replace('#<p>\s*Documenta[^<]*</p>\s*<div class="so-table-shell">\s*<table[^>]*so-doc-table.*?</table>\s*</div>#is', '', $h);
    $h = preg_replace('#<div class="so-table-shell">\s*<table[^>]*so-doc-table.*?</table>\s*</div>#is', '', $h);

    // Orice link rămas spre furnizor: rămâne textul, cade legătura.
    $h = preg_replace('#<a[^>]*href="[^"]*solarone\.ro[^"]*"[^>]*>(.*?)</a>#is', '$1', $h);

    $h = preg_replace('#<!--.*?-->#s', '', $h);
    $h = preg_replace('#\s*(SolarOne|Solar One)\s*/\s*#u', '', $h);
    $h = preg_replace('#<div>\s*</div>#', '', $h);
    $h = preg_replace('#\n{3,}#', "\n\n", $h);

    return trim($h);
}
