<?php
/**
 * The sidebar for the Haircare theme
 *
 * @package Haircare
 */

if ( ! is_active_sidebar( 'sidebar-blog' ) ) {
    return;
}
?>

<aside class="blog-sidebar" role="complementary" aria-label="<?php esc_attr_e( 'Blog Sidebar', 'haircare' ); ?>">
    <?php dynamic_sidebar( 'sidebar-blog' ); ?>
</aside>
