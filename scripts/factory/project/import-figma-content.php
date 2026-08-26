<?php
/**
 * One-time, idempotent AURA content import.
 *
 * Run: wp eval-file wp-content/themes/slawinsky-boilerplate/scripts/factory/project/import-figma-content.php
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

final class Aura_Figma_Content_Importer {
	private string $theme_dir;
	private array $media = array();
	private array $pages = array();
	private array $products = array();
	private array $posts = array();

	public function __construct() {
		$this->theme_dir = get_stylesheet_directory();
	}

	public function run(): void {
		$this->import_media();
		$this->import_pages();
		$this->import_products();
		$this->import_product_reviews();
		$this->import_posts();
		$this->import_global_options();
		$this->import_page_fields();
		$this->import_menus();
		$this->configure_wordpress();
		WP_CLI::success( 'AURA: import zakończony.' );
	}

	private function owned_post( string $slug, string $post_type, array $postarr ): int {
		$existing = get_page_by_path( $slug, OBJECT, $post_type );
		if ( $existing ) {
			if ( '1' !== get_post_meta( $existing->ID, '_aura_factory_owned', true ) ) {
				WP_CLI::warning( sprintf( 'Pominięto niepowiązany wpis %s (%d).', $slug, $existing->ID ) );
				return 0;
			}
			$postarr['ID'] = $existing->ID;
			$post_id       = wp_update_post( wp_slash( $postarr ), true );
		} else {
			$postarr['post_name'] = $slug;
			$postarr['post_type'] = $post_type;
			$postarr['post_status'] = 'publish';
			$post_id = wp_insert_post( wp_slash( $postarr ), true );
		}
		if ( is_wp_error( $post_id ) ) {
			WP_CLI::error( $post_id->get_error_message() );
		}
		update_post_meta( $post_id, '_aura_factory_owned', '1' );
		return (int) $post_id;
	}

	private function attachment( string $key, string $relative_path, string $title ): int {
		$found = get_posts(
			array(
				'post_type' => 'attachment', 'post_status' => 'inherit', 'posts_per_page' => 1, 'fields' => 'ids',
				'meta_key' => '_aura_factory_asset_key', 'meta_value' => $key,
			)
		);
		if ( $found ) {
			return (int) $found[0];
		}

		$source = $this->theme_dir . '/assets/img/aura/figma-source/' . $relative_path;
		if ( ! is_file( $source ) ) {
			WP_CLI::warning( 'Brak assetu: ' . $source );
			return 0;
		}
		$uploads = wp_upload_dir();
		$name    = wp_unique_filename( $uploads['path'], basename( $relative_path ) );
		$target  = trailingslashit( $uploads['path'] ) . $name;
		if ( ! copy( $source, $target ) ) {
			WP_CLI::warning( 'Nie można skopiować assetu: ' . $relative_path );
			return 0;
		}
		$type = wp_check_filetype( $name );
		$id   = wp_insert_attachment( array( 'post_mime_type' => $type['type'], 'post_title' => $title, 'post_status' => 'inherit' ), $target );
		if ( ! $id || is_wp_error( $id ) ) {
			return 0;
		}
		require_once ABSPATH . 'wp-admin/includes/image.php';
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $target ) );
		update_post_meta( $id, '_aura_factory_asset_key', $key );
		return (int) $id;
	}

	private function import_media(): void {
		$assets = array(
			'hero' => array( 'home-07.png', 'AURA — kolekcja After Hours' ),
			'product_amber' => array( 'home-01.png', 'Fig & Black Tea — bursztynowe szkło' ),
			'product_green' => array( 'home-04.png', 'Fig & Black Tea — zielone szkło' ),
			'collection' => array( 'home-03.png', 'Zielone rytuały' ),
			'editorial' => array( 'home-02.png', 'Domowy rytuał ze świecą' ),
			'candles' => array( 'home-08.png', 'Świece AURA' ),
			'waxes' => array( 'home-05.png', 'Woski zapachowe AURA' ),
			'finder' => array( 'home-06.png', 'Składniki kompozycji zapachowych' ),
			'velvet' => array( 'home-09.png', 'Velvet Tomato Leaf' ),
			'starter' => array( 'shop-05.png', 'Zestaw startowy AURA' ),
			'about_hero' => array( 'about-01.png', 'Pracownia AURA' ),
			'about_origin' => array( 'about-02.png', 'Tworzenie zapachu AURA' ),
			'about_materials_1' => array( 'about-03.png', 'Naturalne materiały AURA' ),
			'about_materials_2' => array( 'about-04.png', 'Ręczna produkcja AURA' ),
			'product_note_1' => array( 'product-03.png', 'Nuty głowy Fig & Black Tea' ),
			'product_note_2' => array( 'product-04.png', 'Nuty serca Fig & Black Tea' ),
			'product_note_3' => array( 'product-05.png', 'Nuty bazy Fig & Black Tea' ),
			'product_story' => array( 'product-01.png', 'Historia Fig & Black Tea' ),
			'article_hero' => array( 'article-01.png', 'Świeca w sypialni' ),
			'article_inline' => array( 'article-05.png', 'Wieczorny rytuał w sypialni' ),
			'article_author' => array( 'article-08.png', 'Anna Kowalska' ),
		);
		$assets['product_main'] = array( 'product-01.png', 'Fig & Black Tea - fotografia glowna' );
		$assets['product_lifestyle'] = array( 'product-02.png', 'Fig & Black Tea - rytual domowy' );
		$assets['product_white'] = array( 'product-03.png', 'Fig & Black Tea - biala ceramika' );
		$assets['product_waxes'] = array( 'product-04.png', 'Woski zapachowe' );
		$assets['product_green_detail'] = array( 'product-06.png', 'Fig & Black Tea - zielona swieca' );
		$assets['product_amber_detail'] = array( 'product-07.png', 'Fig & Black Tea - bursztynowa swieca' );
		$assets['product_note_1'] = array( 'product-05.png', 'Nuty glowy Fig & Black Tea' );
		$assets['product_note_2'] = array( 'product-05.png', 'Nuty serca Fig & Black Tea' );
		$assets['product_note_3'] = array( 'product-05.png', 'Nuty bazy Fig & Black Tea' );
		$assets['product_story'] = array( 'product-02.png', 'Historia Fig & Black Tea' );
		for ( $i = 1; $i <= 14; $i++ ) {
			$assets[ 'blog_' . $i ] = array( sprintf( 'blog-%02d.png', $i ), 'Journal AURA ' . $i );
		}
		foreach ( $assets as $key => $data ) {
			$this->media[ $key ] = $this->attachment( $key, $data[0], $data[1] );
		}
	}

	private function import_pages(): void {
		$this->pages['home'] = $this->owned_post( 'aura-home', 'page', array( 'post_title' => 'AURA', 'post_content' => '' ) );
		$this->pages['about'] = $this->owned_post( 'o-nas', 'page', array( 'post_title' => 'O nas', 'post_content' => '', 'page_template' => 'template-about.php' ) );
		$this->pages['blog'] = $this->owned_post( 'journal', 'page', array( 'post_title' => 'Journal', 'post_content' => '', 'page_template' => 'template-blog.php' ) );
		$this->pages['shop'] = $this->owned_post( 'sklep-aura', 'page', array( 'post_title' => 'Sklep', 'post_content' => '' ) );
		$this->pages['cart'] = $this->owned_post( 'koszyk-aura', 'page', array( 'post_title' => 'Koszyk', 'post_content' => '[woocommerce_cart]' ) );
		$this->pages['checkout'] = $this->owned_post( 'zamowienie-aura', 'page', array( 'post_title' => 'Zamówienie', 'post_content' => '<!-- wp:woocommerce/checkout /-->' ) );
		$this->pages['account'] = $this->owned_post( 'konto-aura', 'page', array( 'post_title' => 'Konto', 'post_content' => '[woocommerce_my_account]' ) );
		if ( $this->pages['checkout'] ) { wp_update_post( array( 'ID' => $this->pages['checkout'], 'post_content' => '[woocommerce_checkout]' ) ); }
	}

	private function import_products(): void {
		if ( ! function_exists( 'wc_get_product' ) ) {
			WP_CLI::warning( 'WooCommerce nieaktywny — pominięto produkty.' );
			return;
		}
		$products = array(
			array( 'slug' => 'fig-black-tea-amber', 'sku' => 'AURA-FBT-01', 'title' => 'Fig & Black Tea', 'price' => '129', 'image' => 'product_amber', 'featured' => true ),
			array( 'slug' => 'fig-black-tea-green', 'sku' => 'AURA-FBT-02', 'title' => 'Fig & Black Tea', 'price' => '129', 'image' => 'product_green', 'featured' => true ),
			array( 'slug' => 'fig-black-tea-amber-300', 'sku' => 'AURA-FBT-03', 'title' => 'Fig & Black Tea', 'price' => '129', 'image' => 'product_amber', 'featured' => true ),
			array( 'slug' => 'fig-black-tea-green-300', 'sku' => 'AURA-FBT-04', 'title' => 'Fig & Black Tea', 'price' => '129', 'image' => 'product_green', 'featured' => true ),
			array( 'slug' => 'velvet-tomato-leaf', 'sku' => 'AURA-VTL-04', 'title' => 'Velvet Tomato Leaf', 'price' => '139', 'image' => 'velvet', 'featured' => false ),
		);
		$extra_product_images = array( 'product_white', 'product_waxes', 'product_green_detail', 'product_amber_detail', 'product_white', 'product_waxes', 'product_green_detail', 'product_amber_detail' );
		foreach ( $extra_product_images as $index => $image_key ) {
			$number = $index + 5;
			$products[] = array( 'slug' => 'fig-black-tea-' . $number, 'sku' => sprintf( 'AURA-FBT-%02d', $number ), 'title' => 'Fig & Black Tea', 'price' => '129', 'image' => $image_key, 'featured' => false );
		}
		foreach ( $products as &$product_data ) {
			if ( 'AURA-VTL-04' === $product_data['sku'] ) { $product_data['visibility'] = 'hidden'; }
		}
		unset( $product_data );
		foreach ( $products as $data ) {
			$id = wc_get_product_id_by_sku( $data['sku'] );
			if ( $id && '1' !== get_post_meta( $id, '_aura_factory_owned', true ) ) {
				WP_CLI::warning( 'Pominięto niepowiązany produkt SKU ' . $data['sku'] );
				continue;
			}
			$product = $id ? wc_get_product( $id ) : new WC_Product_Simple();
			$product->set_name( $data['title'] );
			$product->set_slug( $data['slug'] );
			$product->set_sku( $data['sku'] );
			$product->set_status( 'publish' );
			$product->set_catalog_visibility( $data['visibility'] ?? 'visible' );
			$product->set_regular_price( $data['price'] );
			$product->set_price( $data['price'] );
			$product->set_stock_status( 'instock' );
			$product->set_featured( $data['featured'] );
			$product->set_short_description( 'Soczysta figa, czarna herbata i cedr. Zielony, miękki zapach do spokojnych wieczorów i wolnych poranków.' );
			$product->set_image_id( $this->media[ $data['image'] ] ?? 0 );
			$id = $product->save();
			update_post_meta( $id, '_aura_factory_owned', '1' );
			wp_set_object_terms( $id, array( 'Świece' ), 'product_cat', true );
			$this->products[ $data['sku'] ] = $id;
		}
		if ( ! empty( $this->products['AURA-FBT-01'] ) ) {
			$id = $this->products['AURA-FBT-01'];
			$product = wc_get_product( $id );
			$product->set_image_id( $this->media['product_main'] ?? 0 );
			$product->set_gallery_image_ids( array_values( array_filter( array( $this->media['product_note_1'] ?? 0, $this->media['product_lifestyle'] ?? 0, $this->media['product_amber'] ?? 0 ) ) ) );
			$product->save();
			update_field( 'aura_product_scent', array(
				'eyebrow' => 'JAK PACHNIE FIG & BLACK TEA?', 'title' => 'Zielono na początku. Miękko i drzewnie po chwili.', 'feels_like' => 'Feels like: otwarte okno po deszczu, świeża herbata i książka zostawiona na stole.',
				'notes' => array(
					array( 'stage' => 'GŁOWA', 'title' => 'Figa', 'notes' => 'Bergamotka', 'image' => $this->media['product_note_1'] ),
					array( 'stage' => 'SERCE', 'title' => 'Czarna herbata', 'notes' => 'Liść fiołka', 'image' => $this->media['product_note_2'] ),
					array( 'stage' => 'BAZA', 'title' => 'Cedr', 'notes' => 'Mech', 'image' => $this->media['product_note_3'] ),
				),
			), $id );
			update_field( 'aura_product_facts', array( array( 'value' => '100%', 'label' => 'wosk sojowy' ), array( 'value' => '180 g', 'label' => 'waga netto' ), array( 'value' => '~45 h', 'label' => 'czas palenia' ), array( 'value' => 'Polska', 'label' => 'ręczna produkcja' ) ), $id );
			update_field( 'aura_product_story', array( 'eyebrow' => 'HISTORIA ZAPACHU', 'title' => 'Figa, ale bez wakacyjnej słodyczy.', 'content' => '<p>Chcieliśmy zapachu zielonego i cichego. Takiego, który nie dominuje pokoju, tylko pojawia się przy ruchu powietrza. Czarna herbata nadała mu suchość, a cedr spokojny, ciepły finisz.</p>', 'image' => $this->media['product_story'] ), $id );
			update_field( 'aura_product_care', array( 'title' => 'Jak palić świecę dobrze?', 'content' => '<p>Pierwsze palenie powinno trwać 2–3 godziny, aż wosk roztopi się do krawędzi. Przed kolejnym użyciem skróć knot do około 5 mm. Nie pal dłużej niż 4 godziny jednorazowo.</p>', 'items' => array( array( 'title' => 'Skład i pielęgnacja świecy', 'content' => '<p>Naturalny wosk sojowy, bawełniany knot i kompozycja zapachowa zgodna z wymaganiami IFRA.</p>' ) ) ), $id );
		}
	}

	private function import_product_reviews(): void {
		$product_id = wc_get_product_id_by_sku( 'AURA-FBT-01' );
		if ( ! $product_id ) { return; }
		foreach ( array( 'Marta K.', 'Anna P.', 'Kasia W.' ) as $index => $author ) {
			$key = 'aura-review-' . ( $index + 1 );
			if ( get_comments( array( 'post_id' => $product_id, 'meta_key' => '_aura_factory_review_key', 'meta_value' => $key, 'number' => 1 ) ) ) { continue; }
			$comment_id = wp_insert_comment( array( 'comment_post_ID' => $product_id, 'comment_author' => $author, 'comment_author_email' => 'review' . ( $index + 1 ) . '@example.invalid', 'comment_content' => 'Pachnie jak hotel, do ktorego chce sie wracac.', 'comment_type' => 'review', 'comment_approved' => 1 ) );
			if ( $comment_id ) { update_comment_meta( $comment_id, 'rating', 5 ); update_comment_meta( $comment_id, '_aura_factory_review_key', $key ); }
		}
	}

	private function import_posts(): void {
		$entries = array(
			array( 'slug' => 'jak-wybrac-swiece-do-sypialni', 'title' => 'Jak wybrać świecę idealną do sypialni', 'date' => '2026-08-12 09:00:00', 'category' => 'Zapachy', 'image' => 'article_hero', 'excerpt' => 'Sypialnia to nasza najbardziej intymna przestrzeń. Niewłaściwy zapach może drażnić zamiast wyciszać przed snem. Sprawdź, które nuty sprzyjają głębokiemu odpoczynkowi, a jakich unikać po zmroku.' ),
			array( 'slug' => 'wieczorny-rytual-z-zapachem-fig', 'title' => 'Wieczorny rytuał z zapachem fig', 'date' => '2026-08-05 09:00:00', 'category' => 'Rytuały', 'image' => 'blog_03', 'excerpt' => 'Jak stworzyć wyciszającą atmosferę po długim dniu. Rytuały z paleniem świec, które pomagają odzyskać spokój i zredukować stres.' ),
			array( 'slug' => 'naturalne-skladniki-ktore-kochamy', 'title' => 'Naturalne składniki, które kochamy', 'date' => '2026-07-28 09:00:00', 'category' => 'Za kulisami', 'image' => 'blog_06', 'excerpt' => 'Odkryj tajemnice naszych olejków eterycznych. Poznaj certyfikowane, ekologiczne esencje z całego świata, z których tworzymy kompozycje AURA.' ),
			array( 'slug' => 'minimalizm-zapachowy', 'title' => 'Minimalizm zapachowy — mniej znaczy więcej', 'date' => '2026-07-20 09:00:00', 'category' => 'Wnętrza', 'image' => 'blog_08', 'excerpt' => 'Przewodnik po doborze jednego dominującego zapachu do Twojego domu. Jak unikać chaosu zapachowego i kreować spójne, czyste wnętrza.' ),
			array( 'slug' => 'sojowy-wosk-vs-parafina', 'title' => 'Sojowy wosk vs. parafina — co wybrać?', 'date' => '2026-07-14 09:00:00', 'category' => 'Zapachy', 'image' => 'blog_09', 'excerpt' => 'Dlaczego wosk sojowy jest lepszy dla Twojego zdrowia i środowiska? Fakty o toksynach, temperaturze spalania i wydajności świec roślinnych.' ),
			array( 'slug' => 'letnie-zapachy-do-salonu', 'title' => 'Letnie zapachy do salonu', 'date' => '2026-07-08 09:00:00', 'category' => 'Zapachy', 'image' => 'blog_12', 'excerpt' => 'Orzeźwiające kompozycje idealne na ciepłe dni. Ziołowe, zielone nuty i delikatne owoce, które wprowadzą świeżość do nasłonecznionych pokoi.' ),
			array( 'slug' => 'jak-dbac-o-knot-swiecy', 'title' => 'Jak dbać o knot świecy?', 'date' => '2026-07-01 09:00:00', 'category' => 'Rytuały', 'image' => 'blog_13', 'excerpt' => 'Prosty trik z przycinaniem knota, który wydłuży życie Twojej świecy o 30%. Dowiedz się jak uniknąć kopcenia wosku i tunelowania świecy.' ),
		);
		foreach ( $entries as $index => $entry ) {
			$content = '';
			if ( 0 === $index ) {
				$content = '<h2>Zapachy, które uspokajają</h2><p>Tradycyjne podejście do aromaterapii sypialnianej słusznie stawia na lawendę oraz rumianek. Te klasyczne, ziołowe nuty mają udowodnione działanie obniżające poziom kortyzolu. W kompozycjach AURA łączymy je jednak z głębszymi akcentami drzewnymi, takimi jak cedr i sandałowiec, tworząc bardziej wyrafinowany i otulający profil, który działa jak miękki, sensoryczny koc.</p><blockquote>Dobry zapach w sypialni to nie luksus – to forma dbania o siebie i codzienny rytuał przejścia między dniem a nocą.</blockquote><h2>Na co zwrócić uwagę przed zakupem?</h2><ol><li><strong>Czas palenia</strong><br>W sypialni najlepiej sprawdzają się świece, które szybko uwalniają zapach, aby nie palić ich zbyt długo przed snem.</li><li><strong>Intensywność zapachu</strong><br>Zapach nie powinien być zbyt dominujący. Wybieraj kompozycje o delikatnej lub średniej projekcji.</li><li><strong>Naturalne składniki</strong><br>Zawsze wybieraj wosk sojowy zamiast parafiny. Świece sojowe AURA spalają się czysto i są bezpieczne dla dróg oddechowych.</li><li><strong>Rozmiar w stosunku do pokoju</strong><br>Do mniejszych sypialni idealnie sprawdzi się pojemność 170g, z kolei w przestronnych wnętrzach lepiej rozwinie się świeca 250g.</li></ol><figure>' . wp_get_attachment_image( $this->media['article_inline'], 'full' ) . '<figcaption>Fig and Black Tea - nasz bestseller stworzony z myślą o relaksie w sypialni.</figcaption></figure><h2>Nasze rekomendacje</h2><p>Rekomendujemy rozpoczęcie rytuału na około godzinę przed położeniem się spać. Zapal świecę, przewietrz delikatnie pokój i pozwól, aby ciepłe nuty cedru, figi lub wanilii powoli wypełniły przestrzeń, przygotowując Cię na głęboki sen.</p>';
			}
			$id = $this->owned_post( $entry['slug'], 'post', array( 'post_title' => $entry['title'], 'post_excerpt' => $entry['excerpt'], 'post_content' => $content, 'post_date' => $entry['date'], 'post_date_gmt' => get_gmt_from_date( $entry['date'] ) ) );
			if ( ! $id ) { continue; }
			$term = term_exists( $entry['category'], 'category' );
			if ( ! $term ) { $term = wp_insert_term( $entry['category'], 'category' ); }
			if ( ! is_wp_error( $term ) ) { wp_set_post_categories( $id, array( (int) ( is_array( $term ) ? $term['term_id'] : $term ) ) ); }
			set_post_thumbnail( $id, $this->media[ $entry['image'] ] ?? 0 );
			$this->posts[ $entry['slug'] ] = $id;
		}
		$featured = $this->posts['jak-wybrac-swiece-do-sypialni'] ?? 0;
		if ( $featured ) {
			update_field( 'aura_post_reading_time', 'Czas czytania: 5 min', $featured );
			update_field( 'aura_post_lead', 'Sypialnia to Twoje miejsce wyciszenia. Wybór odpowiedniej świecy może całkowicie zmienić atmosferę wieczornej rutyny. Prawidłowo dobrane nuty zapachowe pomagają zasygnalizować układowi nerwowemu, że czas na regenerację i spokojny sen.', $featured );
			update_field( 'aura_post_author', array( 'name' => 'Anna Kowalska', 'quote' => 'Zapach to niewidzialny architekt wnętrz. Odpowiednio dobrany potrafi wyciszyć zmysły po najtrudniejszym dniu.', 'bio' => 'Współzałożycielka AURA. Pasjonatka naturalnych kompozycji zapachowych oraz minimalistycznego designu.', 'image' => $this->media['article_author'] ), $featured );
			update_field( 'aura_post_related', array_values( array_slice( $this->posts, 1, 3 ) ), $featured );
		}
	}

	private function import_global_options(): void {
		$form_id = $this->newsletter_form();
		update_field( 'aura_announcement', array( 'enabled' => 1, 'content' => '<p>DARMOWA DOSTAWA OD 199 ZŁ&nbsp;&nbsp;·&nbsp;&nbsp;ZAPAKUJEMY NA PREZENT</p>' ), 'option' );
		update_field( 'aura_header_labels', array( 'search_label' => 'Szukaj', 'search_placeholder' => 'Szukaj zapachu', 'search_submit_label' => 'SZUKAJ', 'search_close_label' => 'Zamknij', 'account_label' => 'Konto', 'cart_label' => 'Torba', 'menu_open_label' => 'Otwórz menu', 'menu_close_label' => 'Zamknij menu' ), 'option' );
		update_field( 'aura_footer_intro', 'Zapach jako codzienny rytuał. Ręcznie tworzone w Polsce.', 'option' );
		update_field( 'aura_footer_copyright', '© 2026 AURA · Regulamin · Polityka prywatności · Płatności zabezpieczone', 'option' );
		update_field( 'aura_social_links', array( array( 'label' => 'Instagram', 'link' => array( 'title' => 'Instagram', 'url' => '#', 'target' => '' ) ), array( 'label' => 'Facebook', 'link' => array( 'title' => 'Facebook', 'url' => '#', 'target' => '' ) ) ), 'option' );
		update_field( 'aura_newsletter', array( 'eyebrow' => 'NEWSLETTER AURA', 'title' => 'Zapisz się do newslettera', 'title_mobile' => 'Listy o zapachu', 'text' => 'Dołącz do naszego kręgu i otrzymaj 10% rabatu na pierwsze zamówienie oraz porady dotyczące naturalnych zapachów.', 'text_mobile' => 'Pierwszy rytuał i 10% na pierwsze zamówienie.', 'form_shortcode' => $form_id ? '[contact-form-7 id="' . $form_id . '"]' : '' ), 'option' );
		update_field( 'aura_store_copy', array( 'all_products_label' => 'Wszystkie', 'filters_label' => 'FILTRY', 'shipping_note' => 'Wysyłka w 1–2 dni robocze · darmowa dostawa od 199 zł', 'payment_note' => 'Bezpieczne płatności: BLIK · PayU · Apple Pay', 'related_products_title' => 'Jeśli lubisz ten klimat', 'sticky_add_label' => 'DODAJ DO KOSZYKA' ), 'option' );
		update_field( 'aura_blog_labels', array( 'all_posts_label' => 'Wszystkie', 'read_article_label' => 'Czytaj cały artykuł', 'previous_label' => '← Poprzednia', 'next_label' => 'Następna →', 'related_title' => 'Może Cię zainteresować', 'journal_link' => array( 'title' => 'Zobacz cały Journal →', 'url' => $this->pages['blog'] ? get_permalink( $this->pages['blog'] ) : '#', 'target' => '' ) ), 'option' );
		update_field( 'quick_add_label', 'SZYBKO DODAJ', 'option' );
		update_field( 'bestseller_badge', 'BESTSELLER', 'option' );
		update_field( 'sale_badge', 'PROMOCJA', 'option' );
		update_field( 'sold_out_badge', 'WYPRZEDANE', 'option' );
	}

	private function import_page_fields(): void {
		$home = $this->pages['home'] ?? 0;
		if ( $home ) {
			update_field( 'aura_home_hero', array( 'eyebrow' => 'NOWA KOLEKCJA · AFTER HOURS', 'title' => 'Zapach, który zostaje.', 'text' => 'Świece i woski tworzone jak perfumy — warstwa po warstwie, z naturalnego wosku i składników, które budują nastrój zamiast go zagłuszać.', 'link' => array( 'title' => 'POZNAJ KOLEKCJĘ', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'image_desktop' => $this->media['hero'], 'image_mobile' => $this->media['hero'] ), $home );
			update_field( 'aura_home_bestsellers', array( 'title' => 'Najczęściej wybierane', 'link' => array( 'title' => 'ZOBACZ WSZYSTKIE →', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'query' => array( 'source' => 'manual', 'limit' => 4, 'orderby' => 'menu_order', 'order' => 'ASC', 'manual_products' => array_values( array_slice( $this->products, 0, 4 ) ) ) ), $home );
			update_field( 'aura_home_statement', array( 'eyebrow' => 'AURA TO NIE TYLKO ZAPACH', 'title' => 'To mały rytuał, który zmienia temperaturę wieczoru.', 'text' => 'Wybieramy nuty jak składniki perfum: z myślą o przestrzeni, nastroju i porze dnia.' ), $home );
			update_field( 'aura_home_collections', array( 'title' => 'Wybierz nastrój, nie tylko zapach', 'text' => 'Odkrywaj przez rodzinę zapachową i moment dnia — szybciej znajdziesz aromat, który pasuje do Ciebie.', 'items' => array( array( 'title' => 'Zielone rytuały', 'text' => 'Figowiec · mech · czarna herbata', 'link' => array( 'title' => 'Zielone rytuały', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'image' => $this->media['collection'] ), array( 'title' => 'Zielone rytuały', 'text' => 'Figowiec · mech · czarna herbata', 'link' => array( 'title' => 'Zielone rytuały', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'image' => $this->media['collection'] ), array( 'title' => 'Zielone rytuały', 'text' => 'Figowiec · mech · czarna herbata', 'link' => array( 'title' => 'Zielone rytuały', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'image' => $this->media['collection'] ) ) ), $home );
			update_field( 'aura_home_editorial', array( 'eyebrow' => 'DOMOWY RYTUAŁ', 'title' => 'Światło. Zapach. Chwila bez pośpiechu.', 'text' => 'Świeca nie musi być dekoracją „na specjalne okazje”. Projektujemy zapachy do codziennych momentów: czytania, kąpieli, kolacji i spokojnego poranka.', 'link' => array( 'title' => 'CZYTAJ O RYTUAŁACH →', 'url' => get_permalink( $this->pages['blog'] ), 'target' => '' ), 'image_desktop' => $this->media['editorial'], 'image_mobile' => $this->media['editorial'] ), $home );
			update_field( 'aura_home_categories', array( array( 'title' => 'Świece', 'text' => 'Kompozycje tworzone jak perfumy', 'link' => array( 'title' => 'ODKRYJ KATEGORIĘ →', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'image' => $this->media['candles'] ), array( 'title' => 'Woski zapachowe', 'text' => 'Warstwuj zapach i zmieniaj nastrój', 'link' => array( 'title' => 'ODKRYJ KATEGORIĘ →', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'image' => $this->media['waxes'] ) ), $home );
			update_field( 'aura_home_usps', array( array( 'title' => '100% naturalny wosk', 'text' => 'Czyste palenie, bez parafiny i zbędnych dodatków.' ), array( 'title' => '100% naturalny wosk', 'text' => 'Czyste palenie, bez parafiny i zbędnych dodatków.' ), array( 'title' => '100% naturalny wosk', 'text' => 'Czyste palenie, bez parafiny i zbędnych dodatków.' ), array( 'title' => '100% naturalny wosk', 'text' => 'Czyste palenie, bez parafiny i zbędnych dodatków.' ) ), $home );
			update_field( 'aura_home_finder', array( 'eyebrow' => 'NIE WIESZ, OD CZEGO ZACZĄĆ?', 'title' => 'Znajdź swój zapach w 60 sekund.', 'title_mobile' => '3 pytania. 3 propozycje.', 'text' => 'Wybierz nastrój, ulubione nuty i intensywność. Pokażemy trzy kompozycje, które najlepiej pasują do Twojego domu.', 'text_mobile' => 'Wybierz nastrój, nuty i intensywność. Pokażemy trzy najlepiej dopasowane zapachy.', 'link' => array( 'title' => 'ROZPOCZNIJ QUIZ', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ), 'image_desktop' => $this->media['finder'], 'image_mobile' => $this->media['candles'] ), $home );
			update_field( 'aura_home_featured_product', array( 'product' => $this->products['AURA-VTL-04'] ?? 0, 'eyebrow' => 'LIMITED EDITION · 04', 'text' => 'Liść pomidora, czarna porzeczka i mokra ziemia — zielony zapach z nieoczywistym, aksamitnym finiszem.', 'button_label' => 'ZOBACZ PRODUKT' ), $home );
			update_field( 'aura_home_story', array( 'eyebrow' => 'TWORZONE W POLSCE', 'title' => 'Małe serie. Dobre surowce. Dużo prób zapachu.', 'text' => 'Nie ścigamy sezonów. Budujemy kolekcje, do których można wracać — z naturalnego wosku, bez parafiny, pakowane w materiały nadające się do ponownego użycia lub recyklingu.' ), $home );
			update_field( 'aura_home_reviews', array( 'title' => 'Dom pachnie lepiej, gdy inni to potwierdzają', 'title_mobile' => 'Wasze rytuały', 'items' => array( array( 'rating' => '★★★★★', 'quote' => '„Pachnie jak hotel, do którego chce się wracać.”', 'author' => 'Marta K. · zweryfikowany zakup' ), array( 'rating' => '★★★★★', 'quote' => '„Pachnie jak hotel, do którego chce się wracać.”', 'author' => 'Marta K. · zweryfikowany zakup' ), array( 'rating' => '★★★★★', 'quote' => '„Pachnie jak hotel, do którego chce się wracać.”', 'author' => 'Marta K. · zweryfikowany zakup' ) ) ), $home );
		}
		$about = $this->pages['about'] ?? 0;
		if ( $about ) {
			update_field( 'aura_about_hero', array( 'eyebrow' => 'O AURA', 'title' => 'Robimy miejsce dla zapachu.', 'text' => 'AURA powstała z potrzeby stworzenia domowych zapachów, które nie udają luksusu. Są dobrze skomponowane, świetnie wykonane i wystarczająco charakterystyczne, żeby pamiętać je po zgaszeniu świecy.', 'image_desktop' => $this->media['about_hero'], 'image_mobile' => $this->media['about_hero'] ), $about );
			update_field( 'aura_about_manifest', array( 'quote' => '„Dom nie musi pachnieć mocno. Powinien pachnieć właściwie.”', 'attribution' => '— manifest AURA' ), $about );
			update_field( 'aura_about_origin', array( 'eyebrow' => '01 · POCZĄTEK', 'title' => 'Od perfum do przestrzeni', 'content' => '<p>Zaczęliśmy od pytania: dlaczego domowe zapachy tak często są albo zbyt słodkie, albo zbyt bezpieczne? Szukaliśmy kompozycji z napięciem — zielonych, suchych, mineralnych, czasem odrobinę dziwnych. Pierwsze serie zalewaliśmy ręcznie, testując nie tylko aromat w słoiku, ale jego rozwój w realnym pokoju.</p>', 'image' => $this->media['about_origin'] ), $about );
			update_field( 'aura_about_process', array( 'title' => 'Od pomysłu do zapalonego knota', 'items' => array( array( 'number' => '01', 'title' => 'Brief zapachu', 'text' => 'Nastrój, miejsce, pora dnia i pierwsze skojarzenia.' ), array( 'number' => '02', 'title' => 'Próby kompozycji', 'text' => 'Testujemy proporcje i sposób rozwijania się nut.' ), array( 'number' => '03', 'title' => 'Test palenia', 'text' => 'Knot, basen wosku, intensywność i czystość spalania.' ), array( 'number' => '04', 'title' => 'Mała seria', 'text' => 'Ręczne zalewanie, sezonowanie, kontrola i pakowanie.' ) ) ), $about );
			update_field( 'aura_about_materials', array( 'eyebrow' => 'MATERIAŁY', 'title' => 'Mniej składników. Więcej uwagi.', 'content' => '<p>Naturalny wosk sojowy, bawełniane knoty, kompozycje zapachowe zgodne z wymaganiami IFRA i opakowania projektowane z myślą o ponownym użyciu. Nie dodajemy barwników tylko po to, żeby świeca lepiej wyglądała na półce.</p>', 'image_primary' => $this->media['about_materials_1'], 'image_secondary' => $this->media['about_materials_2'] ), $about );
			update_field( 'aura_about_values', array( array( 'title' => 'Jakość przed skalą', 'text' => 'Wolimy poprawić jedną kompozycję niż wypuścić dziesięć przeciętnych.' ), array( 'title' => 'Odpowiedzialny wybór', 'text' => 'Dobieramy materiały i dostawców tak, by ograniczać zbędny plastik i nadprodukcję.' ), array( 'title' => 'Bez greenwashingu', 'text' => 'Mówimy konkretnie, co robimy — bez pustych deklaracji o „100% ekologii”.' ) ), $about );
			update_field( 'aura_about_cta', array( 'title' => 'Znajdź zapach, który będzie częścią Twojego domu.', 'link' => array( 'title' => 'PRZEJDŹ DO SKLEPU', 'url' => get_permalink( $this->pages['shop'] ), 'target' => '' ) ), $about );
		}
		$shop = $this->pages['shop'] ?? 0;
		if ( $shop ) {
			update_field( 'aura_shop_intro', array( 'eyebrow' => 'Sklep / Wszystkie produkty', 'title' => 'Wybierz swój rytuał', 'text' => 'Świece, woski i zestawy budowane wokół rodzin zapachowych, nastroju i pory dnia. Zacznij od zapachu albo od tego, jak chcesz się poczuć.' ), $shop );
			update_field( 'aura_shop_promo', array( 'eyebrow' => 'ZESTAW STARTOWY', 'title' => 'Nie wiesz, który zapach? Zacznij od trzech.', 'text' => 'Mini świece: zielona, drzewna i gourmand. 3 × 70 g za 119 zł.', 'link' => array( 'title' => 'ZOBACZ ZESTAW →', 'url' => get_permalink( $shop ), 'target' => '' ), 'image_desktop' => $this->media['starter'], 'image_mobile' => $this->media['starter'] ), $shop );
			update_field( 'aura_shop_seo', array( 'title' => 'Naturalne świece i zapachy do domu', 'content' => '<p>Nasze świece powstają z naturalnego wosku sojowego i kompozycji zapachowych dobieranych tak, aby rozwijały się w przestrzeni stopniowo. W kolekcji znajdziesz zapachy zielone, drzewne, kwiatowe, gourmand i świeże, a także woski oraz zestawy prezentowe.</p>' ), $shop );
		}
		$blog = $this->pages['blog'] ?? 0;
		if ( $blog ) {
			update_field( 'aura_blog_intro', array( 'eyebrow' => 'AURA / Journal', 'title' => 'Journal AURA', 'text' => 'Świat zapachu, rytuałów i dobrego designu. Dzielimy się wiedzą o tworzeniu naturalnych świec, doborze nut zapachowych do pór roku oraz budowaniu harmonii we wnętrzach.' ), $blog );
			update_field( 'aura_blog_featured_post', $this->posts['jak-wybrac-swiece-do-sypialni'] ?? 0, $blog );
		}
	}

	private function import_menus(): void {
		$definitions = array(
			'header' => array( 'Aura — główne', array( array( 'Sklep', 'shop' ), array( 'Świece', 'shop' ), array( 'Woski', 'shop' ), array( 'Zestawy', 'shop' ), array( 'Zapachy', 'shop' ), array( 'O nas', 'about' ) ) ),
			'mobile' => array( 'Aura — mobilne', array( array( 'Sklep', 'shop' ), array( 'Świece', 'shop' ), array( 'Woski', 'shop' ), array( 'Zestawy', 'shop' ), array( 'Zapachy', 'shop' ), array( 'O nas', 'about' ), array( 'Journal', 'blog' ) ) ),
			'footer_shop' => array( 'SKLEP', array( array( 'Świece', 'shop' ), array( 'Woski', 'shop' ), array( 'Zestawy', 'shop' ), array( 'Zapachy', 'shop' ) ) ),
			'footer_help' => array( 'POMOC', array( array( 'Dostawa i zwroty', 'shop' ), array( 'FAQ', 'shop' ), array( 'Kontakt', 'shop' ), array( 'Pielęgnacja', 'blog' ) ) ),
			'footer_brand' => array( 'O MARCE', array( array( 'Nasza historia', 'about' ), array( 'Składniki', 'about' ), array( 'Odpowiedzialność', 'about' ), array( 'Instagram', 'home' ) ) ),
		);
		$locations = get_theme_mod( 'nav_menu_locations', array() );
		foreach ( $definitions as $location => $definition ) {
			$menu = wp_get_nav_menu_object( $definition[0] );
			$menu_id = $menu ? (int) $menu->term_id : (int) wp_create_nav_menu( $definition[0] );
			$existing_items = wp_get_nav_menu_items( $menu_id );
			$existing_titles = $existing_items ? wp_list_pluck( $existing_items, 'title' ) : array();
			foreach ( $definition[1] as $item ) {
				if ( in_array( $item[0], $existing_titles, true ) || empty( $this->pages[ $item[1] ] ) ) { continue; }
				wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => $item[0], 'menu-item-object-id' => $this->pages[ $item[1] ], 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
			}
			$locations[ $location ] = $menu_id;
			if ( function_exists( 'pll_set_term_language' ) ) {
				pll_set_term_language( $menu_id, 'pl' );
			}
		}
		set_theme_mod( 'nav_menu_locations', $locations );
	}

	private function configure_wordpress(): void {
		update_option( 'blogname', 'AURA' );
		if ( $this->pages['home'] ) { update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', $this->pages['home'] ); }
		if ( $this->pages['shop'] ) { update_option( 'woocommerce_shop_page_id', $this->pages['shop'] ); }
		if ( $this->pages['cart'] ) { update_option( 'woocommerce_cart_page_id', $this->pages['cart'] ); }
		if ( $this->pages['checkout'] ) { update_option( 'woocommerce_checkout_page_id', $this->pages['checkout'] ); }
		if ( $this->pages['account'] ) { update_option( 'woocommerce_myaccount_page_id', $this->pages['account'] ); }
		update_option( 'woocommerce_coming_soon', 'no' );
		update_option( 'woocommerce_currency', 'PLN' );
		$this->configure_polylang();
		flush_rewrite_rules();
	}

	private function configure_polylang(): void {
		if ( ! function_exists( 'PLL' ) || ! function_exists( 'pll_set_post_language' ) ) {
			return;
		}
		if ( ! pll_languages_list() ) {
			PLL()->model->add_language( array( 'name' => 'Polski', 'slug' => 'pl', 'locale' => 'pl_PL', 'rtl' => false, 'term_group' => 0, 'flag' => 'pl' ) );
			PLL()->model->add_language( array( 'name' => 'English', 'slug' => 'en', 'locale' => 'en_US', 'rtl' => false, 'term_group' => 1, 'flag' => 'us' ) );
		}
		foreach ( array_merge( array_values( $this->pages ), array_values( $this->products ), array_values( $this->posts ) ) as $post_id ) {
			if ( $post_id ) {
				pll_set_post_language( (int) $post_id, 'pl' );
			}
		}
		$options   = get_option( 'polylang', array() );
		$locations = get_theme_mod( 'nav_menu_locations', array() );
		foreach ( array( 'header', 'mobile', 'footer_shop', 'footer_help', 'footer_brand' ) as $location ) {
			if ( ! empty( $locations[ $location ] ) ) {
				$options['nav_menus'][ get_stylesheet() ][ $location ]['pl'] = (int) $locations[ $location ];
			}
		}
		update_option( 'polylang', $options );
	}

	private function newsletter_form(): int {
		if ( ! post_type_exists( 'wpcf7_contact_form' ) ) { return 0; }
		$existing = get_page_by_path( 'aura-newsletter', OBJECT, 'wpcf7_contact_form' );
		$id = $existing ? (int) $existing->ID : wp_insert_post( array( 'post_type' => 'wpcf7_contact_form', 'post_status' => 'publish', 'post_title' => 'AURA Newsletter', 'post_name' => 'aura-newsletter' ) );
		if ( $id ) {
			update_post_meta( $id, '_form', '<label><span class="screen-reader-text">Twój adres e-mail</span>[email* your-email placeholder "Twój adres e-mail"]</label>[submit "ZAPISZ SIĘ"]' );
			update_post_meta( $id, '_aura_factory_owned', '1' );
		}
		return (int) $id;
	}
}

( new Aura_Figma_Content_Importer() )->run();
