<?php
if (!defined('ABSPATH')) exit;

if (!$festival_id) {
    echo '<div class="pf-error"><p>No festival selected. Please contact the administrator.</p></div>';
    return;
}
?>

<div class="pf-form-widget pf-performer-application" data-festival="<?php echo esc_attr($festival_id); ?>">

    <div class="pf-form-header">
        <h2>Performer Application</h2>
        <p>Interested in performing at our festival? Fill out the form below to apply.</p>
    </div>

    <div class="pf-form-message" style="display:none;" role="alert" aria-live="polite"></div>

    <form id="pf-performer-form" class="pf-form">
        <input type="hidden" name="festival_id" value="<?php echo esc_attr($festival_id); ?>">

        <div class="pf-form-section">
            <h3>Contact Information</h3>

            <div class="pf-form-row">
                <div class="pf-form-group pf-required">
                    <label for="pf-perf-name">Name / Act Name <span aria-hidden="true">*</span><span class="screen-reader-text">(required)</span></label>
                    <input type="text" id="pf-perf-name" name="name" required aria-required="true" class="pf-input">
                </div>

                <div class="pf-form-group pf-required">
                    <label for="pf-perf-email">Email <span aria-hidden="true">*</span><span class="screen-reader-text">(required)</span></label>
                    <input type="email" id="pf-perf-email" name="email" required aria-required="true" class="pf-input">
                </div>
            </div>

            <div class="pf-form-row">
                <div class="pf-form-group">
                    <label for="pf-perf-phone">Phone</label>
                    <input type="tel" id="pf-perf-phone" name="phone" class="pf-input">
                </div>

                <div class="pf-form-group">
                    <label for="pf-perf-website">Website</label>
                    <input type="url" id="pf-perf-website" name="website" class="pf-input" placeholder="https://">
                </div>
            </div>
        </div>

        <div class="pf-form-section">
            <h3>Performance Details</h3>

            <div class="pf-form-group">
                <label for="pf-perf-type">Performance Type</label>
                <select id="pf-perf-type" name="performance_type" class="pf-select">
                    <option value="">Select type...</option>
                    <option value="comedy">Stand-up Comedy</option>
                    <option value="improv">Improv</option>
                    <option value="sketch">Sketch Comedy</option>
                    <option value="music">Musical Comedy</option>
                    <option value="variety">Variety Act</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="pf-form-group pf-required">
                <label for="pf-perf-bio">Bio / Description <span aria-hidden="true">*</span><span class="screen-reader-text">(required)</span></label>
                <textarea id="pf-perf-bio" name="bio" required aria-required="true" class="pf-textarea" rows="5"
                    placeholder="Tell us about yourself and your act..."></textarea>
            </div>

            <div class="pf-form-group">
                <label for="pf-perf-tech">Technical Requirements</label>
                <textarea id="pf-perf-tech" name="technical_requirements" class="pf-textarea" rows="3"
                    placeholder="Microphone preferences, lighting needs, props, etc."></textarea>
            </div>
        </div>

        <div class="pf-form-section">
            <h3>Social Media</h3>

            <div class="pf-form-row">
                <div class="pf-form-group">
                    <label for="pf-perf-instagram">Instagram</label>
                    <input type="text" id="pf-perf-instagram" name="social_instagram" class="pf-input" placeholder="@username">
                </div>

                <div class="pf-form-group">
                    <label for="pf-perf-tiktok">TikTok</label>
                    <input type="text" id="pf-perf-tiktok" name="social_tiktok" class="pf-input" placeholder="@username">
                </div>
            </div>

            <div class="pf-form-row">
                <div class="pf-form-group">
                    <label for="pf-perf-youtube">YouTube</label>
                    <input type="url" id="pf-perf-youtube" name="social_youtube" class="pf-input" placeholder="https://youtube.com/...">
                </div>

                <div class="pf-form-group">
                    <label for="pf-perf-twitter">Twitter/X</label>
                    <input type="text" id="pf-perf-twitter" name="social_twitter" class="pf-input" placeholder="@username">
                </div>
            </div>
        </div>

        <div class="pf-form-actions">
            <button type="submit" class="pf-btn pf-btn-primary pf-btn-large">
                <span class="pf-btn-text">Submit Application</span>
                <span class="pf-btn-loading" style="display:none;">Submitting...</span>
            </button>
        </div>
    </form>

    <div class="pf-form-success" style="display:none;" role="alert" aria-live="polite">
        <div class="pf-success-icon" aria-hidden="true">&#10003;</div>
        <h3>Application Submitted!</h3>
        <p>Thank you for your interest in performing at our festival. We'll review your application and get back to you soon.</p>
    </div>
</div>
