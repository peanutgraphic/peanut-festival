<?php
if (!defined('ABSPATH')) exit;

$competition_id = (int) $atts['competition_id'];
$show_votes = $atts['show_votes'] === 'yes';
$animate = $atts['animate'] === 'yes';
?>

<div class="pf-bracket-widget"
     data-competition-id="<?php echo esc_attr($competition_id); ?>"
     data-show-votes="<?php echo esc_attr($show_votes ? 'true' : 'false'); ?>"
     data-animate="<?php echo esc_attr($animate ? 'true' : 'false'); ?>">

    <div class="pf-bracket-header">
        <h2 class="pf-bracket-title"><?php echo esc_html($competition->name); ?></h2>
        <div class="pf-bracket-meta">
            <span class="pf-bracket-type"><?php echo esc_html(ucwords(str_replace('_', ' ', $competition->type))); ?></span>
            <span class="pf-bracket-status pf-status-<?php echo esc_attr($competition->status); ?>">
                <?php echo esc_html(ucfirst($competition->status)); ?>
            </span>
        </div>
    </div>

    <div class="pf-bracket-loading" role="status" aria-live="polite">
        <div class="pf-spinner" aria-hidden="true"></div>
        <p>Loading bracket...</p>
    </div>

    <div class="pf-bracket-container" style="display:none;">
        <?php if (!empty($bracket['rounds'])): ?>
            <div class="pf-bracket-rounds">
                <?php foreach ($bracket['rounds'] as $round_num => $matches): ?>
                    <div class="pf-bracket-round" data-round="<?php echo esc_attr($round_num); ?>">
                        <h3 class="pf-round-title">
                            <?php
                            $round_name = 'Round ' . $round_num;
                            if ($round_num === $bracket['total_rounds']) {
                                $round_name = 'Finals';
                            } elseif ($round_num === $bracket['total_rounds'] - 1) {
                                $round_name = 'Semi-Finals';
                            } elseif ($round_num === $bracket['total_rounds'] - 2 && $bracket['total_rounds'] > 2) {
                                $round_name = 'Quarter-Finals';
                            }
                            echo esc_html($round_name);
                            ?>
                        </h3>
                        <div class="pf-round-matches">
                            <?php foreach ($matches as $match): ?>
                                <div class="pf-match pf-match-<?php echo esc_attr($match['status']); ?>"
                                     data-match-id="<?php echo esc_attr($match['id']); ?>">

                                    <div class="pf-match-contestant pf-contestant-1 <?php echo $match['winner_id'] == $match['performer_1_id'] ? 'pf-winner' : ''; ?>">
                                        <span class="pf-contestant-name">
                                            <?php echo esc_html($match['performer_1_name'] ?? 'TBD'); ?>
                                        </span>
                                        <?php if ($show_votes && $match['status'] !== 'pending'): ?>
                                            <span class="pf-contestant-votes"><?php echo esc_html($match['votes_performer_1'] ?? 0); ?></span>
                                        <?php endif; ?>
                                    </div>

                                    <div class="pf-match-vs">
                                        <?php if ($match['status'] === 'voting'): ?>
                                            <span class="pf-voting-badge">LIVE</span>
                                        <?php else: ?>
                                            <span>vs</span>
                                        <?php endif; ?>
                                    </div>

                                    <div class="pf-match-contestant pf-contestant-2 <?php echo $match['winner_id'] == $match['performer_2_id'] ? 'pf-winner' : ''; ?>">
                                        <span class="pf-contestant-name">
                                            <?php echo esc_html($match['performer_2_name'] ?? 'TBD'); ?>
                                        </span>
                                        <?php if ($show_votes && $match['status'] !== 'pending'): ?>
                                            <span class="pf-contestant-votes"><?php echo esc_html($match['votes_performer_2'] ?? 0); ?></span>
                                        <?php endif; ?>
                                    </div>

                                    <?php if ($match['status'] === 'voting'): ?>
                                        <div class="pf-match-vote-cta">
                                            <a href="#vote-match-<?php echo esc_attr($match['id']); ?>" class="pf-vote-now-btn">Vote Now</a>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <?php if ($competition->winner_performer_id): ?>
                <div class="pf-bracket-champion">
                    <div class="pf-trophy-icon">🏆</div>
                    <h3>Champion</h3>
                    <?php $winner = Peanut_Festival_Performers::get_by_id($competition->winner_performer_id); ?>
                    <?php if ($winner): ?>
                        <div class="pf-champion-name"><?php echo esc_html($winner->name); ?></div>
                        <?php if (!empty($winner->photo_url)): ?>
                            <img src="<?php echo esc_url($winner->photo_url); ?>" alt="<?php echo esc_attr($winner->name); ?>" class="pf-champion-photo">
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

        <?php else: ?>
            <div class="pf-bracket-empty">
                <p>Bracket not yet generated.</p>
            </div>
        <?php endif; ?>
    </div>

    <div class="pf-bracket-legend">
        <span class="pf-legend-item pf-legend-pending">Upcoming</span>
        <span class="pf-legend-item pf-legend-voting">Live Voting</span>
        <span class="pf-legend-item pf-legend-completed">Completed</span>
    </div>
</div>
