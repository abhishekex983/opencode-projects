<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'hap_register_post_type' ) ) {
    function hap_register_post_type() {
        $labels = array(
            'name'               => 'Affiliate Products',
            'singular_name'      => 'Affiliate Product',
            'menu_name'          => 'Affiliate Products',
            'add_new'            => 'Add New Product',
            'add_new_item'       => 'Add New Affiliate Product',
            'edit_item'          => 'Edit Affiliate Product',
            'new_item'           => 'New Affiliate Product',
            'view_item'          => 'View Affiliate Product',
            'search_items'       => 'Search Affiliate Products',
            'not_found'          => 'No affiliate products found',
            'not_found_in_trash' => 'No affiliate products found in trash',
            'all_items'          => 'All Affiliate Products',
        );

        $args = array(
            'labels'              => $labels,
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => true,
            'menu_position'       => 25,
            'menu_icon'           => 'dashicons-cart',
            'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
            'has_archive'         => false,
            'rewrite'             => false,
            'query_var'           => false,
            'capability_type'     => 'post',
            'show_in_rest'        => true,
        );

        register_post_type( 'affiliate_product', $args );
    }
}
add_action( 'init', 'hap_register_post_type' );

if ( ! function_exists( 'hap_register_taxonomy' ) ) {
    function hap_register_taxonomy() {
        $labels = array(
            'name'          => 'Product Categories',
            'singular_name' => 'Product Category',
            'search_items'  => 'Search Product Categories',
            'all_items'     => 'All Product Categories',
            'edit_item'     => 'Edit Product Category',
            'add_new_item'  => 'Add New Product Category',
        );

        $args = array(
            'labels'            => $labels,
            'hierarchical'      => true,
            'public'            => false,
            'show_ui'           => true,
            'show_in_rest'      => true,
            'show_admin_column' => true,
            'rewrite'           => false,
            'query_var'         => false,
        );

        register_taxonomy( 'product_category', 'affiliate_product', $args );
    }
}
add_action( 'init', 'hap_register_taxonomy' );
