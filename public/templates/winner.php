<?php
if (!defined('ABSPATH')) exit;

$confetti = $atts['confetti'] === 'yes';
$sound = $atts['sound'] === 'yes';
?>

<div class="pf-winner-widget <?php echo esc_attr($confetti ? 'pf-with-confetti' : ''); ?>"
     data-confetti="<?php echo esc_attr($confetti ? 'true' : 'false'); ?>"
     data-sound="<?php echo esc_attr($sound ? 'true' : 'false'); ?>">

    <div class="pf-winner-container">
        <div class="pf-winner-crown" aria-hidden="true">
            <span class="pf-crown-icon">👑</span>
        </div>

        <div class="pf-winner-announcement">
            <div class="pf-winner-label">And the winner is...</div>
            <h2 class="pf-winner-name"><?php echo esc_html($winner->name); ?></h2>
        </div>

        <?php if (!empty($winner->photo_url)): ?>
            <div class="pf-winner-photo-frame">
                <img src="<?php echo esc_url($winner->photo_url); ?>"
                     alt="<?php echo esc_attr($winner->name); ?>"
                     class="pf-winner-photo">
                <div class="pf-winner-photo-glow"></div>
            </div>
        <?php endif; ?>

        <?php if (!empty($winner->bio)): ?>
            <div class="pf-winner-bio">
                <p><?php echo esc_html(wp_trim_words($winner->bio, 30)); ?></p>
            </div>
        <?php endif; ?>

        <div class="pf-winner-trophy">
            <span class="pf-trophy-icon">🏆</span>
        </div>

        <?php if (!empty($winner->social_links)): ?>
            <div class="pf-winner-social">
                <?php
                $social_links = is_array($winner->social_links)
                    ? $winner->social_links
                    : json_decode($winner->social_links, true);
                if (!empty($social_links)):
                    foreach ($social_links as $platform => $url):
                        if (!empty($url)):
                ?>
                    <a href="<?php echo esc_url($url); ?>"
                       class="pf-social-link pf-social-<?php echo esc_attr($platform); ?>"
                       target="_blank"
                       rel="noopener noreferrer"
                       aria-label="<?php echo esc_attr(ucfirst($platform)); ?>">
                        <?php echo esc_html(ucfirst($platform)); ?>
                    </a>
                <?php
                        endif;
                    endforeach;
                endif;
                ?>
            </div>
        <?php endif; ?>

        <div class="pf-winner-meta">
            <?php if ($source_type === 'competition'): ?>
                <span class="pf-winner-source">Competition Winner</span>
            <?php else: ?>
                <span class="pf-winner-source">Audience Favorite</span>
            <?php endif; ?>
        </div>
    </div>

    <div class="pf-winner-particles" aria-hidden="true">
        <!-- Particle effects container -->
    </div>

    <?php if ($confetti): ?>
        <canvas id="pf-confetti-canvas" class="pf-confetti-canvas"></canvas>
    <?php endif; ?>
</div>
