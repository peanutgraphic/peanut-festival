<?php
if (!defined('ABSPATH')) exit;

if (!$festival_id) {
    echo '<div class="pf-error"><p>No festival selected. Please contact the administrator.</p></div>';
    return;
}
?>

<div class="pf-form-widget pf-vendor-application" data-festival="<?php echo esc_attr($festival_id); ?>">

    <div class="pf-form-header">
        <h2>Vendor Application</h2>
        <p>Interested in being a vendor at our festival? Fill out the form below to apply.</p>
    </div>

    <div class="pf-form-message" style="display:none;"></div>

    <form id="pf-vendor-form" class="pf-form">
        <input type="hidden" name="festival_id" value="<?php echo esc_attr($festival_id); ?>">

        <div class="pf-form-section">
            <h3>Business Information</h3>

            <div class="pf-form-group pf-required">
                <label for="pf-vend-business">Business Name *</label>
                <input type="text" id="pf-vend-business" name="business_name" required class="pf-input">
            </div>

            <div class="pf-form-row">
                <div class="pf-form-group">
                    <label for="pf-vend-contact">Contact Name</label>
                    <input type="text" id="pf-vend-contact" name="contact_name" class="pf-input">
                </div>

                <div class="pf-form-group pf-required">
                    <label for="pf-vend-email">Email *</label>
                    <input type="email" id="pf-vend-email" name="email" required class="pf-input">
                </div>
            </div>

            <div class="pf-form-group">
                <label for="pf-vend-phone">Phone</label>
                <input type="tel" id="pf-vend-phone" name="phone" class="pf-input">
            </div>
        </div>

        <div class="pf-form-section">
            <h3>Vendor Details</h3>

            <div class="pf-form-group pf-required">
                <label for="pf-vend-type">Vendor Type *</label>
                <select id="pf-vend-type" name="vendor_type" required class="pf-select">
                    <option value="">Select type...</option>
                    <option value="food">Food & Beverage</option>
                    <option value="merchandise">Merchandise / Retail</option>
                    <option value="service">Service Provider</option>
                    <option value="sponsor">Sponsor / Promotional</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="pf-form-group">
                <label for="pf-vend-description">Business Description</label>
                <textarea id="pf-vend-description" name="description" class="pf-textarea" rows="3"
                    placeholder="Tell us about your business..."></textarea>
            </div>

            <div class="pf-form-group">
                <label for="pf-vend-products">Products / Services Offered *</label>
                <textarea id="pf-vend-products" name="products" required class="pf-textarea" rows="3"
                    placeholder="List the products or services you plan to offer at the festival..."></textarea>
            </div>
        </div>

        <div class="pf-form-section">
            <h3>Booth Requirements</h3>

            <div class="pf-form-group">
                <label for="pf-vend-booth">Booth / Space Requirements</label>
                <textarea id="pf-vend-booth" name="booth_requirements" class="pf-textarea" rows="3"
                    placeholder="Describe your booth setup needs (size, tables, chairs, etc.)..."></textarea>
            </div>

            <div class="pf-form-group">
                <label class="pf-checkbox-label pf-checkbox-single">
                    <input type="checkbox" name="electricity_needed" value="1">
                    <span>I need electricity at my booth</span>
                </label>
            </div>
        </div>

        <div class="pf-form-section pf-form-notice">
            <p><strong>Note:</strong> All vendors are subject to approval. Food vendors must provide proof of applicable licenses and insurance. Booth fees vary by vendor type and will be discussed upon approval.</p>
        </div>

        <div class="pf-form-actions">
            <button type="submit" class="pf-btn pf-btn-primary pf-btn-large">
                <span class="pf-btn-text">Submit Application</span>
                <span class="pf-btn-loading" style="display:none;">Submitting...</span>
            </button>
        </div>
    </form>

    <div class="pf-form-success" style="display:none;">
        <div class="pf-success-icon">&#10003;</div>
        <h3>Application Submitted!</h3>
        <p>Thank you for your interest in vending at our festival. We'll review your application and contact you about next steps.</p>
    </div>
</div>
