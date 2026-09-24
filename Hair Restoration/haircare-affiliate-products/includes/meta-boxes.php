<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'hap_add_meta_boxes' ) ) {
    function hap_add_meta_boxes() {
        add_meta_box(
            'hap_product_details',
            'Affiliate Product Details',
            'hap_product_details_callback',
            'affiliate_product',
            'normal',
            'high'
        );
    }
}
add_action( 'add_meta_boxes', 'hap_add_meta_boxes' );

if ( ! function_exists( 'hap_product_details_callback' ) ) {
    function hap_product_details_callback( $post ) {
        wp_nonce_field( 'hap_product_details_nonce', 'hap_nonce' );

        $asin          = get_post_meta( $post->ID, '_hap_asin', true );
        $associate_tag = get_post_meta( $post->ID, '_hap_associate_tag', true );
        $price         = get_post_meta( $post->ID, '_hap_price', true );
        $price_date    = get_post_meta( $post->ID, '_hap_price_date', true );
        $button_text   = get_post_meta( $post->ID, '_hap_button_text', true );
        $marketplace   = get_post_meta( $post->ID, '_hap_marketplace', true );

        if ( empty( $associate_tag ) ) {
            $associate_tag = 'YOURTAG-20';
        }
if ( empty( $button_text ) ) {
        $button_text = 'View on Amazon';
    }
        if ( empty( $marketplace ) ) {
            $marketplace = 'www.amazon.ca';
        }
        if ( empty( $price_date ) ) {
            $price_date = gmdate( 'Y-m-d' );
        }
        ?>
        <style>
            .hap-field-row { margin-bottom: 16px; }
            .hap-field-row label { display: block; font-weight: 600; margin-bottom: 4px; font-size: 14px; }
            .hap-field-row input[type="text"],
            .hap-field-row input[type="number"],
            .hap-field-row input[type="url"],
            .hap-field-row select { width: 100%; max-width: 500px; padding: 8px; }
            .hap-field-row .description { color: #666; font-size: 12px; margin-top: 4px; }
            .hap-section-title { font-size: 16px; font-weight: 700; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #002444; }
            .hap-preview { background: #f4f3f6; border: 1px solid #E5E7EB; padding: 12px; margin-top: 10px; border-radius: 4px; }
            .hap-preview code { font-size: 12px; }
        </style>

        <div class="hap-meta-box">
            <div class="hap-section-title">Amazon Product Info</div>

            <div class="hap-field-row">
                <label for="hap_asin">ASIN (Amazon Standard Identification Number) *</label>
                <input type="text" id="hap_asin" name="hap_asin" value="<?php echo esc_attr( $asin ); ?>" placeholder="B08N1K3N2X" required />
                <p class="description">Find ASIN on Amazon product page under "Product Information" or in the URL.</p>
            </div>

            <div class="hap-field-row">
                <label for="hap_marketplace">Amazon Marketplace</label>
                <select id="hap_marketplace" name="hap_marketplace">
                    <option value="www.amazon.ca" <?php selected( $marketplace, 'www.amazon.ca' ); ?>>Amazon Canada (.ca)</option>
                    <option value="www.amazon.com" <?php selected( $marketplace, 'www.amazon.com' ); ?>>Amazon US (.com)</option>
                    <option value="www.amazon.co.uk" <?php selected( $marketplace, 'www.amazon.co.uk' ); ?>>Amazon UK (.co.uk)</option>
                    <option value="www.amazon.in" <?php selected( $marketplace, 'www.amazon.in' ); ?>>Amazon India (.in)</option>
                </select>
            </div>

            <div class="hap-field-row">
                <label for="hap_associate_tag">Associates Tag</label>
                <input type="text" id="hap_associate_tag" name="hap_associate_tag" value="<?php echo esc_attr( $associate_tag ); ?>" placeholder="yourtag-20" />
                <p class="description">Your Amazon Associates tag. Default: YOURTAG-20. Change to your real tag.</p>
            </div>

            <div class="hap-section-title">Display Options</div>

            <div class="hap-field-row">
                <label for="hap_price">Price (optional)</label>
                <input type="number" step="0.01" id="hap_price" name="hap_price" value="<?php echo esc_attr( $price ); ?>" placeholder="29.99" />
            </div>

            <div class="hap-field-row">
                <label for="hap_price_date">Price Date</label>
                <input type="text" id="hap_price_date" name="hap_price_date" value="<?php echo esc_attr( $price_date ); ?>" placeholder="<?php echo gmdate( 'Y-m-d' ); ?>" />
                <p class="description">Date price was last verified. Displayed as "Price as of [date]".</p>
            </div>

            <div class="hap-field-row">
                <label for="hap_button_text">Button Text</label>
                <input type="text" id="hap_button_text" name="hap_button_text" value="<?php echo esc_attr( $button_text ); ?>" placeholder="View on Amazon" />
            </div>

            <div class="hap-section-title">Product Image</div>
            <p class="description">Upload your own product image using the Featured Image panel on the right. Amazon product images cannot be used without the Product Advertising API.</p>

            <div class="hap-section-title">Shortcode</div>
            <?php if ( $post->ID ) : ?>
                <div class="hap-preview">
                    <p><strong>Single product:</strong></p>
                    <code>[affiliate_product id="<?php echo $post->ID; ?>"]</code>
                    <p style="margin-top:10px"><strong>Include in grid:</strong></p>
                    <code>[affiliate_products count="3"]</code>
                </div>
            <?php else : ?>
                <p class="description">Save the product first to get its shortcode.</p>
            <?php endif; ?>
        </div>
        <?php
    }
}

if ( ! function_exists( 'hap_save_meta' ) ) {
    function hap_save_meta( $post_id ) {
        if ( ! isset( $_POST['hap_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hap_nonce'] ) ), 'hap_product_details_nonce' ) ) {
            return;
        }

        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        $fields = array(
            'hap_asin'          => '_hap_asin',
            'hap_associate_tag' => '_hap_associate_tag',
            'hap_price'         => '_hap_price',
            'hap_price_date'    => '_hap_price_date',
            'hap_button_text'   => '_hap_button_text',
            'hap_marketplace'   => '_hap_marketplace',
        );

        foreach ( $fields as $field_name => $meta_key ) {
            if ( isset( $_POST[ $field_name ] ) ) {
                update_post_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $field_name ] ) ) );
            }
        }
    }
}
add_action( 'save_post_affiliate_product', 'hap_save_meta' );
