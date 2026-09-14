<?php
/** RudnikAgro native WooCommerce cart template. */
defined('ABSPATH') || exit;

do_action('woocommerce_before_cart');
$cart = WC()->cart;
$option = static function (string $name): string { return function_exists('rudnikagro_option') ? (string) rudnikagro_option($name) : ''; };
$remove_icon = (int) (function_exists('rudnikagro_option') ? rudnikagro_option('rudnikagro_cart_remove_icon_486_96') : 0);
?>
<section class="c-cart" data-factory-component="cart-template">
    <div class="l-container">
        <div class="c-cart__heading-offset pt-70">
            <div class="c-cart__heading-section mb-30" data-factory-section="cart-heading">
                <h1 class="c-cart__heading"><?php echo esc_html($option('rudnikagro_cart_heading')); ?></h1>
            </div>
        </div>
        <?php wc_print_notices(); ?>
        <div class="c-cart__layout" data-factory-section="cart-totals">
            <form class="woocommerce-cart-form c-cart__form" action="<?php echo esc_url(wc_get_cart_url()); ?>" method="post">
                <?php do_action('woocommerce_before_cart_table'); ?>
                <div class="c-cart__lines" data-factory-section="cart-lines">
                    <?php foreach ($cart->get_cart() as $cart_item_key => $cart_item) :
                        $_product = $cart_item['data'];
                        if (!$_product || !$_product->exists() || $cart_item['quantity'] <= 0 || !apply_filters('woocommerce_cart_item_visible', true, $cart_item, $cart_item_key)) { continue; }
                        $product_permalink = apply_filters('woocommerce_cart_item_permalink', $_product->is_visible() ? $_product->get_permalink($cart_item) : '', $cart_item, $cart_item_key);
                    ?>
                        <article class="c-cart__line <?php echo esc_attr(apply_filters('woocommerce_cart_item_class', 'woocommerce-cart-form__cart-item', $cart_item, $cart_item_key)); ?>">
                            <div class="c-cart__image">
                                <?php $thumbnail = apply_filters('woocommerce_cart_item_thumbnail', $_product->get_image('full'), $cart_item, $cart_item_key); echo $product_permalink ? '<a href="' . esc_url($product_permalink) . '">' . wp_kses_post($thumbnail) . '</a>' : wp_kses_post($thumbnail); ?>
                            </div>
                            <div class="c-cart__name"><?php
                                $display_product = $_product->is_type('variation') && $_product->get_parent_id() ? wc_get_product($_product->get_parent_id()) : $_product;
                                $name = apply_filters('woocommerce_cart_item_name', $display_product ? $display_product->get_name() : $_product->get_name(), $cart_item, $cart_item_key);
                                echo $product_permalink ? '<a href="' . esc_url($product_permalink) . '">' . wp_kses_post($name) . '</a>' : wp_kses_post($name);
                            ?></div>
                            <div class="c-cart__quantity">
                                <button type="button" class="c-cart__quantity-button" data-cart-quantity="decrease" aria-label="<?php echo esc_attr__('Zmniejsz ilość', 'slawinsky'); ?>">−</button>
                                <?php echo woocommerce_quantity_input(['input_name' => 'cart[' . $cart_item_key . '][qty]', 'input_value' => $cart_item['quantity'], 'max_value' => $_product->get_max_purchase_quantity(), 'min_value' => '0', 'product_name' => $_product->get_name()], $_product, false); ?>
                                <button type="button" class="c-cart__quantity-button" data-cart-quantity="increase" aria-label="<?php echo esc_attr__('Zwiększ ilość', 'slawinsky'); ?>">+</button>
                            </div>
                            <div class="c-cart__price"><?php echo wp_kses_post(apply_filters('woocommerce_cart_item_price', $cart->get_product_price($_product), $cart_item, $cart_item_key)); ?></div>
                            <div class="c-cart__remove"><a href="<?php echo esc_url(wc_get_cart_remove_url($cart_item_key)); ?>" class="remove" aria-label="<?php echo esc_attr(sprintf(__('Usuń %s z koszyka', 'slawinsky'), wp_strip_all_tags($_product->get_name()))); ?>" data-product_id="<?php echo esc_attr($_product->get_id()); ?>" data-product_sku="<?php echo esc_attr($_product->get_sku()); ?>"><?php if ($remove_icon) : ?><img src="<?php echo esc_url(wp_get_attachment_url($remove_icon)); ?>" alt="" aria-hidden="true"><?php endif; ?></a></div>
                        </article>
                    <?php endforeach; ?>
                </div>
                <input type="hidden" name="update_cart" value="1">
                <?php wp_nonce_field('woocommerce-cart', 'woocommerce-cart-nonce'); ?>
                <?php do_action('woocommerce_cart_actions'); ?>
                <?php do_action('woocommerce_after_cart_table'); ?>
            </form>

            <aside class="c-cart__totals cart-collaterals">
                <?php if (wc_coupons_enabled()) : ?>
                    <form class="c-cart__coupon" action="<?php echo esc_url(wc_get_cart_url()); ?>" method="post">
                        <h2><?php echo esc_html($option('rudnikagro_cart_coupon_heading')); ?></h2>
                        <label class="screen-reader-text" for="coupon_code"><?php echo esc_html($option('rudnikagro_cart_coupon_heading')); ?></label>
                        <input type="text" name="coupon_code" id="coupon_code" value="" placeholder="<?php echo esc_attr($option('rudnikagro_cart_coupon_placeholder')); ?>">
                        <button type="submit" name="apply_coupon" value="1"><?php echo esc_html($option('rudnikagro_cart_apply_coupon_label')); ?></button>
                        <?php wp_nonce_field('woocommerce-cart', 'woocommerce-cart-nonce'); ?>
                    </form>
                <?php endif; ?>
                <h2><?php echo esc_html($option('rudnikagro_cart_summary_heading')); ?></h2>
                <dl class="c-cart__summary">
                    <div><dt><?php echo esc_html($option('rudnikagro_cart_products_label')); ?></dt><dd><?php wc_cart_totals_subtotal_html(); ?></dd></div>
                    <div><dt><?php echo esc_html($option('rudnikagro_cart_shipping_label')); ?></dt><dd><?php echo wp_kses_post(wc_price($cart->get_shipping_total())); ?></dd></div>
                    <?php foreach ($cart->get_coupons() as $code => $coupon) : ?><div class="c-cart__discount"><dt><?php echo esc_html($option('rudnikagro_cart_discount_label')); ?><small><?php echo esc_html(sprintf(__('Dodano kod %s', 'slawinsky'), wc_strtoupper($code))); ?></small></dt><dd><?php echo wp_kses_post(wc_price($cart->get_coupon_discount_totals()[$code] ?? 0)); ?></dd></div><?php endforeach; ?>
                    <div class="c-cart__order-total"><dt><?php echo esc_html($option('rudnikagro_cart_total_label')); ?></dt><dd><?php wc_cart_totals_order_total_html(); ?></dd></div>
                </dl>
                <a class="c-cart__checkout" href="<?php echo esc_url(wc_get_checkout_url()); ?>"><?php echo esc_html($option('rudnikagro_cart_checkout_label')); ?></a>
            </aside>
        </div>
        <a class="c-cart__continue" href="<?php echo esc_url(wc_get_page_permalink('shop')); ?>"><?php echo esc_html($option('rudnikagro_cart_continue_shopping_label')); ?></a>
    </div>
</section>
<?php do_action('woocommerce_after_cart'); ?>
