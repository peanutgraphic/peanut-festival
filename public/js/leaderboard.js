/**
 * Leaderboard Live Updates
 * Peanut Festival v1.1.0
 */
(function($) {
    'use strict';

    const Leaderboard = {
        init: function() {
            this.$widget = $('.pf-leaderboard-widget');
            if (!this.$widget.length) return;

            this.festivalId = this.$widget.data('festival-id');
            this.limit = this.$widget.data('limit') || 10;
            this.showScores = this.$widget.data('show-scores') === true;
            this.refreshInterval = pfLeaderboard.refreshInterval || 10000;
            this.previousRanks = {};

            this.fetchData();
            this.startPolling();
        },

        startPolling: function() {
            setInterval(() => this.fetchData(), this.refreshInterval);
        },

        fetchData: function() {
            $.ajax({
                url: pfLeaderboard.apiUrl + '/leaderboard',
                method: 'GET',
                data: {
                    festival_id: this.festivalId,
                    limit: this.limit
                },
                headers: {
                    'X-WP-Nonce': pfLeaderboard.nonce
                },
                success: (response) => {
                    this.render(response.data || response.performers || []);
                },
                error: (xhr) => {
                    console.error('Failed to fetch leaderboard', xhr);
                }
            });
        },

        render: function(performers) {
            const $loading = this.$widget.find('.pf-leaderboard-loading');
            const $content = this.$widget.find('.pf-leaderboard-content');
            const $empty = this.$widget.find('.pf-leaderboard-empty');

            if (!performers || performers.length === 0) {
                $loading.hide();
                $content.hide();
                $empty.show();
                return;
            }

            $loading.hide();
            $empty.hide();
            $content.show();

            // Update podium (top 3)
            this.updatePodium(performers.slice(0, 3));

            // Update table (all)
            this.updateTable(performers);

            // Update timestamp
            this.$widget.find('.pf-last-updated time').text(new Date().toLocaleTimeString());

            // Store ranks for trend calculation
            performers.forEach((p, index) => {
                this.previousRanks[p.id] = index + 1;
            });
        },

        updatePodium: function(topThree) {
            const positions = [1, 2, 3];
            positions.forEach((pos, index) => {
                const $podium = this.$widget.find('.pf-podium-' + pos);
                const performer = topThree[index];

                if (!performer) {
                    $podium.find('.pf-podium-name').text('--');
                    $podium.find('.pf-podium-score').text('');
                    $podium.find('.pf-podium-photo').html('');
                    return;
                }

                $podium.find('.pf-podium-name').text(performer.name);

                if (this.showScores && performer.score !== undefined) {
                    $podium.find('.pf-podium-score').text(performer.score.toLocaleString() + ' pts');
                }

                const $photo = $podium.find('.pf-podium-photo');
                if (performer.photo_url) {
                    $photo.html('<img src="' + this.escapeHtml(performer.photo_url) + '" alt="' + this.escapeHtml(performer.name) + '">');
                } else {
                    $photo.html(this.getInitials(performer.name));
                }
            });
        },

        updateTable: function(performers) {
            const $tbody = this.$widget.find('.pf-leaderboard-table tbody');
            $tbody.empty();

            performers.forEach((performer, index) => {
                const rank = index + 1;
                const rankClass = rank <= 3 ? 'pf-rank-' + rank : 'pf-rank-other';
                const trend = this.getTrend(performer.id, rank);

                let $row = $('<tr></tr>');

                // Rank
                $row.append('<td class="pf-rank-col"><span class="pf-rank ' + rankClass + '">' + rank + '</span></td>');

                // Performer
                const photoHtml = performer.photo_url
                    ? '<img src="' + this.escapeHtml(performer.photo_url) + '" alt="">'
                    : this.getInitials(performer.name);

                $row.append(`
                    <td class="pf-performer-col">
                        <div class="pf-performer-cell">
                            <div class="pf-performer-avatar">${photoHtml}</div>
                            <span class="pf-performer-name">${this.escapeHtml(performer.name)}</span>
                        </div>
                    </td>
                `);

                // Score
                if (this.showScores) {
                    const score = performer.score !== undefined ? performer.score.toLocaleString() : '-';
                    $row.append('<td class="pf-score-col"><span class="pf-score-value">' + score + '</span></td>');
                }

                // Trend
                $row.append('<td class="pf-trend-col">' + trend + '</td>');

                $tbody.append($row);
            });
        },

        getTrend: function(performerId, currentRank) {
            if (!this.previousRanks[performerId]) {
                return '<span class="pf-trend-same">-</span>';
            }

            const previousRank = this.previousRanks[performerId];
            if (currentRank < previousRank) {
                return '<span class="pf-trend-up">▲</span>';
            } else if (currentRank > previousRank) {
                return '<span class="pf-trend-down">▼</span>';
            }
            return '<span class="pf-trend-same">-</span>';
        },

        getInitials: function(name) {
            if (!name) return '?';
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        },

        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    $(document).ready(function() {
        Leaderboard.init();
    });

})(jQuery);
