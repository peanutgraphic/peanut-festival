<?php
if (!defined('ABSPATH')) exit;

$limit = (int) $atts['limit'];
$show_scores = $atts['show_scores'] === 'yes';
$refresh = (int) $atts['refresh'];
?>

<div class="pf-leaderboard-widget"
     data-festival-id="<?php echo esc_attr($festival_id); ?>"
     data-limit="<?php echo esc_attr($limit); ?>"
     data-show-scores="<?php echo esc_attr($show_scores ? 'true' : 'false'); ?>"
     data-refresh="<?php echo esc_attr($refresh); ?>">

    <div class="pf-leaderboard-loading" role="status" aria-live="polite">
        <div class="pf-spinner" aria-hidden="true"></div>
        <p>Loading leaderboard...</p>
    </div>

    <div class="pf-leaderboard-content" style="display:none;">
        <div class="pf-leaderboard-header">
            <h3 class="pf-leaderboard-title">Top Performers</h3>
            <div class="pf-leaderboard-live-badge">
                <span class="pf-pulse-dot"></span>
                Live
            </div>
        </div>

        <div class="pf-leaderboard-podium">
            <!-- Top 3 displayed as podium (populated by JS) -->
            <div class="pf-podium-item pf-podium-2" data-position="2">
                <div class="pf-podium-photo"></div>
                <div class="pf-podium-name">--</div>
                <div class="pf-podium-score"></div>
                <div class="pf-podium-base">2nd</div>
            </div>
            <div class="pf-podium-item pf-podium-1" data-position="1">
                <div class="pf-podium-crown">👑</div>
                <div class="pf-podium-photo"></div>
                <div class="pf-podium-name">--</div>
                <div class="pf-podium-score"></div>
                <div class="pf-podium-base">1st</div>
            </div>
            <div class="pf-podium-item pf-podium-3" data-position="3">
                <div class="pf-podium-photo"></div>
                <div class="pf-podium-name">--</div>
                <div class="pf-podium-score"></div>
                <div class="pf-podium-base">3rd</div>
            </div>
        </div>

        <div class="pf-leaderboard-table-wrapper">
            <table class="pf-leaderboard-table" role="table">
                <thead>
                    <tr>
                        <th scope="col" class="pf-rank-col">Rank</th>
                        <th scope="col" class="pf-performer-col">Performer</th>
                        <?php if ($show_scores): ?>
                            <th scope="col" class="pf-score-col">Score</th>
                        <?php endif; ?>
                        <th scope="col" class="pf-trend-col">Trend</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
        </div>

        <div class="pf-leaderboard-footer">
            <span class="pf-last-updated">Last updated: <time>--</time></span>
        </div>
    </div>

    <div class="pf-leaderboard-empty" style="display:none;">
        <p>No performers have been scored yet.</p>
    </div>
</div>
