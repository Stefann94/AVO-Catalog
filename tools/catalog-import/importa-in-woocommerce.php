<?php
/**
 * Importă CSV-ul de catalog în WooCommerce, prin importatorul oficial.
 *
 * Se rulează din tools/wp-local, unde directorul ăsta e montat la /import:
 *
 *   docker compose run --rm -T wpcli eval-file /import/importa-in-woocommerce.php
 *
 * ─── DE CE PRIN IMPORTATORUL WOOCOMMERCE, NU CU COD PROPRIU ───────────────
 *
 * CSV-ul e scris de parse-catalog.js exact în formatul pe care îl așteaptă
 * importatorul din WooCommerce → Produse → Import. Coloanele `Categories` cu
 * ierarhie pe `>`, `Attribute N global` care cere taxonomii `pa_*`, coloanele
 * `Meta:` — toate au deja o implementare testată acolo.
 *
 * Scrisă de mână, aceeași treabă ar însemna crearea termenilor de categorie pe
 * două niveluri, înregistrarea taxonomiilor de atribut și a termenilor lor, plus
 * potrivirea după SKU la reimport. Adică rescrierea unei componente care există.
 *
 * ─── MAPAREA ──────────────────────────────────────────────────────────────
 *
 * `auto_map_columns()` din controlerul de import e `protected`, deci nu se poate
 * chema din afară. O construim aici, după convenția internă a importatorului,
 * citită din sursă:
 *
 *   „Attribute 1 name"      -> attributes:name0       (indexul e 0-based)
 *   „Attribute 1 value(s)"  -> attributes:value0
 *   „Attribute 1 visible"   -> attributes:visible0
 *   „Attribute 1 global"    -> attributes:taxonomy0   (1 = taxonomie pa_*)
 *   „Meta: _pret_volum"     -> meta:_pret_volum
 *
 * Maparea e ASOCIATIVĂ, cheia fiind numele exact al coloanei — nu pe poziție.
 * Verificat în set_mapped_keys(): `isset( $mapping[ $key ] )`.
 *
 * ─── REIMPORTUL NU DUPLICĂ ────────────────────────────────────────────────
 *
 * `update_existing => true` face potrivirea după SKU: rulat de două ori,
 * actualizează aceleași produse în loc să creeze încă un set. Ăsta e și modul
 * în care se comportă importul lunar real.
 *
 * NU ATINGE IMAGINILE. CSV-ul n-are coloana `Images`, iar importatorul nu
 * modifică ce nu i se dă. Fotografiile puse în biblioteca media rămân legate de
 * produse peste orice reimport de prețuri — proprietatea pe care se sprijină
 * tools/wordpress/incarca-poze.js.
 */

if ( ! class_exists( 'WooCommerce' ) ) {
	WP_CLI::error( 'WooCommerce nu e activ.' );
}

if ( ! class_exists( 'WC_Product_CSV_Importer' ) ) {
	include_once WC_ABSPATH . 'includes/import/class-wc-product-csv-importer.php';
}

$fisier = '/import/solar-one-woocommerce.csv';
if ( ! is_readable( $fisier ) ) {
	WP_CLI::error( "Nu pot citi {$fisier}. Ai rulat parse-catalog.js?" );
}

// Antetul, ca să construim maparea din numele reale ale coloanelor.
$fh = fopen( $fisier, 'r' );
$antet = fgetcsv( $fh );
fclose( $fh );

// Primul câmp poate purta BOM-ul UTF-8; importatorul l-ar trata ca parte din nume.
if ( isset( $antet[0] ) ) {
	$antet[0] = preg_replace( '/^\xEF\xBB\xBF/', '', $antet[0] );
}

$FIXE = array(
	'ID'                    => 'id',
	'Type'                  => 'type',
	'SKU'                   => 'sku',
	'Name'                  => 'name',
	'Published'             => 'published',
	'Is featured?'          => 'featured',
	'Visibility in catalog' => 'catalog_visibility',
	'Short description'     => 'short_description',
	'Description'           => 'description',
	'Tax status'            => 'tax_status',
	'Tax class'             => 'tax_class',
	'In stock?'             => 'stock_status',
	'Stock'                 => 'stock_quantity',
	'Regular price'         => 'regular_price',
	'Sale price'            => 'sale_price',
	'Categories'            => 'category_ids',
	'Tags'                  => 'tag_ids',
	'Images'                => 'images',
);

$mapare     = array();
$nemapate   = array();
foreach ( $antet as $coloana ) {
	$c = trim( $coloana );
	if ( '' === $c ) {
		continue;
	}

	if ( preg_match( '/^Attribute (\d+) name$/', $c, $m ) ) {
		$mapare[ $coloana ] = 'attributes:name' . ( (int) $m[1] - 1 );
	} elseif ( preg_match( '/^Attribute (\d+) value\(s\)$/', $c, $m ) ) {
		$mapare[ $coloana ] = 'attributes:value' . ( (int) $m[1] - 1 );
	} elseif ( preg_match( '/^Attribute (\d+) visible$/', $c, $m ) ) {
		$mapare[ $coloana ] = 'attributes:visible' . ( (int) $m[1] - 1 );
	} elseif ( preg_match( '/^Attribute (\d+) global$/', $c, $m ) ) {
		$mapare[ $coloana ] = 'attributes:taxonomy' . ( (int) $m[1] - 1 );
	} elseif ( 0 === strpos( $c, 'Meta: ' ) ) {
		$mapare[ $coloana ] = 'meta:' . substr( $c, 6 );
	} elseif ( isset( $FIXE[ $c ] ) ) {
		$mapare[ $coloana ] = $FIXE[ $c ];
	} else {
		$nemapate[] = $c;
	}
}

WP_CLI::log( sprintf( '%d coloane, %d mapate', count( $antet ), count( $mapare ) ) );
if ( $nemapate ) {
	WP_CLI::warning( 'Coloane nemapate (ignorate): ' . implode( ', ', $nemapate ) );
}

$importator = new WC_Product_CSV_Importer(
	$fisier,
	array(
		'mapping'         => $mapare,
		'parse'           => true,
		'update_existing' => true,
		'lines'           => -1,
		'prevent_timeouts' => false,
	)
);

WP_CLI::log( 'Import în curs...' );
$rezultat = $importator->import();

$creat     = count( $rezultat['imported'] );
$actualizat = isset( $rezultat['updated'] ) ? count( $rezultat['updated'] ) : 0;
$sarit     = isset( $rezultat['skipped'] ) ? count( $rezultat['skipped'] ) : 0;
$esuat     = count( $rezultat['failed'] );

WP_CLI::log( '' );
WP_CLI::log( sprintf( 'create %d · actualizate %d · sărite %d · eșuate %d', $creat, $actualizat, $sarit, $esuat ) );

foreach ( array_slice( $rezultat['failed'], 0, 10 ) as $eroare ) {
	WP_CLI::warning( is_wp_error( $eroare ) ? $eroare->get_error_message() : print_r( $eroare, true ) );
}

$total = (int) wp_count_posts( 'product' )->publish;
WP_CLI::success( "În magazin sunt acum {$total} produse publicate." );
