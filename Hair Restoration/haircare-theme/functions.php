<?php
/**
 * Haircare Theme Functions
 *
 * @package Haircare
 * @version 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Theme Setup
 * Registers theme supports, menus, and image sizes.
 */
function haircare_setup() {
    // Add default posts and comments RSS feed links to head
    add_theme_support( 'automatic-feed-links' );

    // Let WordPress manage the document title
    add_theme_support( 'title-tag' );

    // Enable support for Post Thumbnails on posts and pages
    add_theme_support( 'post-thumbnails' );

    // Custom image sizes
    add_image_size( 'haircare-featured', 1200, 630, true );
    add_image_size( 'haircare-card', 600, 450, true );
    add_image_size( 'haircare-thumbnail', 200, 200, true );

    // Register navigation menus
    register_nav_menus( array(
        'primary'   => esc_html__( 'Primary Menu', 'haircare' ),
        'footer'    => esc_html__( 'Footer Menu', 'haircare' ),
    ) );

    // HTML5 support
    add_theme_support( 'html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ) );

    // Custom logo support
    add_theme_support( 'custom-logo', array(
        'height'      => 80,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ) );
}
add_action( 'after_setup_theme', 'haircare_setup' );

/**
 * Enqueue Styles and Scripts
 */
function haircare_scripts() {
    // Google Fonts: Plus Jakarta Sans, Inter, JetBrains Mono
    wp_enqueue_style(
        'haircare-google-fonts',
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap',
        array(),
        null
    );

    // Material Symbols
    wp_enqueue_style(
        'haircare-material-symbols',
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
        array(),
        null
    );

    // Main stylesheet
    wp_enqueue_style(
        'haircare-style',
        get_stylesheet_uri(),
        array( 'haircare-google-fonts', 'haircare-material-symbols' ),
        wp_get_theme()->get( 'Version' )
    );

    // Mobile menu script
    wp_enqueue_script(
        'haircare-navigation',
        get_template_directory_uri() . '/assets/js/navigation.js',
        array(),
        wp_get_theme()->get( 'Version' ),
        true
    );

    // Homepage script (front page only)
    if ( is_front_page() ) {
        wp_enqueue_script(
            'haircare-homepage',
            get_template_directory_uri() . '/assets/js/homepage.js',
            array(),
            wp_get_theme()->get( 'Version' ),
            true
        );
    }

    // Blog post styles (single posts only)
    if ( is_single() ) {
        wp_enqueue_style(
            'haircare-blog',
            get_template_directory_uri() . '/assets/css/blog.css',
            array( 'haircare-style' ),
            wp_get_theme()->get( 'Version' )
        );
    }
}
add_action( 'wp_enqueue_scripts', 'haircare_scripts' );

/**
 * Register Widget Areas
 */
function haircare_widgets_init() {
    register_sidebar( array(
        'name'          => esc_html__( 'Blog Sidebar', 'haircare' ),
        'id'            => 'sidebar-blog',
        'description'   => esc_html__( 'Widgets for the blog sidebar.', 'haircare' ),
        'before_widget' => '<div id="%1$s" class="sidebar-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="sidebar-widget-heading">',
        'after_title'   => '</h3>',
    ) );
}
add_action( 'widgets_init', 'haircare_widgets_init' );

/**
 * Custom Excerpt Length
 */
function haircare_excerpt_length( $length ) {
    return 25;
}
add_filter( 'excerpt_length', 'haircare_excerpt_length', 999 );

/**
 * Custom Excerpt More
 */
function haircare_excerpt_more( $more ) {
    return '&hellip;';
}
add_filter( 'excerpt_more', 'haircare_excerpt_more' );

/**
 * Add a pingback url auto-discovery header for single posts, pages, or attachments.
 */
function haircare_pingback_header() {
    if ( is_singular() && pings_open() ) {
        printf( '<link rel="pingback" href="%s">', esc_url( get_bloginfo( 'pingback_url' ) ) );
    }
}
add_action( 'wp_head', 'haircare_pingback_header' );

/**
 * Fetch latest YouTube Shorts for the channel.
 * Uses YouTube Data API v3 with 1-hour transient cache.
 *
 * @param int $count Number of shorts to fetch.
 * @return array Array of [ id, title, thumbnail ] arrays.
 */
function haircare_get_youtube_shorts( $count = 3 ) {
    $cache_key = 'haircare_youtube_shorts';
    $cached = get_transient( $cache_key );
    if ( false !== $cached ) {
        return $cached;
    }

    $api_key = defined( 'YOUTUBE_API_KEY' ) ? YOUTUBE_API_KEY : 'AIzaSyAtamSE10CEoNckveTQBhwKUjmiVO9hAxc';
    if ( empty( $api_key ) ) {
        return array();
    }

    $channel_id = 'UCe1OZgZZQ-X-wJ8rbeZBySg';
    $url = add_query_arg( array(
        'key'            => $api_key,
        'channelId'      => $channel_id,
        'part'           => 'snippet',
        'type'           => 'video',
        'videoDuration'  => 'short',
        'order'          => 'date',
        'maxResults'     => $count,
    ), 'https://www.googleapis.com/youtube/v3/search' );

    $response = wp_remote_get( $url, array( 'timeout' => 10 ) );

    if ( is_wp_error( $response ) ) {
        return array();
    }

    $code = wp_remote_retrieve_response_code( $response );
    if ( 200 !== $code ) {
        return array();
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( empty( $body['items'] ) ) {
        return array();
    }

    $shorts = array();
    foreach ( $body['items'] as $item ) {
        $video_id = $item['id']['videoId'];
        $title    = $item['snippet']['title'];
        $thumb    = $item['snippet']['thumbnails']['high']['url']
                    ?? $item['snippet']['thumbnails']['medium']['url']
                    ?? $item['snippet']['thumbnails']['default']['url']
                    ?? '';

        $shorts[] = array(
            'id'        => $video_id,
            'title'     => $title,
            'thumbnail' => $thumb,
        );
    }

    set_transient( $cache_key, $shorts, HOUR_IN_SECONDS );

    return $shorts;
}
