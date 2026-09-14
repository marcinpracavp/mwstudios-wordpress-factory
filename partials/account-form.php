<?php
/** Native WooCommerce authentication view for the project-owned account route. */
if (!defined('ABSPATH')) { exit; }

$option = static fn (string $field) => rudnikagro_option($field);
$breadcrumbs = $option('rudnikagro_account_breadcrumb');
$account_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/');
$lost_password_url = function_exists('wc_lostpassword_url') ? wc_lostpassword_url() : wp_lostpassword_url();
?>
<main class="c-account" data-factory-component="account-authentication">
    <nav class="c-account__breadcrumbs" data-factory-section="account-breadcrumbs" aria-label="<?php echo esc_attr__('Breadcrumb', 'rudnikagro'); ?>">
        <?php if (is_array($breadcrumbs)) : ?>
            <?php foreach ($breadcrumbs as $index => $item) : ?>
                <?php if ($index > 0) : ?><span aria-hidden="true"> / </span><?php endif; ?>
                <?php if (!empty($item['current'])) : ?>
                    <span aria-current="page"><?php echo esc_html($item['label'] ?? ''); ?></span>
                <?php else : ?>
                    <a href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html($item['label'] ?? ''); ?></a>
                <?php endif; ?>
            <?php endforeach; ?>
        <?php endif; ?>
    </nav>

    <div class="c-account__columns">
        <section class="c-account__panel c-account__login" data-factory-section="account-login">
            <h1><?php echo esc_html($option('rudnikagro_account_login_title')); ?></h1>
            <form class="woocommerce-form woocommerce-form-login login" method="post" action="<?php echo esc_url($account_url); ?>">
                <?php do_action('woocommerce_login_form_start'); ?>
                <p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
                    <label for="username"><?php echo esc_html($option('rudnikagro_account_login_email_label')); ?></label>
                    <input type="text" class="woocommerce-Input woocommerce-Input--text input-text" name="username" id="username" autocomplete="username" required>
                </p>
                <p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
                    <label for="password"><?php echo esc_html($option('rudnikagro_account_login_password_label')); ?></label>
                    <input class="woocommerce-Input woocommerce-Input--text input-text" type="password" name="password" id="password" autocomplete="current-password" required>
                </p>
                <?php do_action('woocommerce_login_form'); ?>
                <p class="form-row c-account__remember">
                    <label class="woocommerce-form__label woocommerce-form__label-for-checkbox woocommerce-form-login__rememberme">
                        <input class="woocommerce-form__input woocommerce-form__input-checkbox" name="rememberme" type="checkbox" value="forever">
                        <span><?php echo esc_html($option('rudnikagro_account_login_remember_label')); ?></span>
                    </label>
                </p>
                <?php wp_nonce_field('woocommerce-login', 'woocommerce-login-nonce'); ?>
                <p class="form-row c-account__actions">
                    <button type="submit" class="woocommerce-button button woocommerce-form-login__submit" name="login" value="<?php echo esc_attr($option('rudnikagro_account_login_submit_label')); ?>"><?php echo esc_html($option('rudnikagro_account_login_submit_label')); ?></button>
                    <a href="<?php echo esc_url($lost_password_url); ?>"><?php echo esc_html($option('rudnikagro_account_login_reset_label')); ?></a>
                </p>
                <?php do_action('woocommerce_login_form_end'); ?>
            </form>
        </section>

        <section class="c-account__panel c-account__registration" data-factory-section="account-registration">
            <h2><?php echo esc_html($option('rudnikagro_account_registration_title')); ?></h2>
            <div class="c-account__benefits"><?php echo wp_kses_post($option('rudnikagro_account_registration_benefits')); ?></div>
            <details class="c-account__registration-details">
                <summary class="button"><?php echo esc_html($option('rudnikagro_account_registration_submit_label')); ?></summary>
                <form class="woocommerce-form woocommerce-form-register register" method="post" action="<?php echo esc_url($account_url); ?>">
                    <?php do_action('woocommerce_register_form_start'); ?>
                    <p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
                        <label for="reg_email"><?php echo esc_html($option('rudnikagro_account_login_email_label')); ?></label>
                        <input type="email" class="woocommerce-Input woocommerce-Input--text input-text" name="email" id="reg_email" autocomplete="email" required>
                    </p>
                    <p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
                        <label for="reg_password"><?php echo esc_html($option('rudnikagro_account_login_password_label')); ?></label>
                        <input type="password" class="woocommerce-Input woocommerce-Input--text input-text" name="password" id="reg_password" autocomplete="new-password" required>
                    </p>
                    <?php do_action('woocommerce_register_form'); ?>
                    <?php wp_nonce_field('woocommerce-register', 'woocommerce-register-nonce'); ?>
                    <button type="submit" class="woocommerce-Button button" name="register" value="<?php echo esc_attr($option('rudnikagro_account_registration_submit_label')); ?>"><?php echo esc_html($option('rudnikagro_account_registration_submit_label')); ?></button>
                    <?php do_action('woocommerce_register_form_end'); ?>
                </form>
            </details>
        </section>
    </div>
</main>
