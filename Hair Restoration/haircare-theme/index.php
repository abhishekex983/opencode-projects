<?php
/**
 * The main template file for the Haircare theme
 *
 * @package Haircare
 */

get_header();
?>

<main class="site-content" id="primary">

    <?php if ( is_home() && ! is_front_page() ) : ?>
        <section class="section-padding bg-primary">
            <div class="container">
                <h1 class="text-white font-headline"><?php single_post_title(); ?></h1>
            </div>
        </section>
    <?php endif; ?>

    <section class="section-padding">
        <div class="container" style="display: grid; grid-template-columns: 1fr var(--spacing-sidebar-width); gap: var(--spacing-gutter);">

            <!-- Main Content -->
            <div class="main-content">
                <?php if ( have_posts() ) : ?>

                    <?php if ( is_home() && ! is_front_page() ) : ?>
                        <header class="page-header" style="margin-bottom: 2rem;">
                            <p class="text-muted" style="font-size: var(--text-body-lg);"><?php esc_html_e( 'Stay updated with the latest research and restoration tips.', 'haircare' ); ?></p>
                        </header>
                    <?php endif; ?>

                    <?php
                    while ( have_posts() ) :
                        the_post();
                        ?>
                        <article id="post-<?php the_ID(); ?>" <?php post_class( 'card' ); ?> style="margin-bottom: 2rem;">
                            <?php if ( has_post_thumbnail() ) : ?>
                                <div class="card-image">
                                    <a href="<?php the_permalink(); ?>">
                                        <?php the_post_thumbnail( 'haircare-card' ); ?>
                                    </a>
                                </div>
                            <?php endif; ?>

                            <div class="card-body">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <span class="tag tag-primary"><?php echo get_the_category_list( ', ' ); ?></span>
                                    <span class="text-muted font-label" style="font-size: var(--text-label-sm);"><?php echo get_the_date(); ?></span>
                                </div>

                                <h2 style="font-size: var(--text-headline-md); margin-bottom: 0.75rem;">
                                    <a href="<?php the_permalink(); ?>" class="font-headline" style="color: var(--color-primary);">
                                        <?php the_title(); ?>
                                    </a>
                                </h2>

                                <p class="text-muted" style="font-size: var(--text-body-md);">
                                    <?php the_excerpt(); ?>
                                </p>
                            </div>
                        </article>
                        <?php
                    endwhile;

                    // Pagination
                    the_posts_pagination( array(
                        'mid_size'  => 2,
                        'prev_text' => esc_html__( '&laquo; Previous', 'haircare' ),
                        'next_text' => esc_html__( 'Next &raquo;', 'haircare' ),
                    ) );

                else : ?>

                    <article class="card">
                        <div class="card-body">
                            <h2><?php esc_html_e( 'No posts found.', 'haircare' ); ?></h2>
                            <p><?php esc_html_e( 'It seems we can&rsquo;t find what you&rsquo;re looking for. Perhaps searching can help.', 'haircare' ); ?></p>
                            <?php get_search_form(); ?>
                        </div>
                    </article>

                <?php endif; ?>
            </div>

            <!-- Sidebar -->
            <?php get_sidebar(); ?>

        </div>
    </section>

</main>

<?php
get_footer();
