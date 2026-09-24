<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'hap_register_sidebar_meta_box' ) ) {
    function hap_register_sidebar_meta_box() {
        add_meta_box(
            'hap_sidebar_products',
            __( 'Sidebar Products', 'haircare-affiliate' ),
            'hap_sidebar_products_meta_box_callback',
            'post',
            'normal',
            'high'
        );
    }
}
add_action( 'add_meta_boxes', 'hap_register_sidebar_meta_box' );

if ( ! function_exists( 'hap_sidebar_products_meta_box_callback' ) ) {
    function hap_sidebar_products_meta_box_callback( $post ) {
        wp_nonce_field( 'hap_sidebar_products_nonce', 'hap_sidebar_products_nonce_field' );

        $selected_ids = get_post_meta( $post->ID, '_hap_sidebar_products', true );
        if ( ! is_array( $selected_ids ) ) {
            $selected_ids = array();
        }

        $products = get_posts( array(
            'post_type'      => 'affiliate_product',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
            'orderby'        => 'title',
            'order'          => 'ASC',
        ) );
        ?>
        <p class="description"><?php esc_html_e( 'Select products to show in this post\'s sidebar. Leave empty to show the latest 3.', 'haircare-affiliate' ); ?></p>
        <div style="max-height:250px; overflow-y:auto; border:1px solid #ccc; padding:8px; border-radius:4px; background:#fff; margin-top:8px;">
            <?php if ( empty( $products ) ) : ?>
                <p style="color:#666; font-style:italic; margin:0;"><?php esc_html_e( 'No affiliate products found. Create some first.', 'haircare-affiliate' ); ?></p>
            <?php else : ?>
                <?php foreach ( $products as $product ) : ?>
                    <label style="display:flex; align-items:center; gap:8px; padding:4px 0; cursor:pointer;">
                        <input type="checkbox"
                               name="hap_sidebar_products[]"
                               value="<?php echo esc_attr( $product->ID ); ?>"
                               <?php checked( in_array( $product->ID, $selected_ids, true ) ); ?> />
                        <span style="flex:1; font-size:13px;"><?php echo esc_html( $product->post_title ); ?></span>
                    </label>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        <?php
    }
}

if ( ! function_exists( 'hap_save_sidebar_products_meta' ) ) {
    function hap_save_sidebar_products_meta( $post_id ) {
        if ( ! isset( $_POST['hap_sidebar_products_nonce_field'] ) ) {
            return;
        }
        if ( ! wp_verify_nonce( $_POST['hap_sidebar_products_nonce_field'], 'hap_sidebar_products_nonce' ) ) {
            return;
        }
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }
        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        $selected = array();
        if ( ! empty( $_POST['hap_sidebar_products'] ) && is_array( $_POST['hap_sidebar_products'] ) ) {
            $selected = array_map( 'absint', $_POST['hap_sidebar_products'] );
            $selected = array_filter( $selected );
        }

        update_post_meta( $post_id, '_hap_sidebar_products', $selected );
    }
}
add_action( 'save_post', 'hap_save_sidebar_products_meta' );
