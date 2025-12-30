<?php
if (!defined('ABSPATH')) exit;

$view = esc_attr($atts['view']);
$show_filters = $atts['filters'] === 'yes';

// Group shows by date
$shows_by_date = [];
foreach ($shows as $show) {
    $date = $show->show_date;
    if (!isset($shows_by_date[$date])) {
        $shows_by_date[$date] = [];
    }
    $shows_by_date[$date][] = $show;
}

// Get unique venues for filter
$venues = [];
foreach ($shows as $show) {
    if (!empty($show->venue_name) && !in_array($show->venue_name, $venues)) {
        $venues[] = $show->venue_name;
    }
}
?>

<div class="pf-schedule-widget" data-view="<?php echo $view; ?>">

    <?php if ($show_filters && (count($shows_by_date) > 1 || count($venues) > 1)): ?>
    <div class="pf-schedule-filters">
        <?php if (count($shows_by_date) > 1): ?>
        <div class="pf-filter-group">
            <label for="pf-filter-date">Date:</label>
            <select id="pf-filter-date" class="pf-filter-select">
                <option value="">All Dates</option>
                <?php foreach (array_keys($shows_by_date) as $date): ?>
                <option value="<?php echo esc_attr($date); ?>">
                    <?php echo esc_html(date_i18n('l, F j', strtotime($date))); ?>
                </option>
                <?php endforeach; ?>
            </select>
        </div>
        <?php endif; ?>

        <?php if (count($venues) > 1): ?>
        <div class="pf-filter-group">
            <label for="pf-filter-venue">Venue:</label>
            <select id="pf-filter-venue" class="pf-filter-select">
                <option value="">All Venues</option>
                <?php foreach ($venues as $venue): ?>
                <option value="<?php echo esc_attr($venue); ?>">
                    <?php echo esc_html($venue); ?>
                </option>
                <?php endforeach; ?>
            </select>
        </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>

    <?php if (empty($shows)): ?>
    <div class="pf-schedule-empty">
        <p>No shows scheduled yet. Check back soon!</p>
    </div>
    <?php else: ?>

    <div class="pf-schedule-<?php echo $view; ?>">
        <?php foreach ($shows_by_date as $date => $day_shows): ?>
        <div class="pf-schedule-day" data-date="<?php echo esc_attr($date); ?>">
            <h3 class="pf-day-header"><?php echo esc_html(date_i18n('l, F j, Y', strtotime($date))); ?></h3>

            <div class="pf-shows-list">
                <?php foreach ($day_shows as $show): ?>
                <div class="pf-show-card<?php echo $show->featured ? ' pf-featured' : ''; ?><?php echo $show->status === 'sold_out' ? ' pf-sold-out' : ''; ?>"
                     data-venue="<?php echo esc_attr($show->venue_name ?? ''); ?>">

                    <?php if ($show->featured): ?>
                    <span class="pf-badge pf-badge-featured">Featured</span>
                    <?php endif; ?>

                    <?php if ($show->kid_friendly): ?>
                    <span class="pf-badge pf-badge-family">Family Friendly</span>
                    <?php endif; ?>

                    <div class="pf-show-time">
                        <?php
                        $start = $show->start_time ? date_i18n('g:i A', strtotime($show->start_time)) : '';
                        $end = $show->end_time ? date_i18n('g:i A', strtotime($show->end_time)) : '';
                        echo esc_html($start);
                        if ($end) echo ' - ' . esc_html($end);
                        ?>
                    </div>

                    <h4 class="pf-show-title"><?php echo esc_html($show->title); ?></h4>

                    <?php if (!empty($show->venue_name)): ?>
                    <div class="pf-show-venue">
                        <strong><?php echo esc_html($show->venue_name); ?></strong>
                        <?php if (!empty($show->venue_address)): ?>
                        <br><span class="pf-venue-address"><?php echo esc_html($show->venue_address); ?></span>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($show->description)): ?>
                    <div class="pf-show-description">
                        <?php echo wp_kses_post($show->description); ?>
                    </div>
                    <?php endif; ?>

                    <div class="pf-show-status">
                        <?php if ($show->status === 'sold_out'): ?>
                        <span class="pf-status pf-status-sold-out">Sold Out</span>
                        <?php elseif ($show->status === 'on_sale'): ?>
                        <span class="pf-status pf-status-on-sale">On Sale</span>
                        <?php endif; ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <?php endif; ?>
</div>
