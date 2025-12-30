<?php
if (!defined('ABSPATH')) exit;

$show_id = $atts['show_id'] ?? '';
?>

<div class="pf-checkin-widget" data-show-id="<?php echo esc_attr($show_id); ?>">
    <div class="pf-checkin-header">
        <h2>Event Check-in</h2>
        <p>Scan a QR code or enter a ticket code to check in attendees.</p>
    </div>

    <div class="pf-checkin-tabs">
        <button type="button" class="pf-checkin-tab pf-active" data-tab="scan" aria-selected="true">
            Scan QR Code
        </button>
        <button type="button" class="pf-checkin-tab" data-tab="manual" aria-selected="false">
            Enter Code
        </button>
    </div>

    <div class="pf-checkin-content">
        <!-- QR Scanner Tab -->
        <div class="pf-checkin-panel pf-active" id="pf-scan-panel">
            <div class="pf-scanner-container">
                <div id="pf-qr-scanner" class="pf-scanner-viewport">
                    <div class="pf-scanner-overlay">
                        <div class="pf-scanner-frame"></div>
                    </div>
                </div>
                <button type="button" class="pf-btn pf-btn-secondary pf-start-scanner">
                    Start Camera
                </button>
                <button type="button" class="pf-btn pf-btn-secondary pf-stop-scanner" style="display:none;">
                    Stop Camera
                </button>
            </div>
            <p class="pf-scanner-hint">Position the QR code within the frame</p>
        </div>

        <!-- Manual Entry Tab -->
        <div class="pf-checkin-panel" id="pf-manual-panel" style="display:none;">
            <form id="pf-manual-checkin-form" class="pf-checkin-form">
                <div class="pf-form-group">
                    <label for="pf-ticket-code">Ticket Code</label>
                    <input type="text" id="pf-ticket-code" name="ticket_code"
                           class="pf-input pf-input-large"
                           placeholder="Enter 8-character code"
                           maxlength="8"
                           pattern="[A-Za-z0-9]{8}"
                           autocomplete="off"
                           autofocus>
                </div>
                <button type="submit" class="pf-btn pf-btn-primary pf-btn-large">
                    Check In
                </button>
            </form>
        </div>
    </div>

    <!-- Result Display -->
    <div class="pf-checkin-result" style="display:none;" role="alert" aria-live="polite">
        <div class="pf-result-content"></div>
    </div>

    <!-- Recent Check-ins -->
    <div class="pf-recent-checkins">
        <h3>Recent Check-ins</h3>
        <div class="pf-checkins-list" aria-live="polite"></div>
    </div>
</div>

<script>
(function() {
    const widget = document.querySelector('.pf-checkin-widget');
    const showId = widget.dataset.showId;
    const apiBase = '<?php echo esc_url(rest_url('peanut-festival/v1/admin')); ?>';
    const nonce = '<?php echo wp_create_nonce('wp_rest'); ?>';

    let recentCheckins = [];

    // Tab switching
    widget.querySelectorAll('.pf-checkin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            widget.querySelectorAll('.pf-checkin-tab').forEach(t => {
                t.classList.remove('pf-active');
                t.setAttribute('aria-selected', 'false');
            });
            widget.querySelectorAll('.pf-checkin-panel').forEach(p => {
                p.classList.remove('pf-active');
                p.style.display = 'none';
            });

            tab.classList.add('pf-active');
            tab.setAttribute('aria-selected', 'true');
            const panel = widget.querySelector(`#pf-${tab.dataset.tab}-panel`);
            panel.classList.add('pf-active');
            panel.style.display = 'block';
        });
    });

    // Manual check-in form
    const form = document.getElementById('pf-manual-checkin-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('pf-ticket-code').value.trim().toUpperCase();
        if (code.length === 8) {
            await checkIn(code);
            document.getElementById('pf-ticket-code').value = '';
        }
    });

    // Check-in function
    async function checkIn(code) {
        showResult('loading', 'Checking in...');

        try {
            const response = await fetch(`${apiBase}/checkin/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify({ ticket_code: code, show_id: showId })
            });

            const data = await response.json();

            if (data.success) {
                showResult('success', `
                    <div class="pf-checkin-success">
                        <div class="pf-success-icon" aria-hidden="true">✓</div>
                        <h4>Checked In!</h4>
                        <p><strong>${escapeHtml(data.data.name)}</strong></p>
                        <p>Ticket: ${escapeHtml(code)}</p>
                        <p class="pf-ticket-qty">${data.data.quantity} ticket(s)</p>
                    </div>
                `);
                addToRecentList(data.data.name, code, data.data.quantity);
            } else {
                showResult('error', `
                    <div class="pf-checkin-error">
                        <div class="pf-error-icon" aria-hidden="true">✕</div>
                        <h4>Check-in Failed</h4>
                        <p>${escapeHtml(data.message)}</p>
                    </div>
                `);
            }
        } catch (error) {
            showResult('error', `
                <div class="pf-checkin-error">
                    <div class="pf-error-icon" aria-hidden="true">✕</div>
                    <h4>Error</h4>
                    <p>Failed to process check-in. Please try again.</p>
                </div>
            `);
        }
    }

    function showResult(type, html) {
        const result = widget.querySelector('.pf-checkin-result');
        const content = result.querySelector('.pf-result-content');
        result.className = `pf-checkin-result pf-result-${type}`;
        content.innerHTML = html;
        result.style.display = 'block';

        if (type !== 'loading') {
            setTimeout(() => {
                result.style.display = 'none';
            }, 5000);
        }
    }

    function addToRecentList(name, code, qty) {
        recentCheckins.unshift({ name, code, qty, time: new Date() });
        if (recentCheckins.length > 10) recentCheckins.pop();

        const list = widget.querySelector('.pf-checkins-list');
        list.innerHTML = recentCheckins.map(c => `
            <div class="pf-recent-item">
                <span class="pf-recent-name">${escapeHtml(c.name)}</span>
                <span class="pf-recent-code">${escapeHtml(c.code)}</span>
                <span class="pf-recent-qty">${c.qty}x</span>
                <span class="pf-recent-time">${formatTime(c.time)}</span>
            </div>
        `).join('');
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // QR Scanner (using html5-qrcode library)
    let scanner = null;
    const startBtn = widget.querySelector('.pf-start-scanner');
    const stopBtn = widget.querySelector('.pf-stop-scanner');

    startBtn.addEventListener('click', async () => {
        if (typeof Html5Qrcode === 'undefined') {
            alert('QR scanner library not loaded. Please try manual entry.');
            return;
        }

        try {
            scanner = new Html5Qrcode('pf-qr-scanner');
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    checkIn(decodedText.toUpperCase());
                    scanner.pause();
                    setTimeout(() => scanner.resume(), 2000);
                }
            );
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
        } catch (err) {
            alert('Could not start camera: ' + err.message);
        }
    });

    stopBtn.addEventListener('click', async () => {
        if (scanner) {
            await scanner.stop();
            scanner = null;
        }
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
    });
})();
</script>
