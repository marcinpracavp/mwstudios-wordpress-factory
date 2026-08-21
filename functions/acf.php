<?php

/**
 * Add options page
 */
if (function_exists('acf_add_options_page')) {
    acf_add_options_page([
        'page_title' => 'Opcje globalne',
        'menu_title' => 'Opcje globalne',
        'redirect'   => false
    ]);
}

if (function_exists('acf_add_options_sub_page')) {
    $parent_slug = 'acf-options-opcje-globalne';

    acf_add_options_sub_page([
        'page_title'  => 'Integracje',
        'menu_title'  => 'Integracje',
        'parent_slug' => $parent_slug
    ]);

}

/**
 * Register google map api key
 */
function my_acf_google_map_api($api)
{
    $api['key'] = get_field('google_maps_api_key', 'options');
    return $api;
}
add_filter('acf/fields/google_map/api', 'my_acf_google_map_api');

/**
 * Popup promocyjny — pola w Opcjach globalnych
 */
add_action('acf/init', function () {
    if (! function_exists('acf_add_local_field_group')) {
        return;
    }

    acf_add_local_field_group([
        'key'                   => 'group_global_promo_popup',
        'title'                 => 'Popup promocyjny',
        'fields'                => [
            [
                'key'               => 'field_global_pp_group',
                'label'             => 'Popup promocyjny',
                'name'              => 'promo_popup',
                'type'              => 'group',
                'instructions'      => 'Baner modalny ze zdjęciami; po zamknięciu zapisywane jest ciasteczko. Po dacie wyłączenia popup nie wyświetla się nikomu.',
                'layout'            => 'block',
                'sub_fields'        => [
                    [
                        'key'           => 'field_global_pp_enabled',
                        'label'         => 'Włącz popup',
                        'name'          => 'enabled',
                        'type'          => 'true_false',
                        'ui'            => 1,
                        'default_value' => 0,
                    ],
                    [
                        'key'           => 'field_global_pp_image_desktop',
                        'label'         => 'Zdjęcie (desktop)',
                        'name'          => 'image_desktop',
                        'type'          => 'image',
                        'return_format' => 'array',
                        'preview_size'  => 'medium',
                        'library'       => 'all',
                    ],
                    [
                        'key'           => 'field_global_pp_image_mobile',
                        'label'         => 'Zdjęcie (mobile)',
                        'name'          => 'image_mobile',
                        'type'          => 'image',
                        'return_format' => 'array',
                        'preview_size'  => 'medium',
                        'library'       => 'all',
                    ],
                    [
                        'key'           => 'field_global_pp_link',
                        'label'         => 'Link (obrazki są klikalne)',
                        'name'          => 'link_url',
                        'type'          => 'url',
                        'placeholder'   => 'https://',
                    ],
                    [
                        'key'           => 'field_global_pp_cookie_days',
                        'label'         => 'Po ilu dniach pokazać popup ponownie',
                        'name'          => 'cookie_days',
                        'type'          => 'number',
                        'default_value' => 7,
                        'min'           => 1,
                        'step'          => 1,
                        'instructions'  => 'Po zamknięciu przez użytkownika ciasteczko blokuje popup przez podaną liczbę dni.',
                    ],
                    [
                        'key'             => 'field_global_pp_end',
                        'label'           => 'Wyłącz popup po dacie i godzinie',
                        'name'            => 'end_datetime',
                        'type'            => 'date_time_picker',
                        'display_format'  => 'd/m/Y H:i',
                        'return_format'   => 'Y-m-d H:i:s',
                        'first_day'       => 1,
                        'instructions'    => 'Puste = bez limitu czasowego. Po tej dacie (czas serwisu WordPress) popup nie pojawi się nikomu, niezależnie od ciasteczka.',
                    ],
                ],
            ],
        ],
        'location'              => [
            [
                [
                    'param'    => 'options_page',
                    'operator' => '==',
                    'value'    => 'acf-options-opcje-globalne',
                ],
            ],
        ],
        'menu_order'            => 20,
        'position'              => 'normal',
        'style'                 => 'default',
        'label_placement'       => 'top',
        'instruction_placement' => 'label',
        'active'                => true,
    ]);

    acf_add_local_field_group([
        'key'                   => 'group_global_topbar',
        'title'                 => 'Topbar (nad nagłówkiem)',
        'fields'                => [
            [
                'key'               => 'field_global_tb_group',
                'label'             => 'Topbar',
                'name'              => 'topbar',
                'type'              => 'group',
                'instructions'      => 'Pasek nad nagłówkiem. Po dacie zakończenia nie wyświetla się nikomu. Zamknięcie przez użytkownika zapisuje ciasteczko na skonfigurowany czas.',
                'layout'            => 'block',
                'sub_fields'        => [
                    [
                        'key'           => 'field_global_tb_enabled',
                        'label'         => 'Włącz topbar',
                        'name'          => 'enabled',
                        'type'          => 'true_false',
                        'ui'            => 1,
                        'default_value' => 0,
                    ],
                    [
                        'key'           => 'field_global_tb_bg_color',
                        'label'         => 'Kolor tła baneru',
                        'name'          => 'bg_color',
                        'type'          => 'color_picker',
                        'default_value' => '',
                        'return_format' => 'string',
                    ],
                    [
                        'key'           => 'field_global_tb_content',
                        'label'         => 'Treść',
                        'name'          => 'content',
                        'type'          => 'wysiwyg',
                        'tabs'          => 'all',
                        'toolbar'       => 'full',
                        'media_upload'  => 1,
                        'delay'         => 0,
                    ],
                    [
                        'key'             => 'field_global_tb_end',
                        'label'           => 'Zakończ wyświetlanie po dacie i godzinie',
                        'name'            => 'end_datetime',
                        'type'            => 'date_time_picker',
                        'display_format'  => 'd/m/Y H:i',
                        'return_format'   => 'Y-m-d H:i:s',
                        'first_day'       => 1,
                        'instructions'    => 'Puste = bez limitu. Po tej dacie (czas serwera WordPress) topbar nie pojawi się nikomu.',
                    ],
                    [
                        'key'           => 'field_global_tb_show_close',
                        'label'         => 'Przycisk zamknięcia (ciasteczko)',
                        'name'          => 'show_close',
                        'type'          => 'true_false',
                        'ui'            => 1,
                        'default_value' => 1,
                        'instructions'  => 'Po kliknięciu „Zamknij” topbar znika i nie wraca do wygaśnięcia ciasteczka.',
                    ],
                    [
                        'key'           => 'field_global_tb_cookie_days',
                        'label'         => 'Ważność ciasteczka po zamknięciu (dni)',
                        'name'          => 'cookie_days',
                        'type'          => 'number',
                        'default_value' => 7,
                        'min'           => 1,
                        'step'          => 1,
                        'instructions'  => 'Przez ile dni po zamknięciu topbar ma pozostać ukryty dla tej przeglądarki.',
                        'conditional_logic' => [
                            [
                                [
                                    'field'    => 'field_global_tb_show_close',
                                    'operator' => '==',
                                    'value'    => '1',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
        'location'              => [
            [
                [
                    'param'    => 'options_page',
                    'operator' => '==',
                    'value'    => 'acf-options-opcje-globalne',
                ],
            ],
        ],
        'menu_order'            => 15,
        'position'              => 'normal',
        'style'                 => 'default',
        'label_placement'       => 'top',
        'instruction_placement' => 'label',
        'active'                => true,
    ]);
});

define('GLOBAL_TOPBAR_COOKIE', 'global_topbar_dismissed');

define('GLOBAL_PROMO_POPUP_COOKIE', 'global_promo_popup_dismissed');

/**
 * Czy topbar powinien się wyświetlić (serwerowo).
 */
function global_topbar_should_display(): bool
{
    if (is_admin() || wp_doing_ajax() || wp_is_json_request()) {
        return false;
    }

    $group = get_field('topbar', 'options');
    if (! is_array($group) || empty($group['enabled'])) {
        return false;
    }

    $content = isset($group['content']) ? (string) $group['content'] : '';
    if (trim(wp_strip_all_tags($content)) === '') {
        return false;
    }

    $end = isset($group['end_datetime']) ? trim((string) $group['end_datetime']) : '';
    if ($end !== '') {
        try {
            $end_dt = new DateTimeImmutable($end, wp_timezone());
            if (current_datetime() > $end_dt) {
                return false;
            }
        } catch (Exception $e) {
            // nieparsowalna data — nie blokujemy wyświetlania
        }
    }

    $show_close = ! empty($group['show_close']);
    if ($show_close && ! empty($_COOKIE[GLOBAL_TOPBAR_COOKIE])) {
        return false;
    }

    return true;
}

/**
 * Renderuje topbar nad nagłówkiem (wywołaj w header.php przed partials/header).
 */
function global_render_topbar(): void
{
    if (! global_topbar_should_display()) {
        return;
    }

    $group       = get_field('topbar', 'options');
    $content     = isset($group['content']) ? (string) $group['content'] : '';
    $bg_raw      = isset($group['bg_color']) ? trim((string) $group['bg_color']) : '';
    $bg_safe     = $bg_raw !== '' ? sanitize_hex_color($bg_raw) : '';
    $show_close  = ! empty($group['show_close']);
    $cookie_days = isset($group['cookie_days']) ? max(1, (int) $group['cookie_days']) : 7;

    $style_parts = [];
    if ($bg_safe) {
        $style_parts[] = 'background-color:' . $bg_safe;
    }

    $attrs = 'class="global-topbar" role="region" aria-label="' . esc_attr__('Komunikat', 'slawinsky_theme') . '"';
    if ($style_parts) {
        $attrs .= ' style="' . esc_attr(implode(';', $style_parts) . ';') . '"';
    }
    if ($show_close) {
        $attrs .= ' data-cookie-days="' . esc_attr((string) $cookie_days) . '"';
    }

    echo '<div id="global-topbar" ' . $attrs . '>';
    echo '<div class="global-topbar__inner l-container">';
    echo '<div class="global-topbar__content">';
    echo apply_filters('the_content', $content);
    echo '</div>';
    if ($show_close) {
        echo '<button type="button" class="global-topbar__close" data-topbar-close aria-label="' . esc_attr__('Zamknij', 'slawinsky_theme') . '">&times;</button>';
    }
    echo '</div></div>';

    $cookie_name = GLOBAL_TOPBAR_COOKIE;
    ?>
<script>
(function(){
	var root=document.getElementById('global-topbar');
	if(!root)return;
	function setTopbarOffset(){
		if(root.hasAttribute('hidden')||root.style.display==='none'){
			document.documentElement.style.setProperty('--global-topbar-h','0px');
			return;
		}
		document.documentElement.style.setProperty('--global-topbar-h',root.offsetHeight+'px');
	}
	setTopbarOffset();
	window.addEventListener('resize',setTopbarOffset);
	if(typeof ResizeObserver!=='undefined'){new ResizeObserver(setTopbarOffset).observe(root);}
	<?php if ($show_close) : ?>
	var btn=root.querySelector('[data-topbar-close]');
	if(btn){
		var days=parseInt(root.getAttribute('data-cookie-days'),10)||7;
		var maxAge=days*24*60*60;
		var cname=<?php echo wp_json_encode($cookie_name); ?>;
		btn.addEventListener('click',function(){
			var secure=window.location.protocol==='https:'?'; Secure':'';
			document.cookie=cname+'=1; path=/; max-age='+maxAge+'; SameSite=Lax'+secure;
			root.setAttribute('hidden','');
			root.style.display='none';
			document.body.classList.remove('has-global-topbar');
			setTopbarOffset();
		});
	}
	<?php endif; ?>
})();
</script>
    <?php
}

add_filter(
    'body_class',
    static function (array $classes): array {
        if (function_exists('global_topbar_should_display') && global_topbar_should_display()) {
            $classes[] = 'has-global-topbar';
        }

        return $classes;
    }
);

/**
 * Czy popup promocyjny powinien się wyświetlić (serwerowo).
 */
function global_promo_popup_should_display(): bool
{
    if (is_admin() || wp_doing_ajax() || wp_is_json_request()) {
        return false;
    }

    $group = get_field('promo_popup', 'options');
    if (! is_array($group) || empty($group['enabled'])) {
        return false;
    }

    $img_d = $group['image_desktop'] ?? null;
    $img_m = $group['image_mobile'] ?? null;
    if (empty($img_d['url']) && empty($img_m['url'])) {
        return false;
    }

    $end = isset($group['end_datetime']) ? trim((string) $group['end_datetime']) : '';
    if ($end !== '') {
        try {
            $end_dt = new DateTimeImmutable($end, wp_timezone());
            if (current_datetime() > $end_dt) {
                return false;
            }
        } catch (Exception $e) {
            // nieparsowalna data — nie blokujemy wyświetlania
        }
    }

    if (! empty($_COOKIE[GLOBAL_PROMO_POPUP_COOKIE])) {
        return false;
    }

    return true;
}

/**
 * Renderuje popup i minimalny JS/CSS w stopce.
 */
function global_render_promo_popup(): void
{
    if (! global_promo_popup_should_display()) {
        return;
    }

    $group      = get_field('promo_popup', 'options');
    $img_d      = $group['image_desktop'] ?? null;
    $img_m      = $group['image_mobile'] ?? null;
    $link       = isset($group['link_url']) ? trim((string) $group['link_url']) : '';
    $cookie_days = isset($group['cookie_days']) ? max(1, (int) $group['cookie_days']) : 7;

    $url_d = (! empty($img_d['url'])) ? $img_d['url'] : '';
    $url_m = (! empty($img_m['url'])) ? $img_m['url'] : '';
    $alt_d = (! empty($img_d['alt'])) ? $img_d['alt'] : '';
    $alt_m = (! empty($img_m['alt'])) ? $img_m['alt'] : '';

    $has_d = $url_d !== '';
    $has_m = $url_m !== '';
    $mod   = 'global-promo-popup--desktop-only';
    if ($has_d && $has_m) {
        $mod = 'global-promo-popup--responsive';
    } elseif ($has_m && ! $has_d) {
        $mod = 'global-promo-popup--mobile-only';
    }

    echo '<div id="global-promo-popup" class="global-promo-popup ' . esc_attr($mod) . '" hidden role="dialog" aria-modal="true" aria-label="' . esc_attr__('Promocja', 'slawinsky_theme') . '" data-cookie-days="' . esc_attr((string) $cookie_days) . '">';
    echo '<button type="button" class="global-promo-popup__backdrop" data-promo-close aria-label="' . esc_attr__('Zamknij', 'slawinsky_theme') . '"></button>';
    echo '<div class="global-promo-popup__panel">';
    echo '<button type="button" class="global-promo-popup__close" data-promo-close aria-label="' . esc_attr__('Zamknij', 'slawinsky_theme') . '">&times;</button>';

    if ($has_d) {
        echo '<div class="global-promo-popup__visual global-promo-popup__visual--desktop">';
        if ($link !== '') {
            echo '<a class="global-promo-popup__link" href="' . esc_url($link) . '">';
        }
        $wh_d = '';
        if (! empty($img_d['width']) && ! empty($img_d['height'])) {
            $wh_d = ' width="' . esc_attr((string) $img_d['width']) . '" height="' . esc_attr((string) $img_d['height']) . '"';
        }
        echo '<img src="' . esc_url($url_d) . '" alt="' . esc_attr($alt_d) . '"' . $wh_d . ' loading="lazy" decoding="async">';
        if ($link !== '') {
            echo '</a>';
        }
        echo '</div>';
    }

    if ($has_m) {
        echo '<div class="global-promo-popup__visual global-promo-popup__visual--mobile">';
        if ($link !== '') {
            echo '<a class="global-promo-popup__link" href="' . esc_url($link) . '">';
        }
        $wh_m = '';
        if (! empty($img_m['width']) && ! empty($img_m['height'])) {
            $wh_m = ' width="' . esc_attr((string) $img_m['width']) . '" height="' . esc_attr((string) $img_m['height']) . '"';
        }
        echo '<img src="' . esc_url($url_m) . '" alt="' . esc_attr($alt_m) . '"' . $wh_m . ' loading="lazy" decoding="async">';
        if ($link !== '') {
            echo '</a>';
        }
        echo '</div>';
    }

    echo '</div></div>';

    $cookie_name = GLOBAL_PROMO_POPUP_COOKIE;
    ?>
<script>
(function(){
	var root=document.getElementById('global-promo-popup');
	if(!root)return;
	var days=parseInt(root.getAttribute('data-cookie-days'),10)||7;
	var maxAge=days*24*60*60;
	var cname=<?php echo wp_json_encode($cookie_name); ?>;
	function setDismissCookie(){
		var secure=window.location.protocol==='https:'?'; Secure':'';
		document.cookie=cname+'=1; path=/; max-age='+maxAge+'; SameSite=Lax'+secure;
	}
	function dismiss(){
		setDismissCookie();
		root.setAttribute('hidden','');
		root.style.display='none';
	}
	root.querySelectorAll('[data-promo-close]').forEach(function(el){
		el.addEventListener('click',function(e){
			e.preventDefault();
			dismiss();
		});
	});
	document.addEventListener('keydown',function(e){
		if(e.key==='Escape'&&!root.hasAttribute('hidden'))dismiss();
	});
	root.removeAttribute('hidden');
	root.style.display='flex';
})();
</script>
    <?php
}

add_action('wp_footer', 'global_render_promo_popup', 5);
