<?php
if (!defined('ABSPATH')) exit;

if (!$festival_id) {
    echo '<div class="pf-error"><p>No festival selected. Please contact the administrator.</p></div>';
    return;
}

// Get available shifts
$shifts = Peanut_Festival_Volunteers::get_shifts([
    'festival_id' => $festival_id,
    'status' => 'open',
]);

// Group shifts by date
$shifts_by_date = [];
foreach ($shifts as $shift) {
    $date = $shift->shift_date;
    if (!isset($shifts_by_date[$date])) {
        $shifts_by_date[$date] = [];
    }
    $shifts_by_date[$date][] = $shift;
}
?>

<div class="pf-form-widget pf-volunteer-signup" data-festival="<?php echo esc_attr($festival_id); ?>">

    <div class="pf-form-header">
        <h2>Volunteer Signup</h2>
        <p>Help make our festival a success! Sign up to volunteer below.</p>
    </div>

    <div class="pf-form-message" style="display:none;"></div>

    <form id="pf-volunteer-form" class="pf-form">
        <input type="hidden" name="festival_id" value="<?php echo esc_attr($festival_id); ?>">

        <div class="pf-form-section">
            <h3>Contact Information</h3>

            <div class="pf-form-row">
                <div class="pf-form-group pf-required">
                    <label for="pf-vol-name">Full Name *</label>
                    <input type="text" id="pf-vol-name" name="name" required class="pf-input">
                </div>

                <div class="pf-form-group pf-required">
                    <label for="pf-vol-email">Email *</label>
                    <input type="email" id="pf-vol-email" name="email" required class="pf-input">
                </div>
            </div>

            <div class="pf-form-row">
                <div class="pf-form-group">
                    <label for="pf-vol-phone">Phone</label>
                    <input type="tel" id="pf-vol-phone" name="phone" class="pf-input">
                </div>

                <div class="pf-form-group">
                    <label for="pf-vol-shirt">T-Shirt Size</label>
                    <select id="pf-vol-shirt" name="shirt_size" class="pf-select">
                        <option value="">Select size...</option>
                        <option value="XS">XS</option>
                        <option value="S">Small</option>
                        <option value="M">Medium</option>
                        <option value="L">Large</option>
                        <option value="XL">XL</option>
                        <option value="2XL">2XL</option>
                        <option value="3XL">3XL</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="pf-form-section">
            <h3>Emergency Contact</h3>

            <div class="pf-form-row">
                <div class="pf-form-group">
                    <label for="pf-vol-emergency-name">Emergency Contact Name</label>
                    <input type="text" id="pf-vol-emergency-name" name="emergency_contact" class="pf-input">
                </div>

                <div class="pf-form-group">
                    <label for="pf-vol-emergency-phone">Emergency Contact Phone</label>
                    <input type="tel" id="pf-vol-emergency-phone" name="emergency_phone" class="pf-input">
                </div>
            </div>
        </div>

        <div class="pf-form-section">
            <h3>Skills & Preferences</h3>

            <div class="pf-form-group">
                <label>What skills can you offer? (Check all that apply)</label>
                <div class="pf-checkbox-grid">
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="hospitality"> Hospitality / Customer Service
                    </label>
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="tech"> Tech / AV Equipment
                    </label>
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="photography"> Photography / Video
                    </label>
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="social_media"> Social Media
                    </label>
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="driving"> Has Valid Driver's License
                    </label>
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="setup"> Setup / Breakdown
                    </label>
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="box_office"> Box Office / Will Call
                    </label>
                    <label class="pf-checkbox-label">
                        <input type="checkbox" name="skills[]" value="green_room"> Green Room / Performer Support
                    </label>
                </div>
            </div>

            <div class="pf-form-group">
                <label for="pf-vol-dietary">Dietary Restrictions</label>
                <textarea id="pf-vol-dietary" name="dietary_restrictions" class="pf-textarea" rows="2"
                    placeholder="Let us know about any food allergies or dietary needs..."></textarea>
            </div>
        </div>

        <?php if (!empty($shifts_by_date)): ?>
        <div class="pf-form-section">
            <h3>Available Shifts</h3>
            <p class="pf-section-desc">Select the shifts you're interested in. We'll confirm your assignments later.</p>

            <?php foreach ($shifts_by_date as $date => $day_shifts): ?>
            <div class="pf-shift-day">
                <h4><?php echo esc_html(date_i18n('l, F j', strtotime($date))); ?></h4>

                <div class="pf-shift-list">
                    <?php foreach ($day_shifts as $shift):
                        $available = max(0, $shift->slots_total - $shift->slots_filled);
                    ?>
                    <label class="pf-shift-option<?php echo $available <= 0 ? ' pf-shift-full' : ''; ?>">
                        <input type="checkbox" name="shift_preferences[]" value="<?php echo esc_attr($shift->id); ?>"
                            <?php echo $available <= 0 ? 'disabled' : ''; ?>>
                        <div class="pf-shift-info">
                            <strong><?php echo esc_html($shift->task_name); ?></strong>
                            <span class="pf-shift-time">
                                <?php
                                echo esc_html(date_i18n('g:i A', strtotime($shift->start_time)));
                                echo ' - ';
                                echo esc_html(date_i18n('g:i A', strtotime($shift->end_time)));
                                ?>
                            </span>
                            <?php if ($shift->location): ?>
                            <span class="pf-shift-location"><?php echo esc_html($shift->location); ?></span>
                            <?php endif; ?>
                            <span class="pf-shift-slots">
                                <?php echo $available > 0 ? esc_html($available . ' spots left') : 'Full'; ?>
                            </span>
                        </div>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <div class="pf-form-actions">
            <button type="submit" class="pf-btn pf-btn-primary pf-btn-large">
                <span class="pf-btn-text">Sign Up to Volunteer</span>
                <span class="pf-btn-loading" style="display:none;">Submitting...</span>
            </button>
        </div>
    </form>

    <div class="pf-form-success" style="display:none;">
        <div class="pf-success-icon">&#10003;</div>
        <h3>Thank You for Volunteering!</h3>
        <p>We've received your signup. A volunteer coordinator will be in touch with your confirmed shifts and more details.</p>
    </div>
</div>
