<?php
/**
 * The single post template for the Haircare theme
 *
 * Displays a background hero with featured image and overlay,
 * title on top, article content with sidebar, and CTA button.
 *
 * @package Haircare
 */

get_header();
?>

<main class="site-content" id="primary">

    <?php while ( have_posts() ) : the_post();

    // Calculate read time from word count
    $content     = get_the_content();
    $word_count  = str_word_count( strip_tags( $content ) );
    $read_time   = max( 1, ceil( $word_count / 200 ) );

    // Get first category
    $categories  = get_the_category();
    $category    = ! empty( $categories ) ? $categories[0] : null;
    ?>

    <!-- Hero Section: Background Image + Overlay + Title -->
    <section class="single-hero">
        <?php if ( has_post_thumbnail() ) : ?>
            <?php the_post_thumbnail( 'haircare-featured', array(
                'class'   => 'single-hero-bg',
                'loading' => 'eager',
            ) ); ?>
        <?php else : ?>
            <img src="https://picsum.photos/1200/630?random=<?php echo esc_attr( get_the_ID() ); ?>" alt="" class="single-hero-bg">
        <?php endif; ?>

        <div class="single-hero-overlay"></div>

        <div class="single-hero-content">
            <div class="container">
                <?php if ( $category ) : ?>
                <a href="<?php echo esc_url( get_category_link( $category->term_id ) ); ?>" class="tag tag-primary single-hero-tag">
                    <?php echo esc_html( $category->name ); ?>
                </a>
                <?php endif; ?>

                <h1 class="single-hero-title"><?php the_title(); ?></h1>

                <div class="single-hero-meta">
                    <a href="#author-bio" class="single-hero-author">
                        <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/08/Abhishek-Bolar-Certified-Hair-Care-Writer.png" alt="<?php echo esc_attr( get_the_author_meta( 'display_name' ) ); ?>" class="single-hero-avatar" width="96" height="96">
                        <div class="single-hero-author-info">
                            <div class="single-hero-author-name">
                                <?php
                                    $first_name = get_the_author_meta( 'first_name' );
                                    $last_name  = get_the_author_meta( 'last_name' );
                                    echo esc_html( trim( $first_name . ' ' . $last_name ) );
                                ?>
                                <span class="material-symbols-outlined">expand_more</span>
                            </div>
                            <p class="single-hero-author-bio">Certified Hair Care Writer</p>
                            <?php if ( get_the_modified_date( 'U' ) > get_the_date( 'U' ) ) : ?>
                            <span class="single-hero-updated-inline">
                                <span class="material-symbols-outlined">refresh</span>
                                Updated <?php echo get_the_modified_date( 'M j, Y' ); ?>
                            </span>
                            <?php endif; ?>
                        </div>
                    </a>

                    <div class="single-hero-divider"></div>

                    <div class="single-hero-stats">
                        <span class="single-hero-stat">
                            <span class="material-symbols-outlined">calendar_today</span>
                            <?php echo get_the_date( 'F j, Y' ); ?>
                        </span>
                        <span class="single-hero-stat">
                            <span class="material-symbols-outlined">schedule</span>
                            <?php echo esc_html( $read_time ); ?> min read
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Content Grid -->
    <section class="single-content-section">
        <div class="container">
            <div class="single-grid">

                <!-- Article Body -->
                <article class="single-article article-body" id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <?php the_content(); ?>

                    <!-- Author Bio -->
                    <div class="author-bio" id="author-bio">
                        <div class="author-bio-image">
                            <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/08/Abhishek-Bolar-Certified-Hair-Care-Writer.png" alt="<?php echo esc_attr( get_the_author_meta( 'display_name' ) ); ?>" class="author-bio-img" width="400" height="400">
                        </div>
                        <div class="author-bio-card">
                            <h4 class="author-bio-name"><?php
                                $first_name = get_the_author_meta( 'first_name' );
                                $last_name = get_the_author_meta( 'last_name' );
                                echo esc_html( trim( $first_name . ' ' . $last_name ) );
                            ?></h4>
                            <span class="author-bio-title">
                                Certified Hair Care Writer
                                <a href="https://drive.google.com/file/d/1NJ2qXBPan-Zl0xrECDf7BmMB7Dj3oM7Q/view" target="_blank" rel="noopener noreferrer">
                                    <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/09/Certificate.png" alt="View certification" class="cert-icon" width="20" height="20">
                                </a>
                            </span>
                            <?php if ( get_the_author_meta( 'description' ) ) : ?>
                                <p class="author-bio-text"><?php echo esc_html( get_the_author_meta( 'description' ) ); ?></p>
                            <?php endif; ?>
                        </div>
                    </div>
                </article>

                <!-- Sidebar -->
                <aside class="single-sidebar" id="hap-products">
                    <div class="hap-featured-products-widget">
                        <h3 class="sidebar-products-heading">Products I Use &amp; Recommend</h3>
                        <?php
                        $sidebar_products = get_post_meta( get_the_ID(), '_hap_sidebar_products', true );
                        if ( ! empty( $sidebar_products ) && is_array( $sidebar_products ) ) {
                            $ids_csv = implode( ',', array_map( 'absint', $sidebar_products ) );
                            echo do_shortcode( '[affiliate_products ids="' . esc_attr( $ids_csv ) . '"]' );
                        } else {
                            echo do_shortcode( '[affiliate_products count="3"]' );
                        }
                        ?>
                    </div>
                </aside>

            </div>
        </div>
    </section>

    <!-- Mobile CTA: Jump to Products -->
    <a href="#hap-products" class="hap-mobile-cta">
        <span class="material-symbols-outlined">shopping_bag</span>
        Shop Products from This Post
    </a>

    <?php endwhile; ?>

</main>

<?php
get_footer();
