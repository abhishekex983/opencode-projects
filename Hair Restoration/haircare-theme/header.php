<?php
/**
 * The header for the Haircare theme
 *
 * @package Haircare
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="site-container">

<!-- Top Navigation -->
<nav class="site-nav" role="navigation" aria-label="<?php esc_attr_e( 'Primary Navigation', 'haircare' ); ?>">
    <div class="nav-inner">

        <!-- Brand / Logo -->
        <div class="nav-brand">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" class="nav-brand-link">
                <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/08/Thin-Hair-Growth-Guide.png" alt="<?php bloginfo('name'); ?> Logo" class="nav-brand-icon nav-brand-icon--image">
            </a>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="nav-toggle" id="nav-toggle" aria-controls="nav-links" aria-expanded="false" aria-label="<?php esc_attr_e( 'Toggle navigation', 'haircare' ); ?>">
            <span class="material-symbols-outlined">menu</span>
        </button>

        <!-- Primary Navigation -->
        <div class="nav-links" id="nav-links">
            <?php
            wp_nav_menu( array(
                'theme_location' => 'primary',
                'menu_class'     => 'nav-menu',
                'container'      => false,
                'depth'          => 1,
                'fallback_cb'    => 'haircare_fallback_menu',
            ) );
            ?>
        </div>

        <!-- Actions -->
        <div class="nav-actions">
            <a href="https://www.youtube.com/@ThinHairGrowthGuide" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'YouTube', 'haircare' ); ?>" class="nav-social-link">
                <span class="material-symbols-outlined">smart_display</span>
            </a>
            <a href="https://ca.pinterest.com/thinhairgrowthguide/" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Pinterest', 'haircare' ); ?>" class="nav-social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
            </a>
            <button class="nav-search" aria-label="<?php esc_attr_e( 'Search', 'haircare' ); ?>">
                <span class="material-symbols-outlined">search</span>
            </button>
        </div>

    </div>
</nav>

<?php
/**
 * Fallback menu when no menu is assigned.
 * Shows a default set of links matching the existing site structure.
 */
function haircare_fallback_menu() {
    echo '<ul class="nav-menu">';
    echo '<li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Home', 'haircare' ) . '</a></li>';
    echo '<li><a href="' . esc_url( home_url( '/treatments' ) ) . '">' . esc_html__( 'Treatments', 'haircare' ) . '</a></li>';
    echo '<li><a href="' . esc_url( home_url( '/transplants' ) ) . '">' . esc_html__( 'Transplants', 'haircare' ) . '</a></li>';
    echo '<li><a href="' . esc_url( home_url( '/tips' ) ) . '">' . esc_html__( 'Tips', 'haircare' ) . '</a></li>';
    echo '<li><a href="' . esc_url( home_url( '/success-stories' ) ) . '">' . esc_html__( 'Success Stories', 'haircare' ) . '</a></li>';
    echo '<li><a href="' . esc_url( home_url( '/about' ) ) . '">' . esc_html__( 'About', 'haircare' ) . '</a></li>';
    echo '</ul>';
}
?>
