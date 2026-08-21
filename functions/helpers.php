<?php

/**
 * Check if the post is older than $days
 *
 * @param String
 *
 * @return Integer $days
 */
function isOld($days)
{
  $days   = (int)$days;
  $offset = $days * 60 * 60 * 24;

  return (get_post_time() < date('U') - $offset) ? true : false;
}

/**
 * Returns the String of the asset in dist folder
 *
 * @param String asset
 *
 * @return String url
 */
function asset($asset)
{
  echo get_template_directory_uri() . '/dist/' . $asset;
}

/**
 * Inject inline SVG
 *
 * @param String name
 *
 * @return String HTML
 */
function svg($asset)
{
  $getOptions = array(
    "ssl" => array(
      "verify_peer"      => false,
      "verify_peer_name" => false
    )
  );
  echo file_get_contents(get_template_directory_uri() . '/dist/img/' . $asset, false, stream_context_create($getOptions));
}

function detectSafari($classes)
{
  $agent = $_SERVER['HTTP_USER_AGENT'];
  if (stripos($agent, 'Safari') !== false && stripos($agent, 'Chrome') == false) {
    $classes[] = 'safari';
  }

  return $classes;
}
add_filter('body_class', 'detectSafari');


/**
 * Log php output to console, why not
 */
function console_log($data)
{
  $output = $data;
  if (is_array($output)) {
    $output = implode(',', $output);
  }

  // print the result into the JavaScript console
  echo "<script>console.log( 'PHP LOG: " . $output . "' );</script>";
}


/**
 * Display acf link field
 */
function acf_link($link, $btn_class = '') {
  
  if( $link ) {
      $link_url = $link['url'];
      $link_title = $link['title'];
      $link_target = $link['target'] ? $link['target'] : '_self';
      echo "<a class='" . $btn_class . "' href='" . esc_url( $link_url ) . "' target='" . esc_attr( $link_target ) . "'>" . esc_html( $link_title ) . "</a>";
  }
}

/**
 * Display acf image
 */

 function acf_image($link, $size = 'full') {
  if($link) {
    echo wp_get_attachment_image($link['id'], $size);
  }
 }


function get_svg_content_by_url($file_url) {
    // Zamień URL na ścieżkę serwera
    $file_path = str_replace(
        home_url('/'), 
        ABSPATH, 
        $file_url
    );

    // Upewnij się, że plik istnieje
    if (file_exists($file_path)) {
        $svg_content = file_get_contents($file_path);
        
        // Dodaj klasę dla łatwiejszego stylowania
        $svg_content = str_replace('<svg', '<svg class="inline-svg"', $svg_content);
        
        // Usuń atrybut clip-path, który może przycinać SVG
        $svg_content = preg_replace('/clip-path\s*=\s*["\']url\(#clip-path\)["\']/', '', $svg_content);
        
        // Usuń również definicję clipPath, jeśli istnieje
        $svg_content = preg_replace('/<clipPath[^>]*id\s*=\s*["\']clip-path["\'][^>]*>.*?<\/clipPath>/s', '', $svg_content);
        
        // Sprawdź czy SVG ma atrybuty width, height lub viewBox
        if (strpos($svg_content, 'width=') === false && 
            strpos($svg_content, 'height=') === false && 
            strpos($svg_content, 'viewBox=') === false) {
            
            // Jeśli brakuje podstawowych atrybutów wymiarów, dodaj preserveAspectRatio
            $svg_content = str_replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"', $svg_content);
            
            // Próba ustawienia viewBox na podstawie zawartości SVG
            if (preg_match('/<svg[^>]*>/', $svg_content, $svg_tag)) {
                // Dodaj viewBox="0 0 100 100" jako uniwersalny fallback
                if (strpos($svg_tag[0], 'viewBox=') === false) {
                    $svg_content = str_replace('<svg', '<svg viewBox="0 0 100 100"', $svg_content);
                }
            }
        }
        
        return $svg_content;
    }
    return '';
}

 function svg_shortcode_by_url($atts) {
    $atts = shortcode_atts(
        array(
            'url' => ''
        ),
        $atts,
        'svg'
    );

    $file_url = esc_url($atts['url']);
    $svg_content = get_svg_content_by_url($file_url);

    if (!empty($svg_content)) {
        return $svg_content;
    } else {
        return 'Nie udało się załadować ikony SVG.';
    }
}
add_shortcode('svg', 'svg_shortcode_by_url');

// [svg file="images/icons/icon.svg"]