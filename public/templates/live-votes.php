<?php
if (!defined('ABSPATH')) exit;

$show_id = !empty($atts['show_id']) ? (int) $atts['show_id'] : null;
$match_id = !empty($atts['match_id']) ? (int) $atts['match_id'] : null;
$style = esc_attr($atts['style']);
$refresh = (int) $atts['refresh'];
?>

<div class="pf-live-votes-widget pf-live-votes-<?php echo esc_attr($style); ?>"
     data-show-id="<?php echo esc_attr($show_id ?? ''); ?>"
     data-match-id="<?php echo esc_attr($match_id ?? ''); ?>"
     data-style="<?php echo esc_attr($style); ?>"
     data-refresh="<?php echo esc_attr($refresh); ?>">

    <div class="pf-live-loading" role="status" aria-live="polite">
        <div class="pf-spinner" aria-hidden="true"></div>
        <p>Loading vote counts...</p>
    </div>

    <div class="pf-live-content" style="display:none;">
        <div class="pf-live-header">
            <h3 class="pf-live-title">Live Vote Count</h3>
            <div class="pf-live-pulse" aria-hidden="true"></div>
            <span class="pf-live-status">Updating in real-time</span>
        </div>

        <?php if ($style === 'bars'): ?>
            <!-- Bar chart style -->
            <div class="pf-vote-bars" role="img" aria-label="Vote count visualization">
                <!-- Populated by JavaScript -->
            </div>

        <?php elseif ($style === 'numbers'): ?>
            <!-- Simple numbers display -->
            <div class="pf-vote-numbers" role="list" aria-label="Vote counts">
                <!-- Populated by JavaScript -->
            </div>

        <?php elseif ($style === 'pie'): ?>
            <!-- Pie chart style -->
            <div class="pf-vote-pie" role="img" aria-label="Vote distribution chart">
                <canvas class="pf-pie-canvas" width="300" height="300"></canvas>
                <div class="pf-pie-legend"></div>
            </div>
        <?php endif; ?>

        <div class="pf-vote-total">
            <span class="pf-total-label">Total Votes:</span>
            <span class="pf-total-count">0</span>
        </div>

        <div class="pf-vote-time">
            <span class="pf-time-remaining"></span>
        </div>
    </div>

    <div class="pf-live-closed" style="display:none;">
        <div class="pf-notice">
            <p>Voting is currently closed.</p>
        </div>
    </div>
</div>
