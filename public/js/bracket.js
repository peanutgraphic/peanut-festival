/**
 * Tournament Bracket Live Updates
 * Peanut Festival v1.1.0
 */
(function($) {
    'use strict';

    const BracketWidget = {
        init: function() {
            this.$widget = $('.pf-bracket-widget');
            if (!this.$widget.length) return;

            this.competitionId = this.$widget.data('competition-id');
            this.showVotes = this.$widget.data('show-votes') === true;
            this.animate = this.$widget.data('animate') === true;
            this.refreshInterval = pfBracket.refreshInterval || 5000;

            this.showContent();
            this.startPolling();
            this.bindEvents();
        },

        showContent: function() {
            this.$widget.find('.pf-bracket-loading').hide();
            this.$widget.find('.pf-bracket-container').show();
        },

        startPolling: function() {
            // Only poll if competition is active
            const status = this.$widget.find('.pf-bracket-status').text().toLowerCase();
            if (status === 'active') {
                setInterval(() => this.fetchUpdates(), this.refreshInterval);
            }
        },

        fetchUpdates: function() {
            $.ajax({
                url: pfBracket.apiUrl + '/competitions/' + this.competitionId + '/bracket',
                method: 'GET',
                headers: {
                    'X-WP-Nonce': pfBracket.nonce
                },
                success: (response) => {
                    if (response.bracket) {
                        this.updateBracket(response.bracket);
                    }
                },
                error: (xhr) => {
                    console.error('Failed to fetch bracket updates', xhr);
                }
            });
        },

        updateBracket: function(bracket) {
            const self = this;

            // Update each match
            if (bracket.matches) {
                bracket.matches.forEach(function(match) {
                    const $match = self.$widget.find('.pf-match[data-match-id="' + match.id + '"]');
                    if (!$match.length) return;

                    // Update status
                    $match.removeClass('pf-match-pending pf-match-voting pf-match-completed')
                          .addClass('pf-match-' + match.status);

                    // Update votes if showing
                    if (self.showVotes) {
                        const $votes1 = $match.find('.pf-contestant-1 .pf-contestant-votes');
                        const $votes2 = $match.find('.pf-contestant-2 .pf-contestant-votes');

                        if ($votes1.length) {
                            self.animateNumber($votes1, match.votes_performer_1 || 0);
                        }
                        if ($votes2.length) {
                            self.animateNumber($votes2, match.votes_performer_2 || 0);
                        }
                    }

                    // Update winner
                    $match.find('.pf-match-contestant').removeClass('pf-winner');
                    if (match.winner_id) {
                        if (match.winner_id == match.performer_1_id) {
                            $match.find('.pf-contestant-1').addClass('pf-winner');
                        } else if (match.winner_id == match.performer_2_id) {
                            $match.find('.pf-contestant-2').addClass('pf-winner');
                        }
                    }

                    // Update voting badge
                    const $vs = $match.find('.pf-match-vs');
                    if (match.status === 'voting') {
                        $vs.html('<span class="pf-voting-badge">LIVE</span>');
                        if (!$match.find('.pf-match-vote-cta').length) {
                            $match.append('<div class="pf-match-vote-cta"><a href="#vote-match-' + match.id + '" class="pf-vote-now-btn">Vote Now</a></div>');
                        }
                    } else {
                        $vs.html('<span>vs</span>');
                        $match.find('.pf-match-vote-cta').remove();
                    }
                });
            }

            // Update champion if set
            if (bracket.winner) {
                let $champion = self.$widget.find('.pf-bracket-champion');
                if (!$champion.length) {
                    $champion = $('<div class="pf-bracket-champion"><div class="pf-trophy-icon">🏆</div><h3>Champion</h3><div class="pf-champion-name"></div></div>');
                    self.$widget.find('.pf-bracket-rounds').after($champion);
                }
                $champion.find('.pf-champion-name').text(bracket.winner.name);
                if (bracket.winner.photo_url) {
                    if (!$champion.find('.pf-champion-photo').length) {
                        $champion.append('<img src="" alt="" class="pf-champion-photo">');
                    }
                    $champion.find('.pf-champion-photo').attr('src', bracket.winner.photo_url);
                }
            }
        },

        animateNumber: function($el, newValue) {
            if (!this.animate) {
                $el.text(newValue);
                return;
            }

            const currentValue = parseInt($el.text()) || 0;
            if (currentValue === newValue) return;

            $({ value: currentValue }).animate({ value: newValue }, {
                duration: 500,
                step: function() {
                    $el.text(Math.round(this.value));
                },
                complete: function() {
                    $el.text(newValue);
                }
            });
        },

        bindEvents: function() {
            // Vote now button clicks
            this.$widget.on('click', '.pf-vote-now-btn', function(e) {
                e.preventDefault();
                const matchId = $(this).attr('href').replace('#vote-match-', '');
                // Scroll to match or open voting modal
                window.location.hash = 'vote-match-' + matchId;
            });
        }
    };

    $(document).ready(function() {
        BracketWidget.init();
    });

})(jQuery);
