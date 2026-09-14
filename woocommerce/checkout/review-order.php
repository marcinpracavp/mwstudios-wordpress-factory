<?php
/** RudnikAgro native order totals. All amounts originate in the live cart. */
defined('ABSPATH') || exit;
$option = static function (string $name): string { return function_exists('rudnikagro_option') ? (string) rudnikagro_option($name) : ''; };
$summary_labels = function_exists('rudnikagro_lines') ? rudnikagro_lines($option('rudnikagro_checkout_totals_summary_labels')) : [];
?>
<section id="order_review" class="woocommerce-checkout-review-order c-checkout__summary" data-factory-component="checkout-totals">
    <h2><?php echo esc_html($option('rudnikagro_checkout_totals_summary_heading')); ?></h2>
    <dl>
        <div><dt><?php echo esc_html($summary_labels[0] ?? ''); ?></dt><dd><?php wc_cart_totals_subtotal_html(); ?></dd></div>
        <?php if (WC()->cart->needs_shipping()) : ?><div><dt><?php echo esc_html($summary_labels[1] ?? ''); ?></dt><dd><?php echo wp_kses_post(WC()->cart->get_cart_shipping_total()); ?></dd></div><?php endif; ?>
        <?php foreach (WC()->cart->get_coupons() as $code => $coupon) : ?><div class="c-checkout__discount"><dt><?php echo esc_html($summary_labels[2] ?? ''); ?><small><?php echo esc_html($summary_labels[3] ?? ''); ?></small></dt><dd><?php wc_cart_totals_coupon_html($coupon); ?></dd></div><?php endforeach; ?>
        <div class="c-checkout__amount-due"><dt><?php echo esc_html($option('rudnikagro_checkout_totals_total')); ?></dt><dd><?php wc_cart_totals_order_total_html(); ?></dd></div>
    </dl>
    <?php do_action('woocommerce_review_order_before_submit'); ?>
    <button type="submit" class="button alt c-checkout__place-order" name="woocommerce_checkout_place_order" id="place_order" value="<?php echo esc_attr($option('rudnikagro_checkout_totals_place_order_label')); ?>" data-value="<?php echo esc_attr($option('rudnikagro_checkout_totals_place_order_label')); ?>"><?php echo esc_html($option('rudnikagro_checkout_totals_place_order_label')); ?></button>
    <?php wp_nonce_field('woocommerce-process_checkout', 'woocommerce-process-checkout-nonce'); ?>
</section>
