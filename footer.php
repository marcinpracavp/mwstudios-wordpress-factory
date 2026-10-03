	</main>

	<?php if (is_page(179) || is_page(['contact', 'kontakt'])) : ?>
		<?php get_template_part('partials/footer', 'contact'); ?>
	<?php else : ?>
		<?php get_template_part('partials/footer'); ?>
	<?php endif; ?>

	<?php wp_footer(); ?>

    <?php $acf_globals = get_fields('options'); if(isset($acf_globals['skrypty_footer'])) : ?>
        <?php echo $acf_globals['skrypty_footer']; ?>
    <?php endif; ?>

	</body>

	</html>
