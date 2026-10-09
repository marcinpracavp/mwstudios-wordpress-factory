    </main>
    <?php get_template_part('partials/footer'); ?>
    <?php wp_footer(); ?>
    <?php $acf_globals = function_exists('get_fields') ? (array) get_fields('options') : [];
    if (isset($acf_globals['skrypty_footer'])) { echo $acf_globals['skrypty_footer']; } ?>
</body>
</html>
