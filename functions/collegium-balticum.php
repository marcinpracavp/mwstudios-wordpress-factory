<?php
/** Client rendering stays behind CB data; the universal factory keeps its defaults. */
function cb_enabled() { return (bool) get_option('cb_migration'); }
function cb_html($html) {
    // Source overlay tiles include an empty .more element drawing their line.
    // Older extracted ACF omitted it; restore decoration without an empty action.
    $html=preg_replace_callback('~(<a\b[^>]*class="[^"]*\bspecial-box\b[^"]*"[^>]*>)(.*?)(</a>)~si',function($match){
        if(preg_match('~class="[^"]*\bmore\b~',$match[2]))return $match[0];
        return $match[1].$match[2].'<span class="more" aria-hidden="true"></span>'.$match[3];
    },$html);
    // Image galleries are figures, not definition lists. Keep source styling.
    $html=preg_replace_callback('~<dl\b([^>]*class="[^"]*\bgallery-item\b[^"]*"[^>]*)>(.*?)</dl>~si',function($match){
        $body=preg_replace(['~<dt\b~i','~</dt>~i','~<dd\b~i','~</dd>~i'],['<div','</div>','<figcaption','</figcaption>'],$match[2]);
        return '<figure'.$match[1].'>'.$body.'</figure>';
    },$html);
    // The captured decorative play icon supplies no accessible link name.
    $html=preg_replace_callback('~<a\b[^>]*class="[^"]*wp-block-getwid-video-popup__link[^"]*"[^>]*>~i',function($match){
        return strpos($match[0],'aria-label=')!==false?$match[0]:substr($match[0],0,-1).' aria-label="Otwórz film w YouTube">';
    },$html);
    // Empty source targets are decorative, never a phone/email action or reload.
    $html=preg_replace('/\s+href="(?:tel:|mailto:)?"/i','',$html);
    // WordPress rejects rgb() in inline values; retain the same color as hexadecimal.
    $html=preg_replace_callback('/rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)/i',function($m){return sprintf("#%02x%02x%02x",min(255,(int)$m[1]),min(255,(int)$m[2]),min(255,(int)$m[3]));},$html);
    $origin=get_option('cb_import_origin');if($origin && $origin!==home_url())$html=str_replace($origin,home_url(),$html);
    $html=preg_replace_callback('~(\bhref=")([^"]+)(")~i',function($match){return $match[1].esc_url(cb_local_url(html_entity_decode($match[2],ENT_QUOTES,'UTF-8'))).$match[3];},$html);
    // Describe real local documents without adding visible source content.
    static $document_info=null;
    if($document_info===null){
        $document_info=[];
        foreach((array)get_option('cb_document_map',[]) as $document){
            $id=(int)($document['id']??0);$file=get_attached_file($id);
            if($file && is_file($file))$document_info[wp_get_attachment_url($id)]=strtoupper(pathinfo($file,PATHINFO_EXTENSION)).', '.size_format(filesize($file),1);
        }
    }
    $html=preg_replace_callback('~<a\b([^>]*href="([^"]+)"[^>]*)>(.*?)</a>~si',function($match)use($document_info){
        $url=html_entity_decode($match[2],ENT_QUOTES,'UTF-8');
        if(!isset($document_info[$url]))return $match[0];
        $label=trim(html_entity_decode(wp_strip_all_tags($match[3]),ENT_QUOTES,'UTF-8'));
        if(!$label)return $match[0];
        $attributes=preg_replace('~\s+aria-label="[^"]*"~i','',$match[1]);
        $description=$document_info[$url].(strpos($attributes,'target="_blank"')!==false?', otwiera nową kartę':'');
        return '<a'.$attributes.' aria-label="'.esc_attr($label.' ('.$description.')').'">'.$match[3].'</a>';
    },$html);
    $html=preg_replace_callback('~(<input\b[^>]*name="_cb_nonce"[^>]*value=")[^"]*(")~',function($m){return $m[1].esc_attr(wp_create_nonce('cb_contact')).$m[2];},$html);
    $allowed = wp_kses_allowed_html('post');
    $allowed['iframe'] = array_fill_keys(['src','title','loading','allow','allowfullscreen','width','height','frameborder','referrerpolicy'], true);
    foreach (['form','input','select','option','textarea','label','button'] as $tag) {
        $allowed[$tag] = array_fill_keys(['class','id','name','type','value','placeholder','required','checked','selected','for','method','action','rows','cols','autocomplete','minlength','maxlength','disabled','aria-label','aria-describedby'], true);
    }
    foreach($allowed as &$attributes){$attributes['hidden']=true;$attributes['data-*']=true;$attributes['aria-*']=true;$attributes['tabindex']=true;$attributes['role']=true;} unset($attributes);
    $html = wp_kses($html, $allowed);
    return $html;
}
function cb_sections($sections) {
    foreach ((array) $sections as $section) get_template_part('partials/cb/section', null, ['section'=>$section]);
}
function cb_local_url($url) {
    if(preg_match('~^/?\?page_id=\d+~',$url))return 'https://www.cb.szczecin.pl/'.ltrim($url,'/');
    if(preg_match('~^https?://(?:www\.)?cb\.szczecin\.pl/\?page_id=\d+~',$url))return $url;
    if(wp_parse_url($url,PHP_URL_HOST)===wp_parse_url(home_url(),PHP_URL_HOST) && wp_parse_url($url,PHP_URL_PATH)==='/'){
        parse_str((string)wp_parse_url($url,PHP_URL_QUERY),$query);
        if(isset($query['page_id']) && !get_post((int)$query['page_id']))return 'https://www.cb.szczecin.pl/?'.wp_parse_url($url,PHP_URL_QUERY);
    }
    $documents=(array)get_option('cb_document_map',[]);
    if(isset($documents[$url]['id']))return wp_get_attachment_url($documents[$url]['id']);
    $map = (array) get_option('cb_url_map');
    $path = wp_parse_url($url, PHP_URL_PATH);$path=$path==='/'?'/':trailingslashit((string)$path);
    if (isset($map[$path]) && (preg_match('~^https?://(?:www\.)?cb\.szczecin\.pl(?:/|$)~', $url)||preg_match('~^/(?!/)~',$url))) {
        return home_url($path) . (wp_parse_url($url, PHP_URL_QUERY) ? '?' . wp_parse_url($url, PHP_URL_QUERY) : '') . (wp_parse_url($url, PHP_URL_FRAGMENT) ? '#' . wp_parse_url($url, PHP_URL_FRAGMENT) : '');
    }
    // Relative source links outside the 19-view map must not become local 404s.
    if(preg_match('~^/(?!/)~',$url))return 'https://www.cb.szczecin.pl'.$url;
    if(preg_match('~^\?page_id=\d+~',$url))return 'https://www.cb.szczecin.pl/'.$url;
    return $url;
}
add_filter('nav_menu_link_attributes',function($attributes){if(cb_enabled() && isset($attributes['href']))$attributes['href']=cb_local_url($attributes['href']);return $attributes;});
add_filter('body_class', function($classes){ if(cb_enabled()){ $classes[]='cb-site';$id=(is_archive()||is_search()||is_home())?'CB-02':get_post_meta(get_queried_object_id(),'_cb_source_id',true);if($id)$classes[]='cb-view-'.sanitize_html_class(strtolower($id)); } return $classes; });
add_action('wp_enqueue_scripts', function(){
    if (!cb_enabled()) return;
    $vars=''; foreach ((array)get_option('cb_asset_map') as $url=>$asset) {
        $vars.='--cb-asset-'.substr(hash('sha256',$url),0,12).':url("'.esc_url(wp_get_attachment_url($asset['id'])).'");';
    }
    wp_add_inline_style('app', '.cb-site{'.$vars.'}');
},20);
add_filter('document_title_parts', function($parts){ $meta=get_post_meta(get_queried_object_id(),'_cb_seo',true); if(is_category()) $meta=get_option('cb_archive_seo'); if(!empty($meta['title'])){$parts['title']=$meta['title'];unset($parts['site'],$parts['tagline']);}return $parts; });
add_action('wp_head',function(){if(!cb_enabled()||defined('WPSEO_VERSION'))return;$meta=is_category()?get_option('cb_archive_seo'):get_post_meta(get_queried_object_id(),'_cb_seo',true);if(!empty($meta['description']))echo '<meta name="description" content="'.esc_attr($meta['description']).'">';});
// Ancillary archive records contain captured excerpts only; do not pretend they are migrated articles.
add_filter('post_link',function($url,$post){$source=get_post_meta($post->ID,'_cb_reference_only',true);return $source ?: $url;},10,2);
add_action('admin_post_nopriv_cb_contact','cb_contact');add_action('admin_post_cb_contact','cb_contact');
function cb_contact(){
    if(!cb_enabled() || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_cb_nonce']??'')), 'cb_contact')) wp_die('Nieprawidłowe żądanie.', '', ['response'=>403]);
    $name=sanitize_text_field(wp_unslash(($_POST['your-name']??$_POST['first-name']??'')));$email=sanitize_email(wp_unslash(($_POST['your-email']??$_POST['email']??'')));$message=sanitize_textarea_field(wp_unslash($_POST['your-message']??$_POST['textarea-621']??''));
    $errors=[];
    if(!$name)$errors[isset($_POST['your-name'])?'your-name':'first-name']='Podaj imię.';
    if(!sanitize_text_field(wp_unslash($_POST['surname']??'')))$errors['surname']='Podaj nazwisko.';
    if(!preg_match('/^[\d\s()+.\-]{7,30}$/',sanitize_text_field(wp_unslash($_POST['phone']??''))))$errors['phone']='Podaj poprawny numer telefonu.';
    if(!is_email($email))$errors[isset($_POST['your-email'])?'your-email':'email']='Podaj poprawny adres e-mail.';
    if(empty($_POST['cb_consent']))$errors['cb_consent']='Zaznacz wymaganą zgodę.';
    if($errors){if(strpos($_SERVER['HTTP_ACCEPT']??'', 'application/json')!==false)wp_send_json_error(['message'=>'Uzupełnij wymagane pola i zgodę.','errors'=>$errors],422);wp_die(esc_html(implode(' ',$errors)), '', ['response'=>422]);}
    // Local-only sink. No source recipient is contacted.
    if(wp_get_environment_type()==='production')wp_die('Lokalny formularz wymaga konfiguracji środowiska.', '', ['response'=>503]);
    $messages=(array)get_option('cb_local_messages',[]);$messages[]= ['name'=>$name,'email'=>$email,'message'=>$message,'surname'=>sanitize_text_field(wp_unslash($_POST['surname']??'')),'phone'=>sanitize_text_field(wp_unslash($_POST['phone']??'')),'date'=>current_time('mysql')];update_option('cb_local_messages',array_slice($messages,-50),false);
    if(strpos($_SERVER['HTTP_ACCEPT']??'', 'application/json')!==false)wp_send_json_success(['message'=>'Zgłoszenie zapisano lokalnie. Wiadomość nie została wysłana do uczelni.']);wp_safe_redirect(add_query_arg('cb_form','saved',home_url('/kontakt/')));exit;
}
function cb_item_html($item){
    $html=$item['body']??'';
    if(!empty($item['image']))$html=preg_replace_callback('~<img\b[^>]*>~i',function($match)use($item){preg_match('~\balt="([^"]*)"~',$match[0],$alt);preg_match('~\bclass="([^"]*)"~',$match[0],$class);return wp_get_attachment_image((int)$item['image'],'full',false,['alt'=>html_entity_decode($alt[1]??''),'class'=>$class[1]??'','loading'=>'eager']);},$html,1);
    if(!empty($item['link']['url']))$html=preg_replace_callback('~(<a\b[^>]*href=")[^"]*(")~i',function($m)use($item){return $m[1].esc_url($item['link']['url']).$m[2];},$html,1);
    return cb_html($html);
}
// Preserve imported component DOM; ACF still resolves subfield keys and image/link formats.
add_filter('acf/format_value/type=wysiwyg',function($value,$post_id,$field){
    if(strpos($field['key']??'', 'field_cb_')===0)return acf_get_value($post_id,$field);
    return $value;
},20,3);
add_action('wp_head',function(){
 if(!cb_enabled() || defined('WPSEO_VERSION'))return;
 $data=is_category()?get_option('cb_archive_source_metadata'):get_post_meta(get_queried_object_id(),'_cb_source_metadata',true);
 foreach((array)$data as $meta){$name=$meta['name']??'';if(!preg_match('/^(og:|twitter:|article:|geo\.)/',$name)||$name==='og:locale:alternate'||empty($meta['content']))continue;$value=$meta['content'];if($name==='og:url')$value=home_url(wp_parse_url($value,PHP_URL_PATH));if(in_array($name,['og:image','twitter:image'],true))$value=cb_local_image_url($value);echo '<meta '.(preg_match('/^(og:|article:)/',$name)?'property':'name').'="'.esc_attr($name).'" content="'.esc_attr($value).'">';}
},20);

add_filter('safe_style_css',function($properties){if(cb_enabled())$properties[]='text-shadow';return $properties;});

function cb_local_image_url($url){
    $path=wp_parse_url($url,PHP_URL_PATH);
    foreach((array)get_option('cb_asset_map',[]) as $source=>$asset){
        if($source===$url||($path&&str_ends_with((string)wp_parse_url($source,PHP_URL_PATH),$path)))return wp_get_attachment_url($asset['id']);
    }
    return $url;
}

/** Captured card geometry, with native WordPress editorial values. */
function cb_blog_card($html) {
    $title=get_the_title();if(preg_match('~<p[^>]*class="title"[^>]*>(.*?)</p>~s',$html,$match)){ $visible=html_entity_decode(wp_strip_all_tags($match[1]),ENT_QUOTES,'UTF-8');if(substr($visible,-3)==='...')$title=mb_substr($title,0,mb_strlen($visible)-3).'...';}
    $values=['title'=>$title,'date'=>get_the_date('d/m/Y'),'desc'=>get_post_field('post_excerpt',get_the_ID(),'raw')];
    foreach($values as $class=>$value){
        $pattern='~(<(?:p|div)[^>]*class="[^" ]*(?:[^" ]* )*'.$class.'(?: [^"]*)?"[^>]*>).*?(</(?:p|div)>)~s';
        $html=preg_replace_callback($pattern,function($match)use($value,$class){$text=esc_html($value);if($class==='date')$text='<time datetime="'.esc_attr(get_the_date('c')).'">'.$text.'</time>';return $match[1].$text.$match[2];},$html,1);
    }
    $html=preg_replace_callback('~(<a\b[^>]*href=")[^"]*(")~',function($m){return $m[1].esc_url(get_permalink()).$m[2];},$html,1);
    $thumbnail=get_post_thumbnail_id();
    if($thumbnail && $thumbnail!==(int)get_post_meta(get_the_ID(),'_cb_imported_thumbnail_id',true))$html=preg_replace_callback('~<img\b[^>]*>~',function()use($thumbnail){return wp_get_attachment_image($thumbnail,'full');},$html,1);
    return cb_html($html);
}
