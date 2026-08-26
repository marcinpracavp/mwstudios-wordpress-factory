<?php
/**
 * AURA local ACF schema.
 *
 * @package aura
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function aura_acf_field( string $key, string $label, string $name, string $type = 'text', array $extra = array() ): array {
	return array_merge(
		array(
			'key'   => 'field_aura_' . $key,
			'label' => $label,
			'name'  => $name,
			'type'  => $type,
		),
		$extra
	);
}

function aura_acf_image( string $key, string $label, string $name ): array {
	return aura_acf_field( $key, $label, $name, 'image', array( 'return_format' => 'id', 'preview_size' => 'medium' ) );
}

function aura_acf_link( string $key, string $label, string $name ): array {
	return aura_acf_field( $key, $label, $name, 'link', array( 'return_format' => 'array' ) );
}

function aura_acf_group( string $key, string $label, string $name, array $sub_fields ): array {
	return aura_acf_field( $key, $label, $name, 'group', array( 'layout' => 'block', 'sub_fields' => $sub_fields ) );
}

function aura_acf_repeater( string $key, string $label, string $name, array $sub_fields, int $min = 0, int $max = 0 ): array {
	return aura_acf_field( $key, $label, $name, 'repeater', array( 'layout' => 'block', 'button_label' => 'Dodaj element', 'min' => $min, 'max' => $max, 'sub_fields' => $sub_fields ) );
}

add_action(
	'acf/init',
	static function () {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		$text     = static fn( string $key, string $label, string $name ): array => aura_acf_field( $key, $label, $name );
		$textarea = static fn( string $key, string $label, string $name ): array => aura_acf_field( $key, $label, $name, 'textarea', array( 'rows' => 4, 'new_lines' => '' ) );
		$wysiwyg  = static fn( string $key, string $label, string $name ): array => aura_acf_field( $key, $label, $name, 'wysiwyg', array( 'tabs' => 'all', 'toolbar' => 'basic', 'media_upload' => 0 ) );

		acf_add_local_field_group(
			array(
				'key'      => 'group_aura_global',
				'title'    => 'AURA — ustawienia projektu',
				'fields'   => array(
					aura_acf_group( 'announcement', 'Announcement', 'aura_announcement', array( aura_acf_field( 'announcement_enabled', 'Aktywny', 'enabled', 'true_false' ), $wysiwyg( 'announcement_content', 'Treść', 'content' ) ) ),
					aura_acf_group( 'header_labels', 'Header — etykiety', 'aura_header_labels', array(
						$text( 'search_label', 'Szukaj', 'search_label' ), $text( 'search_placeholder', 'Placeholder wyszukiwarki', 'search_placeholder' ), $text( 'search_submit', 'Przycisk wyszukiwarki', 'search_submit_label' ), $text( 'search_close', 'Zamknij wyszukiwarkę', 'search_close_label' ),
						$text( 'account_label', 'Konto', 'account_label' ), $text( 'cart_label', 'Koszyk', 'cart_label' ), $text( 'menu_open', 'Otwórz menu', 'menu_open_label' ), $text( 'menu_close', 'Zamknij menu', 'menu_close_label' ),
					) ),
					$textarea( 'footer_intro', 'Opis marki w stopce', 'aura_footer_intro' ),
					$text( 'footer_copyright', 'Copyright', 'aura_footer_copyright' ),
					aura_acf_repeater( 'social_links', 'Social media', 'aura_social_links', array( $text( 'social_label', 'Etykieta', 'label' ), aura_acf_link( 'social_link', 'Link', 'link' ) ) ),
					aura_acf_group( 'newsletter', 'Newsletter', 'aura_newsletter', array( $text( 'newsletter_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'newsletter_title', 'Tytuł desktop', 'title' ), $text( 'newsletter_title_mobile', 'Tytuł mobile', 'title_mobile' ), $textarea( 'newsletter_text', 'Tekst desktop', 'text' ), $textarea( 'newsletter_text_mobile', 'Tekst mobile', 'text_mobile' ), $text( 'newsletter_shortcode', 'Shortcode formularza', 'form_shortcode' ) ) ),
					aura_acf_group( 'store_copy', 'WooCommerce — copy interfejsu', 'aura_store_copy', array(
						$text( 'all_products', 'Wszystkie produkty', 'all_products_label' ), $text( 'filters', 'Filtry', 'filters_label' ), $text( 'shipping_note', 'Informacja o wysyłce', 'shipping_note' ), $text( 'payment_note', 'Informacja o płatnościach', 'payment_note' ), $text( 'related_products', 'Tytuł podobnych produktów', 'related_products_title' ), $text( 'sticky_add', 'Mobilne dodaj do koszyka', 'sticky_add_label' ),
					) ),
					aura_acf_group( 'blog_labels', 'Journal — etykiety', 'aura_blog_labels', array( $text( 'all_posts', 'Wszystkie wpisy', 'all_posts_label' ), $text( 'read_article', 'Czytaj artykuł', 'read_article_label' ), $text( 'previous', 'Poprzednia', 'previous_label' ), $text( 'next', 'Następna', 'next_label' ), $text( 'related_title', 'Powiązane wpisy', 'related_title' ), aura_acf_link( 'journal_link', 'Link do Journalu', 'journal_link' ) ) ),
					$text( 'quick_add', 'Szybko dodaj', 'quick_add_label' ), $text( 'badge_best', 'Badge bestseller', 'bestseller_badge' ), $text( 'badge_sale', 'Badge promocja', 'sale_badge' ), $text( 'badge_sold', 'Badge wyprzedane', 'sold_out_badge' ),
				),
				'location' => array( array( array( 'param' => 'options_page', 'operator' => '==', 'value' => 'acf-options-opcje-globalne' ) ) ),
				'active'   => true,
			)
		);

		$hero_fields = array( $text( 'home_hero_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'home_hero_title', 'Tytuł', 'title' ), $textarea( 'home_hero_text', 'Tekst', 'text' ), aura_acf_link( 'home_hero_link', 'CTA', 'link' ), aura_acf_image( 'home_hero_desktop', 'Obraz desktop', 'image_desktop' ), aura_acf_image( 'home_hero_mobile', 'Obraz mobile', 'image_mobile' ) );
		$product_query = aura_acf_group( 'home_query', 'Query produktów', 'query', array(
			aura_acf_field( 'home_query_source', 'Źródło', 'source', 'select', array( 'choices' => array( 'all' => 'Wszystkie', 'category' => 'Kategoria', 'manual' => 'Ręczny wybór' ), 'default_value' => 'all' ) ),
			aura_acf_field( 'home_query_category', 'Kategoria', 'category', 'taxonomy', array( 'taxonomy' => 'product_cat', 'field_type' => 'select', 'return_format' => 'id', 'allow_null' => 1 ) ),
			aura_acf_field( 'home_query_limit', 'Limit', 'limit', 'number', array( 'default_value' => 4, 'min' => 1, 'max' => 24 ) ),
			aura_acf_field( 'home_query_orderby', 'Sortowanie', 'orderby', 'select', array( 'choices' => array( 'menu_order' => 'Menu order', 'popularity' => 'Popularność', 'price' => 'Cena', 'date' => 'Najnowsze', 'rating' => 'Ocena' ) ) ),
			aura_acf_field( 'home_query_order', 'Kierunek', 'order', 'select', array( 'choices' => array( 'ASC' => 'Rosnąco', 'DESC' => 'Malejąco' ) ) ),
			aura_acf_field( 'home_query_manual', 'Produkty', 'manual_products', 'relationship', array( 'post_type' => array( 'product' ), 'return_format' => 'id' ) ),
		) );

		acf_add_local_field_group(
			array(
				'key'      => 'group_aura_home',
				'title'    => 'AURA — Homepage',
				'fields'   => array(
					aura_acf_group( 'home_hero', 'Hero', 'aura_home_hero', $hero_fields ),
					aura_acf_group( 'home_bestsellers', 'Bestsellery', 'aura_home_bestsellers', array( $text( 'home_best_title', 'Tytuł', 'title' ), aura_acf_link( 'home_best_link', 'Link', 'link' ), $product_query ) ),
					aura_acf_group( 'home_statement', 'Manifest marki', 'aura_home_statement', array( $text( 'home_statement_eyebrow', 'Eyebrow', 'eyebrow' ), $textarea( 'home_statement_title', 'Tytuł', 'title' ), $textarea( 'home_statement_text', 'Tekst', 'text' ) ) ),
					aura_acf_group( 'home_collections', 'Kolekcje zapachowe', 'aura_home_collections', array( $text( 'home_collections_title', 'Tytuł', 'title' ), $textarea( 'home_collections_text', 'Tekst', 'text' ), aura_acf_repeater( 'home_collections_items', 'Kolekcje', 'items', array( $text( 'home_collection_title', 'Tytuł', 'title' ), $text( 'home_collection_text', 'Opis', 'text' ), aura_acf_link( 'home_collection_link', 'Link', 'link' ), aura_acf_image( 'home_collection_image', 'Obraz', 'image' ) ) ) ) ),
					aura_acf_group( 'home_editorial', 'Editorial', 'aura_home_editorial', array( $text( 'home_editorial_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'home_editorial_title', 'Tytuł', 'title' ), $textarea( 'home_editorial_text', 'Tekst', 'text' ), aura_acf_link( 'home_editorial_link', 'Link', 'link' ), aura_acf_image( 'home_editorial_desktop', 'Obraz desktop', 'image_desktop' ), aura_acf_image( 'home_editorial_mobile', 'Obraz mobile', 'image_mobile' ) ) ),
					aura_acf_repeater( 'home_categories', 'Kategorie', 'aura_home_categories', array( $text( 'home_category_title', 'Tytuł', 'title' ), $text( 'home_category_text', 'Tekst', 'text' ), aura_acf_link( 'home_category_link', 'Link', 'link' ), aura_acf_image( 'home_category_image', 'Obraz', 'image' ) ), 0, 2 ),
					aura_acf_repeater( 'home_usps', 'USP', 'aura_home_usps', array( aura_acf_image( 'home_usp_icon', 'Ikona', 'icon' ), $text( 'home_usp_title', 'Tytuł', 'title' ), $textarea( 'home_usp_text', 'Tekst', 'text' ) ), 0, 4 ),
					aura_acf_group( 'home_finder', 'Scent finder', 'aura_home_finder', array( $text( 'home_finder_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'home_finder_title', 'Tytuł desktop', 'title' ), $text( 'home_finder_title_mobile', 'Tytuł mobile', 'title_mobile' ), $textarea( 'home_finder_text', 'Tekst desktop', 'text' ), $textarea( 'home_finder_text_mobile', 'Tekst mobile', 'text_mobile' ), aura_acf_link( 'home_finder_link', 'CTA', 'link' ), aura_acf_image( 'home_finder_desktop', 'Obraz desktop', 'image_desktop' ), aura_acf_image( 'home_finder_mobile', 'Obraz mobile', 'image_mobile' ) ) ),
					aura_acf_group( 'home_featured', 'Produkt wyróżniony', 'aura_home_featured_product', array( aura_acf_field( 'home_featured_product_id', 'Produkt', 'product', 'post_object', array( 'post_type' => array( 'product' ), 'return_format' => 'id', 'allow_null' => 1 ) ), $text( 'home_featured_eyebrow', 'Eyebrow', 'eyebrow' ), $textarea( 'home_featured_text', 'Tekst', 'text' ), $text( 'home_featured_button', 'Etykieta przycisku', 'button_label' ) ) ),
					aura_acf_group( 'home_story', 'Historia marki', 'aura_home_story', array( $text( 'home_story_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'home_story_title', 'Tytuł', 'title' ), $textarea( 'home_story_text', 'Tekst', 'text' ) ) ),
					aura_acf_group( 'home_reviews', 'Opinie', 'aura_home_reviews', array( $text( 'home_reviews_title', 'Tytuł desktop', 'title' ), $text( 'home_reviews_title_mobile', 'Tytuł mobile', 'title_mobile' ), aura_acf_repeater( 'home_reviews_items', 'Opinie', 'items', array( $text( 'home_review_rating', 'Ocena', 'rating' ), $textarea( 'home_review_quote', 'Cytat', 'quote' ), $text( 'home_review_author', 'Autor', 'author' ) ) ) ) ),
				),
				'location' => array( array( array( 'param' => 'page_type', 'operator' => '==', 'value' => 'front_page' ) ) ),
				'active'   => true,
			)
		);

		acf_add_local_field_group(
			array(
				'key'      => 'group_aura_about',
				'title'    => 'AURA — About',
				'fields'   => array(
					aura_acf_group( 'about_hero', 'Hero', 'aura_about_hero', array( $text( 'about_hero_eyebrow', 'Eyebrow', 'eyebrow' ), $textarea( 'about_hero_title', 'Tytuł', 'title' ), $textarea( 'about_hero_text', 'Tekst', 'text' ), aura_acf_image( 'about_hero_desktop', 'Obraz desktop', 'image_desktop' ), aura_acf_image( 'about_hero_mobile', 'Obraz mobile', 'image_mobile' ) ) ),
					aura_acf_group( 'about_manifest', 'Manifest', 'aura_about_manifest', array( $textarea( 'about_manifest_quote', 'Cytat', 'quote' ), $text( 'about_manifest_attribution', 'Atrybucja', 'attribution' ) ) ),
					aura_acf_group( 'about_origin', 'Początek', 'aura_about_origin', array( $text( 'about_origin_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'about_origin_title', 'Tytuł', 'title' ), $wysiwyg( 'about_origin_content', 'Treść', 'content' ), aura_acf_image( 'about_origin_image', 'Obraz', 'image' ) ) ),
					aura_acf_group( 'about_process', 'Proces', 'aura_about_process', array( $text( 'about_process_title', 'Tytuł', 'title' ), aura_acf_repeater( 'about_process_items', 'Etapy', 'items', array( $text( 'about_process_number', 'Numer', 'number' ), $text( 'about_process_item_title', 'Tytuł', 'title' ), $textarea( 'about_process_text', 'Tekst', 'text' ) ), 0, 4 ) ) ),
					aura_acf_group( 'about_materials', 'Materiały', 'aura_about_materials', array( $text( 'about_materials_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'about_materials_title', 'Tytuł', 'title' ), $wysiwyg( 'about_materials_content', 'Treść', 'content' ), aura_acf_image( 'about_materials_primary', 'Obraz główny', 'image_primary' ), aura_acf_image( 'about_materials_secondary', 'Obraz dodatkowy', 'image_secondary' ) ) ),
					aura_acf_repeater( 'about_values', 'Wartości', 'aura_about_values', array( $text( 'about_value_title', 'Tytuł', 'title' ), $textarea( 'about_value_text', 'Tekst', 'text' ) ), 0, 3 ),
					aura_acf_group( 'about_cta', 'CTA', 'aura_about_cta', array( $text( 'about_cta_title', 'Tytuł', 'title' ), aura_acf_link( 'about_cta_link', 'Link', 'link' ) ) ),
				),
				'location' => array( array( array( 'param' => 'page_template', 'operator' => '==', 'value' => 'template-about.php' ) ) ),
				'active'   => true,
			)
		);

		$shop_location_value = function_exists( 'wc_get_page_id' ) && wc_get_page_id( 'shop' ) > 0 ? (string) wc_get_page_id( 'shop' ) : 'page';
		$shop_location_param = 'page' === $shop_location_value ? 'post_type' : 'page';
		acf_add_local_field_group(
			array(
				'key'      => 'group_aura_shop',
				'title'    => 'AURA — Shop',
				'fields'   => array(
					aura_acf_group( 'shop_intro', 'Intro', 'aura_shop_intro', array( $text( 'shop_intro_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'shop_intro_title', 'Tytuł', 'title' ), $textarea( 'shop_intro_text', 'Tekst', 'text' ) ) ),
					aura_acf_group( 'shop_promo', 'Promo zestawu', 'aura_shop_promo', array( $text( 'shop_promo_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'shop_promo_title', 'Tytuł', 'title' ), $textarea( 'shop_promo_text', 'Tekst', 'text' ), aura_acf_link( 'shop_promo_link', 'Link', 'link' ), aura_acf_image( 'shop_promo_desktop', 'Obraz desktop', 'image_desktop' ), aura_acf_image( 'shop_promo_mobile', 'Obraz mobile', 'image_mobile' ) ) ),
					aura_acf_group( 'shop_seo', 'Treść SEO', 'aura_shop_seo', array( $text( 'shop_seo_title', 'Tytuł', 'title' ), $wysiwyg( 'shop_seo_content', 'Treść', 'content' ) ) ),
				),
				'location' => array( array( array( 'param' => $shop_location_param, 'operator' => '==', 'value' => $shop_location_value ) ) ),
				'active'   => true,
			)
		);

		acf_add_local_field_group(
			array(
				'key'      => 'group_aura_product',
				'title'    => 'AURA — Product details',
				'fields'   => array(
					aura_acf_group( 'product_scent', 'Narracja zapachu', 'aura_product_scent', array( $text( 'product_scent_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'product_scent_title', 'Tytuł', 'title' ), $textarea( 'product_feels_like', 'Feels like', 'feels_like' ), aura_acf_repeater( 'product_notes', 'Nuty', 'notes', array( $text( 'product_note_stage', 'Etap', 'stage' ), $text( 'product_note_title', 'Tytuł', 'title' ), $textarea( 'product_note_notes', 'Nuty', 'notes' ), aura_acf_image( 'product_note_image', 'Obraz', 'image' ) ), 0, 3 ) ) ),
					aura_acf_repeater( 'product_facts', 'Fakty', 'aura_product_facts', array( $text( 'product_fact_value', 'Wartość', 'value' ), $text( 'product_fact_label', 'Etykieta', 'label' ) ), 0, 4 ),
					aura_acf_group( 'product_story', 'Historia zapachu', 'aura_product_story', array( $text( 'product_story_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'product_story_title', 'Tytuł', 'title' ), $wysiwyg( 'product_story_content', 'Treść', 'content' ), aura_acf_image( 'product_story_image', 'Obraz', 'image' ) ) ),
					aura_acf_group( 'product_care', 'Pielęgnacja', 'aura_product_care', array( $text( 'product_care_title', 'Tytuł', 'title' ), $wysiwyg( 'product_care_content', 'Treść', 'content' ), aura_acf_repeater( 'product_care_items', 'Accordion', 'items', array( $text( 'product_care_item_title', 'Tytuł', 'title' ), $wysiwyg( 'product_care_item_content', 'Treść', 'content' ) ) ) ) ),
				),
				'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'product' ) ) ),
				'active'   => true,
			)
		);

		acf_add_local_field_group(
			array(
				'key'      => 'group_aura_blog',
				'title'    => 'AURA — Journal',
				'fields'   => array( aura_acf_group( 'blog_intro', 'Intro', 'aura_blog_intro', array( $text( 'blog_intro_eyebrow', 'Eyebrow', 'eyebrow' ), $text( 'blog_intro_title', 'Tytuł', 'title' ), $textarea( 'blog_intro_text', 'Tekst', 'text' ) ) ), aura_acf_field( 'blog_featured', 'Wyróżniony wpis', 'aura_blog_featured_post', 'post_object', array( 'post_type' => array( 'post' ), 'return_format' => 'id', 'allow_null' => 1 ) ) ),
				'location' => array( array( array( 'param' => 'page_template', 'operator' => '==', 'value' => 'template-blog.php' ) ) ),
				'active'   => true,
			)
		);

		acf_add_local_field_group(
			array(
				'key'      => 'group_aura_post',
				'title'    => 'AURA — Article details',
				'fields'   => array( $text( 'post_reading_time', 'Czas czytania', 'aura_post_reading_time' ), $textarea( 'post_lead', 'Lead', 'aura_post_lead' ), aura_acf_group( 'post_author', 'Autorka/autor', 'aura_post_author', array( $text( 'post_author_name', 'Imię i nazwisko', 'name' ), $textarea( 'post_author_quote', 'Cytat', 'quote' ), $textarea( 'post_author_bio', 'Bio', 'bio' ), aura_acf_image( 'post_author_image', 'Zdjęcie', 'image' ) ) ), aura_acf_field( 'post_related', 'Powiązane wpisy', 'aura_post_related', 'relationship', array( 'post_type' => array( 'post' ), 'return_format' => 'id' ) ) ),
				'location' => array( array( array( 'param' => 'post_type', 'operator' => '==', 'value' => 'post' ) ) ),
				'active'   => true,
			)
		);
	}
);
