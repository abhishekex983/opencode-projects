<?php
/**
 * Front Page Template
 *
 * Displays the homepage with hero section, category nav,
 * featured articles, and latest insights.
 *
 * @package Haircare
 */

get_header();
?>

<main class="site-content" id="primary">

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-inner">
            <div class="hero-grid">

                <!-- Left: Text -->
                <div class="hero-text">
                    <h1 class="hero-title">Bring your Hair back from the Dead</h1>
                    <p class="hero-subtitle">Hair thinning had been a nightmare for years. After ignoring the signs and losing more hair than I ever expected, I finally changed course. This blog shares everything that helped me regrow my hair—and what I wish I'd known sooner.</p>
                    <a href="https://thinhairgrowthguide.com/read-blogs/" class="hero-cta">
                        <?php esc_html_e( 'Read Blogs', 'haircare' ); ?>
                    </a>
                </div>

                <!-- Right: Before/After Slider -->
                <div class="hero-slider-wrap">
                    <div class="ba-slider" id="baSlider">
                        <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/07/How-to-Make-Thin-Hair-Thicker.png" alt="<?php esc_attr_e( 'After', 'haircare' ); ?>" draggable="false">
                        <div class="ba-before" id="baBefore" style="width: 50%;">
                            <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/07/My-bald-head-Male-pattern-Baldness-Before-using-Xyon-hair-gel.png" alt="<?php esc_attr_e( 'Before', 'haircare' ); ?>" draggable="false">
                        </div>
                        <div class="ba-handle" id="baHandle" style="left: 50%;">
                            <div class="ba-handle-circle"></div>
                        </div>
                        <div class="ba-label" style="left: 16px;"><?php esc_html_e( 'Before', 'haircare' ); ?></div>
                        <div class="ba-label" style="right: 16px;"><?php esc_html_e( 'After', 'haircare' ); ?></div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- Category Navigation -->
    <section class="category-nav">
        <div class="category-nav-inner">
            <div class="category-pills">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="category-pill active"><?php esc_html_e( 'All', 'haircare' ); ?></a>
                <?php
                $categories = get_categories( array(
                    'hide_empty' => true,
                    'exclude'    => 1,
                    'orderby'    => 'name',
                    'order'      => 'ASC',
                ) );

                foreach ( $categories as $category ) :
                ?>
                    <a href="<?php echo esc_url( get_category_link( $category->term_id ) ); ?>" class="category-pill">
                        <?php echo esc_html( $category->name ); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Featured Articles -->
    <section class="featured-section">
        <div class="container">
            <div class="featured-header">
                <span class="featured-label"><?php esc_html_e( 'Must Read', 'haircare' ); ?></span>
                <div class="featured-divider"></div>
            </div>

            <?php
            $featured_query = new WP_Query( array(
                'posts_per_page' => 3,
                'post_status'    => 'publish',
            ) );

            $featured_count = 0;

            if ( $featured_query->have_posts() ) :
                $featured_query->the_post();
                $featured_count = 1;
            ?>
            <div class="featured-grid">
                <!-- Large Card (First Post) -->
                <article class="featured-large">
                    <a href="<?php the_permalink(); ?>">
                        <div class="card-image">
                            <?php if ( has_post_thumbnail() ) : ?>
                                <?php the_post_thumbnail( 'haircare-featured' ); ?>
                            <?php else : ?>
                                <img src="https://picsum.photos/800/500?random=1" alt="<?php the_title_attribute(); ?>">
                            <?php endif; ?>
                            <span class="tag tag-primary card-tag"><?php echo get_the_category_list( ', ' ); ?></span>
                        </div>
                    </a>
                    <div class="featured-meta">
                        <span><?php echo get_the_date(); ?></span>
                        <span>&middot;</span>
                        <span><?php echo esc_html( get_the_author_meta( 'display_name' ) ); ?></span>
                    </div>
                    <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                    <p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 25 ) ); ?></p>
                </article>

                <!-- Side Cards (Next 2 Posts) -->
                <div class="featured-side">
                    <?php
                    while ( $featured_query->have_posts() ) :
                        $featured_query->the_post();
                        $featured_count++;
                    ?>
                    <article class="featured-side-card">
                        <a href="<?php the_permalink(); ?>">
                            <div class="card-image">
                                <?php if ( has_post_thumbnail() ) : ?>
                                    <?php the_post_thumbnail( 'haircare-card' ); ?>
                                <?php else : ?>
                                    <img src="https://picsum.photos/400/300?random=<?php echo esc_attr( get_the_ID() ); ?>" alt="<?php the_title_attribute(); ?>">
                                <?php endif; ?>
                            </div>
                        </a>
                        <div class="card-tag"><?php echo get_the_category_list( ', ' ); ?></div>
                        <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                    </article>
                    <?php endwhile; ?>
                </div>
            </div>
            <?php
            wp_reset_postdata();
            else :
            ?>
            <!-- Fallback: Static Featured Content -->
            <div class="featured-grid">
                <article class="featured-large">
                    <div class="card-image">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA70oScapd32SF80fAP-j_0RIritbyaeullTbUirKYaigQHP1sRY6rQpibt6lz2gqVwUde96ONIsd0lppI8O1cYkVk26U8ly4SDr_C_L3Zk1jlw5qRf71H1RkygE6RWav5w7fWW_4J_dhf44c1E2avF5tDpd1kIl41ii4UB9rSV4dQIGkEWVgjvYz_o2DAF60KyFEG4D08DWN7kdm11-btGq593Bg0BFYTmygnBC9lqJULb-aFmPvgfOVCC_T0CSe33jP50H5Mg7lc" alt="Hair follicles under microscope">
                        <span class="tag tag-primary card-tag"><?php esc_html_e( 'TREATMENTS', 'haircare' ); ?></span>
                    </div>
                    <div class="featured-meta">
                        <span><?php esc_html_e( 'Updated on March 15, 2025', 'haircare' ); ?></span>
                        <span>&middot;</span>
                        <span><?php esc_html_e( 'By Dr. Sarah Chen', 'haircare' ); ?></span>
                    </div>
                    <h2><a href="#"><?php esc_html_e( 'FUE vs FUT: Which Transplant Method Is Right for You?', 'haircare' ); ?></a></h2>
                    <p><?php esc_html_e( 'Understanding the fundamental differences between Follicular Unit Extraction and Follicular Unit Transplantation is the first step in your restoration journey.', 'haircare' ); ?></p>
                </article>

                <div class="featured-side">
                    <article class="featured-side-card">
                        <div class="card-image">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg6q_2k6h1ltvtdqpvlgz6oi551F5n__bQLBCBiWKUkiJbinlP31Xfk0AFadjhCV7OjHJ_cv5xRUG5OZ8kjhdnm4uisSsziC7nnoHU26bQqc1oidk6QVo3GS1V7eTbsMc1NAafSdfa7_ToPeS4IeAnQZjb14955EaIaZKGwacIhKqoy4y3Mb28FNPPHBDKDoIdH9AFlZ2Yj7ugOxp8OD-iYwp34SU-SbiRbFeMPGm024GrovJNfmy5v-z4jo1zoaAVWdKbAJc5ylw" alt="Hair care products">
                        </div>
                        <div class="card-tag"><?php esc_html_e( 'TIPS', 'haircare' ); ?></div>
                        <h3><a href="#"><?php esc_html_e( 'The 5 Best Supplements for Natural Hair Growth in 2025', 'haircare' ); ?></a></h3>
                    </article>
                    <article class="featured-side-card">
                        <div class="card-image">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-3kYInJ6-lluzUBz6AL0Ns321_cdKW0Igz21ZKKMZXzGaar9DpXdNh5JwU_9WIRGUD2xhcgoBUXyQfA3BoosYNfK0tY9dwYD5PyMe0sN_qP7s18nPL7kJ7y5ng2_jvvEsh7d9zXhaf6aIi4HpXdlpgfZ9QjMkmYpGYL1msr2K2sJRVOaEOrvEH3vBUOelOidHEiKnqECGhjzVyb9ILhhuh8g54ei7dpaNhass4tCOpTajH-WQEwaz6b61OUNgYSfEWMxnrA3Ati0" alt="Man with healthy hair">
                        </div>
                        <div class="card-tag"><?php esc_html_e( 'SUCCESS STORIES', 'haircare' ); ?></div>
                        <h3><a href="#"><?php esc_html_e( 'How John Restored His Crown and His Confidence', 'haircare' ); ?></a></h3>
                    </article>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </section>

    <!-- YouTube Shorts Section -->
    <?php
    $shorts = haircare_get_youtube_shorts( 3 );
    if ( ! empty( $shorts ) ) :
    ?>
    <section class="youtube-shorts-section">
        <div class="container">
            <div class="shorts-header">
                <h2><?php esc_html_e( 'Latest Shorts', 'haircare' ); ?></h2>
                <a href="https://www.youtube.com/@ThinHairGrowthGuide/shorts" target="_blank" rel="noopener noreferrer" class="shorts-view-all">
                    <?php esc_html_e( 'View All', 'haircare' ); ?>
                    <span class="material-symbols-outlined">arrow_forward</span>
                </a>
            </div>
            <div class="shorts-grid">
                <?php foreach ( $shorts as $short ) : ?>
                <div class="short-card" data-video-id="<?php echo esc_attr( $short['id'] ); ?>">
                    <img src="<?php echo esc_url( $short['thumbnail'] ); ?>" alt="<?php echo esc_attr( $short['title'] ); ?>" class="short-thumb" loading="lazy">
                    <div class="short-overlay">
                        <span class="material-symbols-outlined play-icon">play_circle</span>
                    </div>
                    <div class="short-info">
                        <span class="short-title"><?php echo esc_html( $short['title'] ); ?></span>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Latest Articles -->
    <?php
    $latest_query = new WP_Query( array(
        'posts_per_page' => 2,
        'post_status'    => 'publish',
        'offset'         => $featured_count,
    ) );

    if ( $latest_query->have_posts() ) :
    ?>
    <section class="latest-section">
        <div class="container">
            <div class="latest-header">
                <div class="latest-header-text">
                    <h2><?php esc_html_e( 'Latest Insights', 'haircare' ); ?></h2>
                    <p><?php esc_html_e( 'Stay updated with the latest research and restoration tips.', 'haircare' ); ?></p>
                </div>
                <a href="https://thinhairgrowthguide.com/read-blogs/" class="latest-view-all">
                    <?php esc_html_e( 'View All Posts', 'haircare' ); ?>
                    <span class="material-symbols-outlined">arrow_forward</span>
                </a>
            </div>

            <div class="latest-grid">
                <?php
                while ( $latest_query->have_posts() ) :
                    $latest_query->the_post();
                ?>
                <article class="latest-card">
                    <a href="<?php the_permalink(); ?>">
                        <div class="latest-card-image">
                            <?php if ( has_post_thumbnail() ) : ?>
                                <?php the_post_thumbnail( 'haircare-card' ); ?>
                            <?php else : ?>
                                <img src="https://picsum.photos/600/340?random=<?php echo esc_attr( get_the_ID() ); ?>" alt="<?php the_title_attribute(); ?>">
                            <?php endif; ?>
                        </div>
                    </a>
                    <div class="latest-card-body">
                        <span class="latest-card-tag"><?php echo get_the_category_list( ', ' ); ?></span>
                        <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                        <div class="latest-card-footer">
                            <span class="latest-card-date"><?php echo get_the_date(); ?></span>
                            <span class="material-symbols-outlined latest-card-bookmark">bookmark</span>
                        </div>
                    </div>
                </article>
                <?php endwhile; ?>
            </div>
        </div>
    </section>
    <?php
    wp_reset_postdata();
    endif;
    ?>

</main>

<?php
get_footer();
