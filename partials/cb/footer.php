<footer class="cb-footer"><?php // Navigation groups are top-level footer sections; preserve their source typography.
$footer=cb_html((get_field('cb_footer','option') ?: get_option('cb_footer','')));
$footer=preg_replace('~<h4\b([^>]*class="[^"]*\btitle\b[^"]*"[^>]*)>(.*?)</h4>~si','<h2$1>$2</h2>',$footer);
// Contact names are footer sections; the email itself is ordinary contact text.
$footer=preg_replace_callback('~<h5\b([^>]*)>(.*?)</h5>~si',function($match){
    $tag=strpos($match[2],'<a')!==false?'p':'h2';
    $attributes=preg_replace('~class="([^"]*)"~','class="$1 cb-footer-contact-line"',$match[1]);
    if(strpos($attributes,'class=')===false)$attributes.=' class="cb-footer-contact-line"';
    return '<'.$tag.$attributes.'>'.$match[2].'</'.$tag.'>';
},$footer);
echo $footer; ?></footer>
