<?php
get_header(); ?>
<style>
	.error-404 {
		width: 100%;
		height: 50vh;
		font-size: 2rem;
		display: -ms-flexbox;
		display: flex;
		-ms-flex-align: center;
		align-items: center;
		-ms-flex-pack: center;
		justify-content: center;
		-ms-flex-direction: column;
		flex-direction: column;
		text-align: center;
		padding: 100px 0;
	}
</style>

<section class="grid error-404">
	<h2>Ta strona nie istnieje</h2>
	<a class="button-primary" href="<?= get_home_url() ?>">Przejdź na stronę główną</a>
</section>
<?php
get_footer();