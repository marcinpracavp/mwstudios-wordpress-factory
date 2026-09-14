<?php
/** Empty anonymous checkout is the sourced native account-entry state. */
defined('ABSPATH') || exit;

if (!is_user_logged_in()) {
    get_template_part('partials/checkout-login-options');
    return;
}

wc_print_notice(esc_html__('Your cart is currently empty.', 'woocommerce'), 'notice');
?>
<p class="return-to-shop"><a class="button wc-backward" href="<?php echo esc_url(apply_filters('woocommerce_return_to_shop_redirect', wc_get_page_permalink('shop'))); ?>"><?php echo esc_html__('Return to shop', 'woocommerce'); ?></a></p>
