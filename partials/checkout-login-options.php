<?php
/** Native account-entry choices for an empty, anonymous WooCommerce checkout. */
defined('ABSPATH') || exit;

$option = static function (string $name): string {
    return function_exists('rudnikagro_option') ? (string) rudnikagro_option($name) : '';
};
$registration_background = (int) rudnikagro_option('rudnikagro_account_registration_dialog_background');
$registration_background_url = $registration_background ? wp_get_attachment_url($registration_background) : '';
?>
<section class="c-checkout c-checkout--entry c-checkout-entry" data-factory-component="checkout-account-entry">
    <div class="l-container">
        <header class="c-checkout__header pt-66">
            <div class="c-checkout-entry__heading" data-factory-section="checkout-login-heading"><h1><?php echo esc_html($option('rudnikagro_checkout_login_heading_heading')); ?></h1></div>
        </header>
        <ol class="c-checkout__steps mb-70" data-factory-component="checkout-steps" data-factory-section="checkout-steps">
            <?php foreach ([['rudnikagro_checkout_steps_step_1', 'rudnikagro_checkout_steps_step_login'], ['rudnikagro_checkout_steps_step_2', 'rudnikagro_checkout_steps_step_delivery_payment'], ['rudnikagro_checkout_steps_step_3', 'rudnikagro_checkout_steps_step_summary']] as $step => $fields) : ?>
                <li class="c-checkout__step<?php echo $step === 0 ? ' is-active' : ''; ?>"><span><?php echo esc_html($option($fields[0])); ?></span><strong><?php echo esc_html($option($fields[1])); ?></strong></li>
            <?php endforeach; ?>
        </ol>
        <div class="c-checkout-entry__choices" data-factory-section="checkout-login-options">
            <section class="c-checkout-entry__choice c-checkout-entry__login">
                <h2><?php echo esc_html($option('rudnikagro_checkout_login_options_login_title')); ?></h2>
                <form name="loginform" method="post" action="<?php echo esc_url(wp_login_url(wc_get_checkout_url())); ?>">
                    <label><input name="log" type="text" autocomplete="username" required placeholder="<?php echo esc_attr($option('rudnikagro_checkout_login_options_email_placeholder')); ?>"></label>
                    <label><input name="pwd" type="password" autocomplete="current-password" required placeholder="<?php echo esc_attr($option('rudnikagro_checkout_login_options_password_placeholder')); ?>"></label>
                    <label class="c-checkout-entry__remember"><input name="rememberme" type="checkbox" value="forever"><span><?php echo esc_html($option('rudnikagro_checkout_login_options_remember_me')); ?></span></label>
                    <input type="hidden" name="redirect_to" value="<?php echo esc_url(wc_get_checkout_url()); ?>">
                    <button class="button c-checkout-entry__button" name="wp-submit" type="submit"><?php echo esc_html($option('rudnikagro_checkout_login_options_login_submit')); ?></button>
                </form>
                <a class="c-checkout-entry__outline-button" href="<?php echo esc_url(wp_lostpassword_url(wc_get_checkout_url())); ?>"><?php echo esc_html($option('rudnikagro_checkout_login_options_forgot_password')); ?></a>
            </section>
            <section class="c-checkout-entry__choice c-checkout-entry__guest">
                <h2><?php echo esc_html($option('rudnikagro_checkout_login_options_guest_title')); ?></h2>
                <p><?php echo esc_html($option('rudnikagro_checkout_login_options_guest_copy')); ?></p>
                <a class="button c-checkout-entry__button" href="<?php echo esc_url(wc_get_checkout_url()); ?>"><?php echo esc_html($option('rudnikagro_checkout_login_options_guest_submit')); ?></a>
            </section>
            <section class="c-checkout-entry__choice c-checkout-entry__register">
                <h2><?php echo esc_html($option('rudnikagro_checkout_login_options_register_title')); ?></h2>
                <?php $benefits = rudnikagro_lines($option('rudnikagro_checkout_login_options_register_benefits')); ?>
                <?php if ($benefits) : ?><p><?php echo esc_html(array_shift($benefits)); ?></p><ul><?php foreach ($benefits as $benefit) : ?><li><?php echo esc_html($benefit); ?></li><?php endforeach; ?></ul><?php endif; ?>
                <button class="button c-checkout-entry__button" type="button" data-checkout-registration-open aria-expanded="false"><?php echo esc_html($option('rudnikagro_checkout_login_options_register_submit')); ?></button>
            </section>
        </div>
    </div>
    <div class="c-checkout-entry__registration" data-factory-section="account-registration-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-registration-heading" hidden>
        <?php if ($registration_background_url) : ?><img class="c-checkout-entry__registration-background" src="<?php echo esc_url($registration_background_url); ?>" alt="" aria-hidden="true"><?php endif; ?>
        <form class="c-checkout-entry__registration-form" method="post" action="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">
            <h2 id="checkout-registration-heading"><?php echo esc_html($option('rudnikagro_account_registration_dialog_496_1728')); ?></h2>
            <label><input type="text" name="username" autocomplete="username" required placeholder="<?php echo esc_attr($option('rudnikagro_account_registration_dialog_509_243')); ?>"></label>
            <label><input type="text" name="first_name" autocomplete="given-name" required placeholder="<?php echo esc_attr($option('rudnikagro_account_registration_dialog_509_246')); ?>"></label>
            <label><input type="text" name="last_name" autocomplete="family-name" required placeholder="<?php echo esc_attr($option('rudnikagro_account_registration_dialog_509_249')); ?>"></label>
            <label><input type="email" name="email" autocomplete="email" required placeholder="<?php echo esc_attr($option('rudnikagro_account_registration_dialog_509_252')); ?>"></label>
            <label><input type="password" name="password" autocomplete="new-password" required placeholder="<?php echo esc_attr($option('rudnikagro_account_registration_dialog_509_255')); ?>"></label>
            <label><input type="password" name="password_confirm" autocomplete="new-password" required placeholder="<?php echo esc_attr($option('rudnikagro_account_registration_dialog_509_258')); ?>"></label>
            <p class="c-checkout-entry__password-guidance"><?php echo esc_html($option('rudnikagro_account_registration_dialog_496_1758')); ?></p>
            <p class="c-checkout-entry__required-note"><?php echo esc_html($option('rudnikagro_account_registration_dialog_496_1760')); ?></p>
            <label class="c-checkout-entry__terms"><input type="checkbox" required><span><?php echo esc_html($option('rudnikagro_account_registration_dialog_509_261')); ?></span></label>
            <?php wp_nonce_field('woocommerce-register', 'woocommerce-register-nonce'); ?>
            <button class="button c-checkout-entry__button" type="submit" name="register" value="<?php echo esc_attr($option('rudnikagro_account_registration_dialog_496_1733')); ?>"><?php echo esc_html($option('rudnikagro_account_registration_dialog_496_1733')); ?></button>
        </form>
    </div>
</section>
