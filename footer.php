	</main>

	<?php get_template_part('partials/footer'); ?>

	<?php wp_footer(); ?>

    <?php $acf_globals = get_fields('options'); if(isset($acf_globals['skrypty_footer'])) : ?>
        <?php echo $acf_globals['skrypty_footer']; ?>
    <?php endif; ?>
	</body>

	</html>