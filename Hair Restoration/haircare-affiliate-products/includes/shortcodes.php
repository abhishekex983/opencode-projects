<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'hap_build_affiliate_url' ) ) {
    function hap_build_affiliate_url( $post_id ) {
        $asin          = get_post_meta( $post_id, '_hap_asin', true );
        $associate_tag = get_post_meta( $post_id, '_hap_associate_tag', true );
        $marketplace   = get_post_meta( $post_id, '_hap_marketplace', true );

        if ( empty( $asin ) ) {
            return '#';
        }

        if ( empty( $associate_tag ) ) {
            $associate_tag = 'YOURTAG-20';
        }

        if ( empty( $marketplace ) ) {
            $marketplace = 'www.amazon.ca';
        }

        $url = 'https://' . $marketplace . '/dp/' . rawurlencode( $asin ) . '?tag=' . rawurlencode( $associate_tag );

        $tsid = get_option( 'hap_geniuslink_tsid', '' );
        if ( ! empty( $tsid ) ) {
            $url = 'https://buy.geni.us/Proxy.ashx?tsid=' . rawurlencode( $tsid ) . '&GR_URL=' . rawurlencode( $url );
        }

        return $url;
    }
}

if ( ! function_exists( 'hap_format_price' ) ) {
    function hap_format_price( $price ) {
        if ( empty( $price ) || ! is_numeric( $price ) ) {
            return '';
        }
        return number_format( (float) $price, 2 );
    }
}

if ( ! function_exists( 'hap_format_date' ) ) {
    function hap_format_date( $date_string ) {
        if ( empty( $date_string ) ) {
            return '';
        }
        $timestamp = strtotime( $date_string );
        if ( false === $timestamp ) {
            return '';
        }
        return gmdate( 'M j, Y', $timestamp );
    }
}

if ( ! function_exists( 'hap_render_product_card' ) ) {
    function hap_render_product_card( $post_id ) {
        $post = get_post( $post_id );
        if ( ! $post || 'affiliate_product' !== $post->post_type ) {
            return '';
        }

        $title        = get_the_title( $post_id );
        $raw_desc     = has_excerpt( $post_id ) ? get_the_excerpt( $post_id ) : wp_trim_words( $post->post_content, 25 );
        $description  = is_string( $raw_desc ) ? $raw_desc : '';
        $url          = hap_build_affiliate_url( $post_id );
        $price        = get_post_meta( $post_id, '_hap_price', true );
        $price_date   = get_post_meta( $post_id, '_hap_price_date', true );
        $button_text  = get_post_meta( $post_id, '_hap_button_text', true );
        $has_image    = has_post_thumbnail( $post_id );
        $image_url    = $has_image ? get_the_post_thumbnail_url( $post_id, 'medium' ) : '';
        $image_html   = $has_image
            ? '<div class="hap-product-image-wrap"><img src="' . esc_url( $image_url ) . '" alt="' . esc_attr( $title ) . '" loading="lazy" /></div>'
            : '<div class="hap-product-image-wrap hap-no-image"><span class="hap-no-image-icon">&#128230;</span></div>';

        if ( empty( $button_text ) ) {
            $button_text = 'View on Amazon';
        }

        $formatted_price     = hap_format_price( $price );
        $formatted_price_date = hap_format_date( $price_date );

        ob_start();
        ?>
        <div class="hap-product-card">
            <?php echo $image_html; ?>
            <div class="hap-product-body">
                <h3 class="hap-product-title"><?php echo esc_html( $title ); ?></h3>
                <?php if ( ! empty( $description ) ) : ?>
                    <p class="hap-product-description"><?php echo esc_html( $description ); ?></p>
                <?php endif; ?>
                <?php if ( ! empty( $formatted_price ) ) : ?>
                    <div class="hap-product-price">
                        <span class="hap-price-value">$<?php echo esc_html( $formatted_price ); ?></span>
                        <?php if ( ! empty( $formatted_price_date ) ) : ?>
                            <span class="hap-price-date">Price as of <?php echo esc_html( $formatted_price_date ); ?></span>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                <a href="<?php echo esc_url( $url ); ?>"
                   class="hap-product-button"
                   target="_blank"
                   rel="noopener sponsored nofollow"
                   aria-label="<?php echo esc_attr( $button_text . ' - ' . $title ); ?>">
                    <?php echo esc_html( $button_text ); ?>
                </a>
                <p class="hap-affiliate-disclosure">Affiliate Link</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

if ( ! function_exists( 'hap_single_product_shortcode' ) ) {
    function hap_single_product_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'id' => 0,
        ), $atts, 'affiliate_product' );

        $post_id = absint( $atts['id'] );
        if ( ! $post_id ) {
            return '';
        }

        wp_enqueue_style( 'hap-affiliate-products' );

        $disclosure = '<p class="hap-global-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>';
        return $disclosure . '<div class="hap-single-product-wrap">' . hap_render_product_card( $post_id ) . '</div>';
    }
}
add_shortcode( 'affiliate_product', 'hap_single_product_shortcode' );

if ( ! function_exists( 'hap_products_grid_shortcode' ) ) {
    function hap_products_grid_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'count'    => 3,
            'category' => '',
            'orderby'  => 'date',
            'order'    => 'DESC',
            'ids'      => '',
        ), $atts, 'affiliate_products' );

        wp_enqueue_style( 'hap-affiliate-products' );

        if ( ! empty( $atts['ids'] ) ) {
            $ids = array_map( 'absint', array_filter( explode( ',', $atts['ids'] ) ) );
            if ( empty( $ids ) ) {
                return '<p class="hap-no-products">No affiliate products found.</p>';
            }
            $args = array(
                'post_type'      => 'affiliate_product',
                'post__in'       => $ids,
                'posts_per_page' => count( $ids ),
                'orderby'        => 'post__in',
                'post_status'    => 'publish',
            );
        } else {
            $args = array(
                'post_type'      => 'affiliate_product',
                'posts_per_page' => absint( $atts['count'] ),
                'orderby'        => sanitize_text_field( $atts['orderby'] ),
                'order'          => sanitize_text_field( $atts['order'] ),
                'post_status'    => 'publish',
            );

            if ( ! empty( $atts['category'] ) ) {
                $args['tax_query'] = array(
                    array(
                        'taxonomy' => 'product_category',
                        'field'    => 'slug',
                        'terms'    => sanitize_text_field( $atts['category'] ),
                    ),
                );
            }
        }

        $query = new WP_Query( $args );

        if ( ! $query->have_posts() ) {
            wp_reset_postdata();
            return '<p class="hap-no-products">No affiliate products found.</p>';
        }

        ob_start();
        ?>
        <p class="hap-global-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
        <div class="hap-products-grid">
            <?php while ( $query->have_posts() ) : $query->the_post(); ?>
                <?php echo hap_render_product_card( get_the_ID() ); ?>
            <?php endwhile; ?>
        </div>
        <?php
        wp_reset_postdata();

        return ob_get_clean();
    }
}
add_shortcode( 'affiliate_products', 'hap_products_grid_shortcode' );
