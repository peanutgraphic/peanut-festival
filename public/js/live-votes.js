/**
 * Live Vote Counter
 * Peanut Festival v1.1.0
 */
(function($) {
    'use strict';

    const LiveVotes = {
        init: function() {
            this.$widget = $('.pf-live-votes-widget');
            if (!this.$widget.length) return;

            this.showId = this.$widget.data('show-id');
            this.matchId = this.$widget.data('match-id');
            this.style = this.$widget.data('style') || 'bars';
            this.refreshInterval = pfLiveVotes.refreshInterval || 3000;
            this.colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
            this.previousData = null;

            this.fetchData();
            this.startPolling();
        },

        startPolling: function() {
            setInterval(() => this.fetchData(), this.refreshInterval);
        },

        fetchData: function() {
            let endpoint;
            if (this.matchId) {
                endpoint = pfLiveVotes.apiUrl + '/matches/' + this.matchId + '/votes';
            } else {
                endpoint = pfLiveVotes.apiUrl + '/vote/status/' + this.showId;
            }

            $.ajax({
                url: endpoint,
                method: 'GET',
                headers: {
                    'X-WP-Nonce': pfLiveVotes.nonce
                },
                success: (response) => {
                    this.render(response.data || response);
                },
                error: (xhr) => {
                    console.error('Failed to fetch vote data', xhr);
                }
            });
        },

        render: function(data) {
            const $loading = this.$widget.find('.pf-live-loading');
            const $content = this.$widget.find('.pf-live-content');
            const $closed = this.$widget.find('.pf-live-closed');

            if (!data || !data.is_open) {
                $loading.hide();
                $content.hide();
                $closed.show();
                return;
            }

            $loading.hide();
            $closed.hide();
            $content.show();

            // Calculate totals
            const performers = data.performers || [];
            const totalVotes = performers.reduce((sum, p) => sum + (p.vote_count || 0), 0);

            // Update based on style
            switch (this.style) {
                case 'bars':
                    this.renderBars(performers, totalVotes);
                    break;
                case 'numbers':
                    this.renderNumbers(performers);
                    break;
                case 'pie':
                    this.renderPie(performers, totalVotes);
                    break;
            }

            // Update total
            this.$widget.find('.pf-total-count').text(totalVotes.toLocaleString());

            // Update time remaining
            if (data.time_remaining) {
                const minutes = Math.floor(data.time_remaining / 60);
                const seconds = data.time_remaining % 60;
                const timeText = minutes > 0
                    ? minutes + 'm ' + seconds + 's remaining'
                    : seconds + 's remaining';
                const $time = this.$widget.find('.pf-time-remaining');
                $time.text(timeText);
                if (data.time_remaining < 60) {
                    $time.addClass('pf-time-urgent');
                } else {
                    $time.removeClass('pf-time-urgent');
                }
            }

            this.previousData = data;
        },

        renderBars: function(performers, totalVotes) {
            const $container = this.$widget.find('.pf-vote-bars');
            $container.empty();

            performers.forEach((performer, index) => {
                const votes = performer.vote_count || 0;
                const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const color = this.colors[index % this.colors.length];

                const $item = $(`
                    <div class="pf-vote-bar-item">
                        <div class="pf-vote-bar-label">
                            <span class="pf-vote-bar-name">${this.escapeHtml(performer.name)}</span>
                            <span class="pf-vote-bar-count">${votes.toLocaleString()}</span>
                        </div>
                        <div class="pf-vote-bar-track">
                            <div class="pf-vote-bar-fill" style="width: ${percent}%; background: linear-gradient(90deg, ${color} 0%, ${this.lightenColor(color, 20)} 100%);">
                                <span class="pf-vote-bar-percent">${percent}%</span>
                            </div>
                        </div>
                    </div>
                `);

                $container.append($item);
            });
        },

        renderNumbers: function(performers) {
            const $container = this.$widget.find('.pf-vote-numbers');
            $container.empty();

            performers.forEach((performer, index) => {
                const votes = performer.vote_count || 0;
                const $item = $(`
                    <div class="pf-vote-number-item">
                        <div class="pf-vote-number-value">${votes.toLocaleString()}</div>
                        <div class="pf-vote-number-name">${this.escapeHtml(performer.name)}</div>
                    </div>
                `);
                $container.append($item);
            });
        },

        renderPie: function(performers, totalVotes) {
            const canvas = this.$widget.find('.pf-pie-canvas')[0];
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (totalVotes === 0) {
                // Draw empty state
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.fillStyle = '#e5e7eb';
                ctx.fill();
                return;
            }

            let startAngle = -Math.PI / 2;

            performers.forEach((performer, index) => {
                const votes = performer.vote_count || 0;
                const sliceAngle = (votes / totalVotes) * 2 * Math.PI;
                const color = this.colors[index % this.colors.length];

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();

                startAngle += sliceAngle;
            });

            // Update legend
            const $legend = this.$widget.find('.pf-pie-legend');
            $legend.empty();

            performers.forEach((performer, index) => {
                const votes = performer.vote_count || 0;
                const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const color = this.colors[index % this.colors.length];

                $legend.append(`
                    <div class="pf-pie-legend-item">
                        <span class="pf-pie-legend-color" style="background: ${color};"></span>
                        <span>${this.escapeHtml(performer.name)} (${percent}%)</span>
                    </div>
                `);
            });
        },

        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        lightenColor: function(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return '#' + (0x1000000 +
                (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)
            ).toString(16).slice(1);
        }
    };

    $(document).ready(function() {
        LiveVotes.init();
    });

})(jQuery);
