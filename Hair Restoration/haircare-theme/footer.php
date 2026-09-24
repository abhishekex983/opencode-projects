<?php
/**
 * The footer for the Haircare theme
 *
 * @package Haircare
 */
?>

<!-- Footer -->
<footer class="site-footer">
    <div class="footer-main">

        <!-- Brand Column -->
        <div>
            <div class="footer-brand">
                <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/08/Thin-Hair-Growth-Guide.png" alt="<?php bloginfo('name'); ?> Logo" class="nav-brand-icon nav-brand-icon--image">
            </div>
            <p class="footer-description">
                <?php echo esc_html( get_bloginfo( 'description' ) ?: 'I\'m someone who has personally experienced the challenges of male pattern baldness and understands how frustrating hair loss can be. Through this blog, I share the insights I\'ve gained, along with honest thoughts on the products and approaches I\'ve used in my own hair regrowth journey. I hope you find these articles informative and helpful as you work toward your own hair goals.' ); ?>
            </p>
            <div class="footer-social">
                <a href="https://www.youtube.com/@ThinHairGrowthGuide" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'YouTube', 'haircare' ); ?>">
                    <span class="material-symbols-outlined">smart_display</span>
                </a>
                <a href="mailto:thinhairgrowthguide@gmail.com" aria-label="<?php esc_attr_e( 'Email', 'haircare' ); ?>">
                    <span class="material-symbols-outlined">mail</span>
                </a>
                <a href="https://ca.pinterest.com/thinhairgrowthguide/" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Pinterest', 'haircare' ); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                    </svg>
                </a>
            </div>
        </div>

        <!-- Footer Widgets (or fallback links) -->
        <?php if ( is_active_sidebar( 'footer-2' ) ) : ?>
            <div>
                <?php dynamic_sidebar( 'footer-2' ); ?>
            </div>
        <?php else : ?>
            <div>
                <h4 class="footer-heading"><?php esc_html_e( 'Recent Posts', 'haircare' ); ?></h4>
                <ul class="footer-links footer-recent-posts">
                    <?php
                    $recent_posts = new WP_Query( array(
                        'posts_per_page' => 4,
                        'post_status'    => 'publish',
                    ) );
                    if ( $recent_posts->have_posts() ) :
                        while ( $recent_posts->have_posts() ) : $recent_posts->the_post();
                    ?>
                    <li>
                        <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        <span class="footer-recent-date"><?php echo get_the_date( 'M j' ); ?></span>
                    </li>
                    <?php
                        endwhile;
                        wp_reset_postdata();
                    endif;
                    ?>
                </ul>
            </div>
        <?php endif; ?>

    </div>

    <!-- Copyright Bar -->
    <div class="footer-bottom">
        <div class="footer-bottom-inner">
            <span class="footer-copyright">
                &copy; <?php echo date( 'Y' ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'haircare' ); ?>
            </span>
            <a href="https://drive.google.com/file/d/1NJ2qXBPan-Zl0xrECDf7BmMB7Dj3oM7Q/view" target="_blank" rel="noopener noreferrer" class="footer-cert-link">
                <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/09/Certificate.png" alt="View certification" class="footer-cert-icon" width="16" height="16">
                View certification
            </a>
            <div class="footer-legal">
                <a href="<?php echo esc_url( home_url( '/privacy-policy' ) ); ?>"><?php esc_html_e( 'Privacy Policy', 'haircare' ); ?></a>
                <a href="<?php echo esc_url( home_url( '/terms-of-service' ) ); ?>"><?php esc_html_e( 'Terms of Service', 'haircare' ); ?></a>
            </div>
        </div>
    </div>
</footer>

</div><!-- .site-container -->

<?php wp_footer(); ?>

</body>
</html>
