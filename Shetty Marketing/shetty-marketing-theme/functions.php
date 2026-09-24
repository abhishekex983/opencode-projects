<?php
/**
 * Shetty Marketing Theme — functions.php
 */

function shetty_enqueue_assets() {
    // Theme stylesheet
    wp_enqueue_style('shetty-style', get_stylesheet_uri(), array(), '1.0');

    // Google Fonts
    wp_enqueue_style(
        'shetty-fonts',
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap',
        array(),
        null
    );

    // JS (nav, tabs, lightbox, accordions, etc.)
    wp_enqueue_script('shetty-scripts', get_template_directory_uri() . '/portfolio.js', array(), '1.0', true);
}
add_action('wp_enqueue_scripts', 'shetty_enqueue_assets');
