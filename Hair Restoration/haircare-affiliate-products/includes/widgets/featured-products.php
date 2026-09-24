<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class HAP_Featured_Products_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'hap_featured_products',
            __( 'Featured Products (Affiliate)', 'haircare-affiliate' ),
            array(
                'description' => __( 'Display selected affiliate products in the sidebar.', 'haircare-affiliate' ),
                'classname'   => 'hap-featured-products-widget',
            )
        );
    }

    public function widget( $args, $instance ) {
        $title = ! empty( $instance['title'] ) ? $instance['title'] : __( 'Featured Products', 'haircare-affiliate' );
        $selected_ids = ! empty( $instance['product_ids'] ) ? $instance['product_ids'] : array();

        echo $args['before_widget'];

        echo $args['before_title'] . esc_html( $title ) . $args['after_title'];

        if ( ! empty( $selected_ids ) ) {
            $ids_csv = implode( ',', array_map( 'absint', $selected_ids ) );
            echo do_shortcode( '[affiliate_products ids="' . $ids_csv . '"]' );
        } else {
            echo '<p class="hap-no-products">No products selected.</p>';
        }

        echo $args['after_widget'];
    }

    public function form( $instance ) {
        $title        = ! empty( $instance['title'] ) ? $instance['title'] : __( 'Featured Products', 'haircare-affiliate' );
        $selected_ids = ! empty( $instance['product_ids'] ) ? $instance['product_ids'] : array();

        $products = get_posts( array(
            'post_type'      => 'affiliate_product',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
            'orderby'        => 'title',
            'order'          => 'ASC',
        ) );
        ?>
        <p>
            <label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'haircare-affiliate' ); ?></label>
            <input class="widefat"
                   id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
                   name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
                   type="text"
                   value="<?php echo esc_attr( $title ); ?>" />
        </p>
        <p>
            <label for="<?php echo esc_attr( $this->get_field_id( 'product_ids' ) ); ?>"><?php esc_html_e( 'Select Products:', 'haircare-affiliate' ); ?></label>
        </p>
        <div style="max-height:200px; overflow-y:auto; border:1px solid #ccc; padding:8px; border-radius:4px; background:#fff;">
            <?php if ( empty( $products ) ) : ?>
                <p style="color:#666; font-style:italic; margin:0;"><?php esc_html_e( 'No affiliate products found. Create some first.', 'haircare-affiliate' ); ?></p>
            <?php else : ?>
                <?php foreach ( $products as $product ) : ?>
                    <label style="display:flex; align-items:center; gap:8px; padding:4px 0; cursor:pointer;">
                        <input type="checkbox"
                               name="<?php echo esc_attr( $this->get_field_name( 'product_ids' ) ); ?>[]"
                               value="<?php echo esc_attr( $product->ID ); ?>"
                               <?php checked( in_array( $product->ID, $selected_ids, true ) ); ?> />
                        <span style="flex:1; font-size:13px;"><?php echo esc_html( $product->post_title ); ?></span>
                    </label>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        <?php
    }

    public function update( $new_instance, $old_instance ) {
        $instance                = array();
        $instance['title']       = sanitize_text_field( $new_instance['title'] );
        $instance['product_ids'] = array();

        if ( ! empty( $new_instance['product_ids'] ) && is_array( $new_instance['product_ids'] ) ) {
            $instance['product_ids'] = array_map( 'absint', $new_instance['product_ids'] );
            $instance['product_ids'] = array_filter( $instance['product_ids'] );
        }

        return $instance;
    }
}
