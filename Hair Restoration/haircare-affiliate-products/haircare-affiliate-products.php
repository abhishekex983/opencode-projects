<?php
/**
 * Plugin Name: Haircare Affiliate Products
 * Plugin URI: https://thinairgrowthguide.com
 * Description: Amazon Affiliate product shortcode plugin for haircare content. Display responsive product cards with affiliate links.
 * Version: 1.1.0
 * Author: Hair Restoration Team
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: haircare-affiliate
 * Domain Path: /languages
 * Requires PHP: 7.4
 * Requires at least: 5.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'HAP_VERSION', '1.1.0' );
define( 'HAP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HAP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once HAP_PLUGIN_DIR . 'includes/post-type.php';
require_once HAP_PLUGIN_DIR . 'includes/meta-boxes.php';
require_once HAP_PLUGIN_DIR . 'includes/shortcodes.php';
require_once HAP_PLUGIN_DIR . 'includes/widgets/featured-products.php';
require_once HAP_PLUGIN_DIR . 'includes/post-meta.php';
require_once HAP_PLUGIN_DIR . 'includes/settings.php';

if ( ! function_exists( 'hap_register_widgets' ) ) {
    function hap_register_widgets() {
        register_widget( 'HAP_Featured_Products_Widget' );
    }
}
add_action( 'widgets_init', 'hap_register_widgets' );

if ( ! function_exists( 'hap_activate' ) ) {
    function hap_activate() {
        flush_rewrite_rules();
    }
}

if ( ! function_exists( 'hap_deactivate' ) ) {
    function hap_deactivate() {
        flush_rewrite_rules();
    }
}

register_activation_hook( __FILE__, 'hap_activate' );
register_deactivation_hook( __FILE__, 'hap_deactivate' );

if ( ! function_exists( 'hap_enqueue_styles' ) ) {
    function hap_enqueue_styles() {
        wp_enqueue_style(
            'hap-affiliate-products',
            HAP_PLUGIN_URL . 'assets/css/affiliate-products.css',
            array(),
            HAP_VERSION
        );
    }
}
add_action( 'wp_enqueue_scripts', 'hap_enqueue_styles' );

if ( ! function_exists( 'hap_admin_styles' ) ) {
    function hap_admin_styles( $hook ) {
        global $post_type;
        $current_post_type = $post_type;
        if ( empty( $current_post_type ) && function_exists( 'get_post_type' ) ) {
            $current_post_type = get_post_type();
        }
        if ( 'affiliate_product' === $current_post_type ) {
            wp_enqueue_style(
                'hap-admin',
                HAP_PLUGIN_URL . 'assets/css/affiliate-products.css',
                array(),
                HAP_VERSION
            );
        }
    }
}
add_action( 'admin_enqueue_scripts', 'hap_admin_styles' );
