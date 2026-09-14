<?php
/** RudnikAgro native WooCommerce checkout template. */
defined('ABSPATH') || exit;

$option = static function (string $name): string { return function_exists('rudnikagro_option') ? (string) rudnikagro_option($name) : ''; };
$billing = $checkout->get_checkout_fields('billing');
$billing_order = ['billing_first_name', 'billing_last_name', 'billing_country', 'billing_address_1', 'billing_postcode', 'billing_city', 'billing_phone', 'billing_email'];

do_action('woocommerce_before_checkout_form', $checkout);
if (!is_user_logged_in() && (!WC()->cart || WC()->cart->is_empty())) {
    get_template_part('partials/checkout-login-options');
    do_action('woocommerce_after_checkout_form', $checkout);
    return;
}
if (!$checkout->is_registration_enabled() && $checkout->is_registration_required() && !is_user_logged_in()) {
    echo esc_html(apply_filters('woocommerce_checkout_must_be_logged_in_message', __('You must be logged in to checkout.', 'woocommerce')));
    return;
}
?>
<section class="c-checkout" data-factory-component="checkout-template">
    <div class="l-container">
        <header class="c-checkout__header pt-126" data-factory-section="checkout-heading">
            <h1><?php echo esc_html($option('rudnikagro_checkout_heading')); ?></h1>
        </header>
        <ol class="c-checkout__steps mb-94" data-factory-section="checkout-steps">
            <?php foreach ([['rudnikagro_checkout_steps_step_1', 'rudnikagro_checkout_steps_step_login'], ['rudnikagro_checkout_steps_step_2', 'rudnikagro_checkout_steps_step_delivery_payment'], ['rudnikagro_checkout_steps_step_3', 'rudnikagro_checkout_steps_step_summary']] as $step => $fields) : ?>
                <li class="c-checkout__step<?php echo $step === 1 ? ' is-active' : ''; ?>"><span><?php echo esc_html($option($fields[0])); ?></span><strong><?php echo esc_html($option($fields[1])); ?></strong></li>
            <?php endforeach; ?>
        </ol>
        <?php wc_print_notices(); ?>
        <form name="checkout" method="post" class="checkout woocommerce-checkout c-checkout__form" action="<?php echo esc_url(wc_get_checkout_url()); ?>" enctype="multipart/form-data">
            <div class="c-checkout__grid">
                <div class="c-checkout__main">
                    <section class="c-checkout__panel c-checkout__customer" data-factory-section="checkout-customer-details">
                        <h2><?php echo esc_html($option('rudnikagro_checkout_customer_details_489_657')); ?></h2>
                        <p class="c-checkout__customer-type"><?php echo esc_html($option('rudnikagro_checkout_customer_details_492_684')); ?></p>
                        <div class="c-checkout__billing-fields">
                            <?php foreach ($billing_order as $field_key) : if (isset($billing[$field_key])) { woocommerce_form_field($field_key, $billing[$field_key], $checkout->get_value($field_key)); } endforeach; ?>
                        </div>
                        <p class="c-checkout__required"><?php echo esc_html($option('rudnikagro_checkout_customer_details_492_685')); ?></p>
                        <?php if (WC()->cart->needs_shipping_address()) : ?>
                            <p class="form-row form-row-wide c-checkout__ship-different"><label class="woocommerce-form__label woocommerce-form__label-for-checkbox checkbox"><input class="woocommerce-form__input woocommerce-form__input-checkbox input-checkbox" id="ship-to-different-address-checkbox" type="checkbox" name="ship_to_different_address" value="1" /><span><?php echo esc_html($option('rudnikagro_checkout_customer_details_492_688')); ?></span></label></p>
                        <?php endif; ?>
                    </section>
                    <section class="c-checkout__panel c-checkout__payment" data-factory-section="checkout-payment">
                        <h2><?php echo esc_html($option('rudnikagro_checkout_payment_payment_heading')); ?></h2>
                        <?php woocommerce_checkout_payment(); ?>
                    </section>
                    <section class="c-checkout__panel c-checkout__delivery" data-factory-section="checkout-delivery">
                        <h2><?php echo esc_html($option('rudnikagro_checkout_delivery_delivery_heading')); ?></h2>
                        <?php wc_cart_totals_shipping_html(); ?>
                    </section>
                </div>
                <aside class="c-checkout__totals" data-factory-section="checkout-totals">
                    <?php wc_get_template('checkout/form-coupon.php'); ?>
                    <?php do_action('woocommerce_checkout_order_review'); ?>
                </aside>
            </div>
        </form>
    </div>
</section>
<?php do_action('woocommerce_after_checkout_form', $checkout); ?>
