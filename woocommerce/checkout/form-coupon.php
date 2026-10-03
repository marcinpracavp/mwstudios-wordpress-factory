<?php
/** Native WooCommerce coupon submission, shown directly in the source layout. */
defined('ABSPATH') || exit;
$option = static function (string $name): string { return function_exists('emko_option') ? (string) emko_option($name) : ''; };
?>
<form class="checkout_coupon woocommerce-form-coupon c-checkout__coupon" method="post">
    <h2><?php echo esc_html($option('emko_checkout_totals_coupon_prompt')); ?></h2>
    <div><input type="text" name="coupon_code" class="input-text" placeholder="<?php echo esc_attr($option('emko_checkout_totals_coupon_placeholder')); ?>" id="coupon_code" value="" /><button type="submit" class="button" name="apply_coupon" value="<?php echo esc_attr($option('emko_checkout_totals_coupon_submit_label')); ?>"><?php echo esc_html($option('emko_checkout_totals_coupon_submit_label')); ?></button></div>
</form>
