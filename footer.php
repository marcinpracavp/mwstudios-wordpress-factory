    </main>
    <?php get_template_part(cb_enabled() ? 'partials/cb/footer' : 'partials/footer'); ?>
    <?php wp_footer(); ?>
    <?php $acf_globals = function_exists('get_fields') ? (array) get_fields('options') : [];
    if (isset($acf_globals['skrypty_footer'])) { echo $acf_globals['skrypty_footer']; } ?>
</body>
</html>
