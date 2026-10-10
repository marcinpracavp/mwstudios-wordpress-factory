<?php
echo '<div class="cb-content">';
$sections=(array)(get_field('cb_sections','option') ?: get_option('cb_archive_sections'));cb_sections(array_slice($sections,0,1));
?>
<div class="posts-listing">
<div class="l-container width-2"><div class="section-title"><h2><?php echo esc_html(is_search()?sprintf('Wyniki wyszukiwania: %s',get_search_query()):single_cat_title('',false)); ?></h2><div class="categories"><?php $categories=get_categories(['parent'=>get_term_by('slug','wpisy','category')->term_id,'hide_empty'=>false]);$order=(array)get_option('cb_archive_category_order');usort($categories,function($a,$b)use($order){return array_search($a->slug,$order)<=>array_search($b->slug,$order);});foreach($categories as $term): ?><a class="<?php echo is_category($term->term_id)?'active':''; ?>" href="<?php echo esc_url(get_category_link($term)); ?>"><?php echo esc_html($term->name); ?></a><?php endforeach; ?></div><?php $parent=get_term_by('slug','wpisy','category');if($parent): ?><a href="<?php echo esc_url(get_category_link($parent)); ?>" class="default-button line left"><?php echo esc_html__('Zobacz wszystkie','mwstudios-wordpress-factory'); ?></a><?php endif; ?></div></div>
<div class="search-box"><div class="l-container width-2"><?php echo cb_html(get_option('cb_archive_search')); ?></div></div>
<div class="l-container width-2"><div class="listing three-columns">
<?php while(have_posts()):the_post();$card=get_post_meta(get_the_ID(),'_cb_card_html',true);if($card)echo cb_blog_card($card);else{?><a class="box" href="<?php the_permalink(); ?>"><?php the_post_thumbnail('full'); ?><p class="date"><?php echo esc_html(get_the_date('d/m/Y')); ?></p><p class="title"><?php the_title(); ?></p><div class="desc"><?php the_excerpt(); ?></div></a><?php }endwhile; ?>
</div><?php $pagination=paginate_links(['type'=>'plain','prev_text'=>'Poprzednia','next_text'=>'Następna']);if($pagination)echo '<nav class="navigation pagination" aria-label="Strony bloga"><h2 class="screen-reader-text">Stronicowanie wpisów</h2><div class="nav-links">'.wp_kses_post($pagination).'</div></nav>'; ?></div></div>

</div>
