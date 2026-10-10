<?php
$s=$args['section'];$kind=$s['acf_fc_layout']??'content';$tag=in_array($s['tag']??'', ['div','section','article','h1','h2','h3','h4','p'],true)?$s['tag']:'section';
$style=!empty($s['space_after'])?' style="margin-bottom:'.(int)$s['space_after'].'px"':'';
echo '<'.$tag.' class="'.esc_attr($s['variant']??'').' cb-section cb-section--'.esc_attr($kind).'"'.$style.'>';
if($kind==='banner'){
    $items=(array)($s['items']??[]);$unique=[];foreach($items as $item){$hash=md5($item['body']??'');$unique[$hash]=$item;} $items=array_values($unique);
    echo '<div class="bx-slider cb-banner" data-cb-banner data-initial-desktop="'.(int)($s['initial_desktop']??0).'" data-initial-mobile="'.(int)($s['initial_mobile']??0).'">';foreach($items as $index=>$item)echo '<div class="box"'.($index?' hidden':'').'>'.cb_item_html($item).'</div>';echo '</div>';
    if(count($items)>1)echo '<div class="cb-controls"><button type="button" data-cb-prev aria-label="Poprzedni slajd">←</button><button type="button" data-cb-next aria-label="Następny slajd">→</button><span role="status" class="screen-reader-text"></span></div>';
    if(count($items)>1){echo '<div class="cb-banner-pagination" role="group" aria-label="Wybierz slajd">';foreach($items as $index=>$item)echo '<button type="button" data-cb-slide="'.(int)$index.'" aria-label="Pokaż slajd '.(int)($index+1).'"></button>';echo '</div>';}
}elseif($kind==='accordion'){
    echo '<div class="l-container width-2"><div class="section-title">'.cb_html($s['title']??'').'<div class="faq-content">';foreach((array)($s['items']??[]) as $item){echo '<details class="question"'.(!empty($item['initially_open'])?' open':'').'><summary class="title">'.cb_html($item['title']??'').'</summary><div class="hide cb-answer">'.cb_item_html($item).'</div></details>';}echo '</div></div></div>';
}elseif($kind==='carousel'){
    $i=0;$html=preg_replace_callback('~<div class="([^"]*(?:global-slider|global-slider-test|logo-slider|part-slider)[^"]*)"[^>]*></div>~',function($match)use($s,&$i){$group=$s['groups'][$i++]??[];$out='<div class="'.esc_attr($match[1]).' cb-carousel" data-target="'.esc_attr($group['target']??'').'"'.($i>1?' hidden':'').' tabindex="0" role="region" aria-label="'.esc_attr($group['title']?:($s['label']??'Galeria')).'">';foreach((array)($group['items']??[]) as $item)$out.=cb_item_html($item);return $out.'</div><div class="cb-controls"'.($i>1?' hidden':'').'><button type="button" data-cb-scroll="-1" aria-label="Poprzednie elementy">←</button><button type="button" data-cb-scroll="1" aria-label="Następne elementy">→</button></div>';},$s['shell']??'');echo cb_html($html);
}else{echo cb_html($s['body']??'');}
echo '</'.$tag.'>';
