<?php
/** Native payment methods intentionally separated from the order submit control. */
defined('ABSPATH') || exit;
?>
<div id="payment" class="woocommerce-checkout-payment">
    <?php if (WC()->cart->needs_payment()) : ?>
        <ul class="wc_payment_methods payment_methods methods">
            <?php if (!empty($available_gateways)) : foreach ($available_gateways as $gateway) : ?>
                <?php wc_get_template('checkout/payment-method.php', ['gateway' => $gateway]); ?>
            <?php endforeach; else : ?>
                <li class="woocommerce-notice woocommerce-notice--info woocommerce-info"><?php echo wp_kses_post(apply_filters('woocommerce_no_available_payment_methods_message', WC()->customer->get_billing_country() ? esc_html__('Sorry, it seems that there are no available payment methods for your state. Please contact us if you require assistance or wish to make alternate arrangements.', 'woocommerce') : esc_html__('Please fill in your details above to see available payment methods.', 'woocommerce'))); ?></li>
            <?php endif; ?>
        </ul>
    <?php endif; ?>
</div>
