<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'hap_register_settings_page' ) ) {
    function hap_register_settings_page() {
        add_options_page(
            __( 'Affiliate Products', 'haircare-affiliate' ),
            __( 'Affiliate Products', 'haircare-affiliate' ),
            'manage_options',
            'hap-affiliate-settings',
            'hap_render_settings_page'
        );
    }
}
add_action( 'admin_menu', 'hap_register_settings_page' );

if ( ! function_exists( 'hap_register_settings' ) ) {
    function hap_register_settings() {
        register_setting( 'hap_affiliate_settings', 'hap_geniuslink_tsid', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ) );
    }
}
add_action( 'admin_init', 'hap_register_settings' );

if ( ! function_exists( 'hap_render_settings_page' ) ) {
    function hap_render_settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Affiliate Products Settings', 'haircare-affiliate' ); ?></h1>

            <form method="post" action="options.php">
                <?php
                settings_fields( 'hap_affiliate_settings' );
                do_settings_sections( 'hap-affiliate-settings' );
                submit_button();
                ?>
            </form>

            <hr />

            <h2><?php esc_html_e( 'Shortcode Reference', 'haircare-affiliate' ); ?></h2>
            <table class="widefat fixed" style="max-width:600px;">
                <thead>
                    <tr>
                        <th><?php esc_html_e( 'Shortcode', 'haircare-affiliate' ); ?></th>
                        <th><?php esc_html_e( 'Description', 'haircare-affiliate' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>[affiliate_product id="123"]</code></td>
                        <td><?php esc_html_e( 'Display a single product card by post ID.', 'haircare-affiliate' ); ?></td>
                    </tr>
                    <tr>
                        <td><code>[affiliate_products count="3"]</code></td>
                        <td><?php esc_html_e( 'Display latest N products in a grid.', 'haircare-affiliate' ); ?></td>
                    </tr>
                    <tr>
                        <td><code>[affiliate_products ids="1,2,3"]</code></td>
                        <td><?php esc_html_e( 'Display specific products by ID.', 'haircare-affiliate' ); ?></td>
                    </tr>
                    <tr>
                        <td><code>[affiliate_products category="shampoo"]</code></td>
                        <td><?php esc_html_e( 'Display products filtered by category.', 'haircare-affiliate' ); ?></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <?php
    }
}

if ( ! function_exists( 'hap_render_tsid_field' ) ) {
    function hap_render_tsid_field() {
        $tsid = get_option( 'hap_geniuslink_tsid', '' );
        ?>
        <input type="text"
               id="hap_geniuslink_tsid"
               name="hap_geniuslink_tsid"
               value="<?php echo esc_attr( $tsid ); ?>"
               class="regular-text"
               placeholder="e.g. A1B2C3D4" />
        <p class="description">
            <?php esc_html_e( 'Your Genius Link TSID (Tracking Script ID). Found on the Groups page at', 'haircare-affiliate' ); ?>
            <a href="https://my.geni.us/groups" target="_blank" rel="noopener">my.geni.us/groups</a>.
            <?php esc_html_e( 'Leave empty to disable Genius Links and use direct Amazon URLs.', 'haircare-affiliate' ); ?>
        </p>
        <?php
    }
}
add_action( 'hap_affiliate_settings_section', 'hap_render_tsid_field' );

if ( ! function_exists( 'hap_add_settings_section' ) ) {
    function hap_add_settings_section() {
        add_settings_section(
            'hap_geniuslink_section',
            __( 'Genius Links', 'haircare-affiliate' ),
            function () {
                echo '<p>' . esc_html__( 'Connect your Genius Links account to automatically route affiliate links through their service for localization and tracking.', 'haircare-affiliate' ) . '</p>';
            },
            'hap-affiliate-settings'
        );

        add_settings_field(
            'hap_geniuslink_tsid',
            __( 'TSID', 'haircare-affiliate' ),
            'hap_render_tsid_field',
            'hap-affiliate-settings',
            'hap_geniuslink_section'
        );
    }
}
add_action( 'admin_init', 'hap_add_settings_section' );
