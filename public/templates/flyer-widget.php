<?php
if (!defined('ABSPATH')) exit;

if (empty($templates)) {
    echo '<div class="pf-flyer-empty"><p>No flyer templates available at this time.</p></div>';
    return;
}

$active_template = null;
foreach ($templates as $template) {
    if ($template->is_active) {
        $active_template = $template;
        break;
    }
}

if (!$active_template && !empty($templates)) {
    $active_template = $templates[0];
}
?>

<div class="pf-flyer-widget" data-festival="<?php echo esc_attr($festival_id); ?>">

    <?php if (count($templates) > 1): ?>
    <div class="pf-template-selector">
        <label for="pf-template-select">Choose a design:</label>
        <select id="pf-template-select" class="pf-select">
            <?php foreach ($templates as $template): ?>
            <option value="<?php echo esc_attr($template->id); ?>"
                    data-template="<?php echo esc_attr($template->template_url); ?>"
                    data-mask="<?php echo esc_attr($template->mask_url); ?>"
                    data-frame='<?php echo esc_attr($template->frame); ?>'
                    data-namebox='<?php echo esc_attr($template->namebox); ?>'
                    <?php echo $template->id === $active_template->id ? 'selected' : ''; ?>>
                <?php echo esc_html($template->name); ?>
            </option>
            <?php endforeach; ?>
        </select>
    </div>
    <?php endif; ?>

    <div class="pf-flyer-container">
        <div class="pf-flyer-canvas-wrap">
            <canvas id="pf-flyer-canvas" width="1080" height="1080"></canvas>
        </div>

        <div class="pf-flyer-controls">
            <div class="pf-control-group">
                <label for="pf-performer-name">Your Name:</label>
                <input type="text" id="pf-performer-name" class="pf-input" placeholder="Enter your name" maxlength="50">
            </div>

            <div class="pf-control-group">
                <label for="pf-performer-image">Your Photo:</label>
                <input type="file" id="pf-performer-image" accept="image/*" class="pf-file-input">
                <button type="button" id="pf-upload-btn" class="pf-btn pf-btn-secondary">Choose Photo</button>
            </div>

            <div class="pf-image-adjustments" style="display:none;">
                <div class="pf-control-group">
                    <label for="pf-zoom">Zoom:</label>
                    <input type="range" id="pf-zoom" min="0.5" max="3" step="0.1" value="1">
                </div>

                <div class="pf-control-group">
                    <label for="pf-rotate">Rotate:</label>
                    <input type="range" id="pf-rotate" min="-180" max="180" step="1" value="0">
                </div>

                <p class="pf-drag-hint">Drag the image to reposition it</p>
            </div>

            <div class="pf-flyer-actions">
                <button type="button" id="pf-download-flyer" class="pf-btn pf-btn-primary" disabled>
                    Download Flyer
                </button>
            </div>
        </div>
    </div>
</div>
