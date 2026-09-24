<?php
/**
 * Template Name: Blog List
 *
 * A custom page template that displays all published blog posts
 * in a responsive grid layout with pagination and category filtering.
 *
 * @package Haircare
 */

get_header();
?>

<main class="site-content" id="primary">

    <!-- Hero Section -->
    <section class="hero-section" style="min-height: 40dvh;">
        <div class="hero-inner">
            <div style="max-width: 640px;">
                <h1 class="hero-title"><?php esc_html_e( 'Our Blog', 'haircare' ); ?></h1>
                <p class="hero-subtitle"><?php esc_html_e( 'Stay updated with the latest research and restoration tips.', 'haircare' ); ?></p>
            </div>
        </div>
    </section>

    <!-- Category Navigation -->
    <section class="category-nav">
        <div class="category-nav-inner">
            <?php
            $current_category = isset( $_GET['category'] ) ? sanitize_text_field( $_GET['category'] ) : '';
            ?>
            <div class="category-pills">
                <a href="<?php echo esc_url( get_permalink() ); ?>"
                   class="category-pill <?php echo empty( $current_category ) ? 'active' : ''; ?>">
                    <?php esc_html_e( 'All', 'haircare' ); ?>
                </a>
                <?php
                $categories = get_categories( array(
                    'hide_empty' => true,
                    'exclude'    => 1,
                    'orderby'    => 'name',
                    'order'      => 'ASC',
                ) );

                foreach ( $categories as $category ) :
                ?>
                    <a href="<?php echo esc_url( add_query_arg( 'category', $category->slug, get_permalink() ) ); ?>"
                       class="category-pill <?php echo ( $current_category === $category->slug ) ? 'active' : ''; ?>">
                        <?php echo esc_html( $category->name ); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Blog Posts Grid -->
    <section class="latest-section" style="min-height: 50vh;">
        <div class="container">
            <?php
            $paged = get_query_var( 'paged' ) ? get_query_var( 'paged' ) : 1;

            $args = array(
                'post_type'      => 'post',
                'post_status'    => 'publish',
                'posts_per_page' => 9,
                'paged'          => $paged,
            );

            if ( ! empty( $current_category ) ) {
                $args['category_name'] = $current_category;
            }

            $blog_query = new WP_Query( $args );

            if ( $blog_query->have_posts() ) :
            ?>

            <div class="latest-grid">
                <?php while ( $blog_query->have_posts() ) : $blog_query->the_post(); ?>
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
                        <p style="color: var(--color-muted-steel); font-size: var(--text-body-md); margin-bottom: 1rem;">
                            <?php echo esc_html( wp_trim_words( get_the_excerpt(), 20 ) ); ?>
                        </p>
                        <div class="latest-card-footer">
                            <span class="latest-card-date"><?php echo get_the_date(); ?></span>
                            <a href="<?php the_permalink(); ?>" class="latest-card-bookmark" style="text-decoration: none;">
                                <span class="material-symbols-outlined">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </article>
                <?php endwhile; ?>
            </div>

            <!-- Pagination -->
            <div style="margin-top: 3rem; text-align: center;">
                <?php
                echo paginate_links( array(
                    'total'     => $blog_query->max_num_pages,
                    'current'   => $paged,
                    'prev_text' => '&laquo; Previous',
                    'next_text' => 'Next &raquo;',
                ) );
                ?>
            </div>

            <?php
            wp_reset_postdata();

            else :
            ?>
            <div style="text-align: center; padding: 4rem 0;">
                <h2 style="color: var(--color-primary); margin-bottom: 1rem;"><?php esc_html_e( 'No posts found.', 'haircare' ); ?></h2>
                <p style="color: var(--color-muted-steel);"><?php esc_html_e( 'It seems we can&rsquo;t find what you&rsquo;re looking for.', 'haircare' ); ?></p>
            </div>
            <?php endif; ?>
        </div>
    </section>

</main>

<?php
get_footer();
