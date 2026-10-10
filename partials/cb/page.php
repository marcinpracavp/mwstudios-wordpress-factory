<?php
$sections=get_field('cb_sections') ?: [];
$tag=is_singular('post')?'article':'div';
echo '<'.$tag.' data-cb-leading-space="'.(int)get_field('cb_leading_space').'" class="cb-content '.esc_attr(get_post_meta(get_the_ID(),'_cb_main_class',true)).'">';
if(get_post_meta(get_the_ID(),'_cb_source_id',true)==='CB-03' && !empty($sections[0])) {
 $body=cb_item_html(['body'=>get_the_content(),'image'=>get_post_thumbnail_id()]);
 $body=preg_replace('~<h1\b[^>]*>.*?</h1>~s','<h1>'.esc_html(get_the_title()).'</h1>',$body,1);
 $body=preg_replace('~<p[^>]*>\s*\d{2}/\d{2}/\d{4}\s*</p>~','<time class="cb-entry-date" datetime="'.esc_attr(get_the_date('c')).'">'.esc_html(get_the_date('d/m/Y')).'</time>',$body,1);
 $sections[0]['body']=$body;
}
if(get_post_meta(get_the_ID(),'_cb_source_id',true)==='CB-01' && sanitize_key($_GET['cb_form']??'')==='saved') echo '<p role="status" class="l-container width-2 cb-form-status">Zgłoszenie zapisano lokalnie. Wiadomość nie została wysłana do uczelni.</p>';
cb_sections($sections);
echo '</'.$tag.'>';
