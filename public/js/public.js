/**
 * Peanut Festival Public Scripts
 */
(function($) {
    'use strict';

    var API_URL = pfPublic.apiUrl;

    // Generate unique token for voting
    function generateToken() {
        var stored = localStorage.getItem('pf_vote_token');
        if (stored) return stored;
        var token = 'pf_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
        localStorage.setItem('pf_vote_token', token);
        return token;
    }

    // ==================== VOTING WIDGET ====================
    window.PFVoting = {
        widget: null,
        showSlug: '',
        topN: 3,
        showTimer: true,
        selected: [],
        timerInterval: null,

        init: function($widget) {
            this.widget = $widget;
            this.showSlug = $widget.data('show');
            this.topN = parseInt($widget.data('top-n')) || 3;
            this.showTimer = $widget.data('show-timer') == 1;
            this.selected = [];
            this.loadStatus();
        },

        loadStatus: function() {
            var self = this;
            $.get(API_URL + '/vote/status/' + this.showSlug)
                .done(function(response) {
                    if (response.success && response.data) {
                        self.render(response.data);
                    } else {
                        self.showClosed();
                    }
                })
                .fail(function() {
                    self.showError('Failed to load voting status');
                });
        },

        render: function(data) {
            var self = this;
            var $loading = this.widget.find('.pf-vote-loading');
            var $content = this.widget.find('.pf-vote-content');
            var $closed = this.widget.find('.pf-vote-closed');

            if (!data.is_open || data.active_group === 'pool') {
                $loading.hide();
                $closed.show();
                return;
            }

            // Update group name
            var groupName = data.active_group.replace('group', 'Group ').toUpperCase();
            this.widget.find('.pf-vote-group-name').text(groupName);

            // Render performers
            var $grid = this.widget.find('.pf-performers-grid');
            $grid.empty();

            data.performers.forEach(function(performer) {
                var $card = $('<div class="pf-performer-card" data-id="' + performer.id + '">' +
                    '<img class="pf-performer-photo" src="' + (performer.photo_url || '') + '" alt="">' +
                    '<div class="pf-performer-name">' + self.escapeHtml(performer.name) + '</div>' +
                    (performer.bio ? '<div class="pf-performer-bio">' + self.escapeHtml(performer.bio) + '</div>' : '') +
                    '</div>');
                $grid.append($card);
            });

            // Timer
            if (this.showTimer && data.time_remaining > 0) {
                this.widget.find('.pf-vote-timer').show();
                this.startTimer(data.time_remaining);
            }

            // Bind events
            $grid.off('click').on('click', '.pf-performer-card', function() {
                self.toggleSelection($(this));
            });

            this.widget.find('.pf-clear-vote').off('click').on('click', function() {
                self.clearSelection();
            });

            this.widget.find('.pf-submit-vote').off('click').on('click', function() {
                self.submitVote();
            });

            $loading.hide();
            $content.show();
        },

        toggleSelection: function($card) {
            var id = $card.data('id');
            var index = this.selected.indexOf(id);

            if (index > -1) {
                // Remove from selection
                this.selected.splice(index, 1);
                $card.removeClass('pf-selected');
                $card.find('.pf-performer-rank').remove();
            } else if (this.selected.length < this.topN) {
                // Add to selection
                this.selected.push(id);
                $card.addClass('pf-selected');
                $card.prepend('<div class="pf-performer-rank">' + this.selected.length + '</div>');
            }

            this.updateSelectionDisplay();
        },

        clearSelection: function() {
            this.selected = [];
            this.widget.find('.pf-performer-card').removeClass('pf-selected');
            this.widget.find('.pf-performer-rank').remove();
            this.updateSelectionDisplay();
        },

        updateSelectionDisplay: function() {
            var $list = this.widget.find('.pf-selections-list');
            var $submit = this.widget.find('.pf-submit-vote');
            $list.empty();

            var self = this;
            this.selected.forEach(function(id, index) {
                var $card = self.widget.find('.pf-performer-card[data-id="' + id + '"]');
                var name = $card.find('.pf-performer-name').text();
                $list.append('<span class="pf-selection-tag"><span class="pf-selection-rank">#' + (index + 1) + '</span> ' + name + '</span>');
            });

            // Update rank badges
            this.widget.find('.pf-performer-card').each(function() {
                var id = $(this).data('id');
                var rank = self.selected.indexOf(id) + 1;
                $(this).find('.pf-performer-rank').text(rank);
            });

            $submit.prop('disabled', this.selected.length === 0);
        },

        submitVote: function() {
            var self = this;
            var $btn = this.widget.find('.pf-submit-vote');
            $btn.prop('disabled', true).text('Submitting...');

            $.ajax({
                url: API_URL + '/vote/submit',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    show_slug: this.showSlug,
                    performer_ids: this.selected,
                    token: generateToken()
                })
            })
            .done(function(response) {
                if (response.success) {
                    self.showSuccess();
                } else {
                    if (response.message && response.message.includes('already voted')) {
                        self.showAlreadyVoted();
                    } else {
                        self.showError(response.message || 'Failed to submit vote');
                    }
                }
            })
            .fail(function(xhr) {
                var msg = xhr.responseJSON?.message || 'Failed to submit vote';
                if (msg.includes('already voted')) {
                    self.showAlreadyVoted();
                } else {
                    self.showError(msg);
                }
            });
        },

        startTimer: function(seconds) {
            var self = this;
            var remaining = seconds;
            var $display = this.widget.find('.pf-timer-display');

            if (this.timerInterval) clearInterval(this.timerInterval);

            function update() {
                var mins = Math.floor(remaining / 60);
                var secs = remaining % 60;
                $display.text(mins + ':' + (secs < 10 ? '0' : '') + secs);

                if (remaining <= 0) {
                    clearInterval(self.timerInterval);
                    self.showClosed();
                }
                remaining--;
            }

            update();
            this.timerInterval = setInterval(update, 1000);
        },

        showSuccess: function() {
            this.widget.find('.pf-vote-content').hide();
            this.widget.find('.pf-vote-success').show();
        },

        showClosed: function() {
            this.widget.find('.pf-vote-loading').hide();
            this.widget.find('.pf-vote-content').hide();
            this.widget.find('.pf-vote-closed').show();
        },

        showAlreadyVoted: function() {
            this.widget.find('.pf-vote-content').hide();
            this.widget.find('.pf-vote-already').show();
        },

        showError: function(message) {
            var $msg = this.widget.find('.pf-vote-message');
            $msg.html('<div class="pf-error">' + this.escapeHtml(message) + '</div>').show();
        },

        escapeHtml: function(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
    };

    // ==================== SCHEDULE FILTERS ====================
    window.PFSchedule = {
        init: function($widget) {
            var self = this;
            $widget.find('.pf-filter-select').on('change', function() {
                self.applyFilters($widget);
            });
        },

        applyFilters: function($widget) {
            var dateFilter = $widget.find('#pf-filter-date').val();
            var venueFilter = $widget.find('#pf-filter-venue').val();

            $widget.find('.pf-schedule-day').each(function() {
                var $day = $(this);
                var date = $day.data('date');
                var showDay = !dateFilter || dateFilter === date;

                if (!showDay) {
                    $day.hide();
                    return;
                }

                var hasVisibleShows = false;
                $day.find('.pf-show-card').each(function() {
                    var $card = $(this);
                    var venue = $card.data('venue');
                    var showCard = !venueFilter || venueFilter === venue;
                    $card.toggle(showCard);
                    if (showCard) hasVisibleShows = true;
                });

                $day.toggle(hasVisibleShows);
            });
        }
    };

    // ==================== FLYER GENERATOR ====================
    window.PFFlyer = {
        canvas: null,
        ctx: null,
        template: null,
        mask: null,
        userImage: null,
        name: '',
        zoom: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        lastX: 0,
        lastY: 0,

        init: function($widget) {
            var self = this;
            this.canvas = document.getElementById('pf-flyer-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            // Load template
            var $select = $widget.find('#pf-template-select');
            if ($select.length) {
                this.loadTemplate($select.find(':selected'));
                $select.on('change', function() {
                    self.loadTemplate($(this).find(':selected'));
                });
            } else {
                // Single template
                var $option = $widget.find('[data-template]').first();
                if ($option.length) this.loadTemplate($option);
            }

            // Name input
            $widget.find('#pf-performer-name').on('input', function() {
                self.name = $(this).val();
                self.render();
            });

            // Image upload
            $widget.find('#pf-upload-btn').on('click', function() {
                $widget.find('#pf-performer-image').click();
            });

            $widget.find('#pf-performer-image').on('change', function(e) {
                var file = e.target.files[0];
                if (file) self.loadUserImage(file);
            });

            // Zoom and rotation
            $widget.find('#pf-zoom').on('input', function() {
                self.zoom = parseFloat($(this).val());
                self.render();
            });

            $widget.find('#pf-rotate').on('input', function() {
                self.rotation = parseInt($(this).val());
                self.render();
            });

            // Drag to reposition
            $(this.canvas).on('mousedown touchstart', function(e) {
                if (!self.userImage) return;
                self.dragging = true;
                var pos = self.getEventPos(e);
                self.lastX = pos.x;
                self.lastY = pos.y;
                e.preventDefault();
            });

            $(document).on('mousemove touchmove', function(e) {
                if (!self.dragging) return;
                var pos = self.getEventPos(e);
                self.offsetX += pos.x - self.lastX;
                self.offsetY += pos.y - self.lastY;
                self.lastX = pos.x;
                self.lastY = pos.y;
                self.render();
            });

            $(document).on('mouseup touchend', function() {
                self.dragging = false;
            });

            // Download
            $widget.find('#pf-download-flyer').on('click', function() {
                self.download();
            });
        },

        loadTemplate: function($option) {
            var self = this;
            var templateUrl = $option.data('template');
            var maskUrl = $option.data('mask');
            this.frame = $option.data('frame') || { x: 100, y: 100, w: 400, h: 400 };
            this.namebox = $option.data('namebox') || { x: 540, y: 950, w: 500, size: 48, color: '#ffffff', align: 'center' };

            this.template = new Image();
            this.template.crossOrigin = 'anonymous';
            this.template.onload = function() {
                self.render();
            };
            this.template.src = templateUrl;

            if (maskUrl) {
                this.mask = new Image();
                this.mask.crossOrigin = 'anonymous';
                this.mask.onload = function() {
                    self.render();
                };
                this.mask.src = maskUrl;
            } else {
                this.mask = null;
            }
        },

        loadUserImage: function(file) {
            var self = this;
            var reader = new FileReader();
            reader.onload = function(e) {
                self.userImage = new Image();
                self.userImage.onload = function() {
                    self.zoom = 1;
                    self.rotation = 0;
                    self.offsetX = 0;
                    self.offsetY = 0;
                    $('.pf-image-adjustments').show();
                    $('#pf-download-flyer').prop('disabled', false);
                    self.render();
                };
                self.userImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        render: function() {
            if (!this.template || !this.template.complete) return;

            var ctx = this.ctx;
            var canvas = this.canvas;
            var frame = this.frame;
            var namebox = this.namebox;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw user image in frame
            if (this.userImage) {
                ctx.save();

                // Clip to frame
                ctx.beginPath();
                ctx.rect(frame.x, frame.y, frame.w, frame.h);
                ctx.clip();

                // Transform for zoom/rotation
                var centerX = frame.x + frame.w / 2 + this.offsetX;
                var centerY = frame.y + frame.h / 2 + this.offsetY;
                ctx.translate(centerX, centerY);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.scale(this.zoom, this.zoom);

                // Draw centered
                var imgW = this.userImage.width;
                var imgH = this.userImage.height;
                var scale = Math.max(frame.w / imgW, frame.h / imgH);
                var drawW = imgW * scale;
                var drawH = imgH * scale;
                ctx.drawImage(this.userImage, -drawW / 2, -drawH / 2, drawW, drawH);

                ctx.restore();
            }

            // Draw template on top
            ctx.drawImage(this.template, 0, 0, canvas.width, canvas.height);

            // Draw mask if available (for cutout effect)
            if (this.mask && this.mask.complete) {
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(this.mask, 0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'source-over';
            }

            // Draw name
            if (this.name) {
                ctx.save();
                ctx.font = 'bold ' + namebox.size + 'px Arial';
                ctx.fillStyle = namebox.color || '#ffffff';
                ctx.textAlign = namebox.align || 'center';
                ctx.textBaseline = 'middle';

                // Stroke for readability
                if (namebox.stroke) {
                    ctx.strokeStyle = namebox.stroke;
                    ctx.lineWidth = namebox.stroke_w || 2;
                    ctx.strokeText(this.name, namebox.x, namebox.y);
                }

                ctx.fillText(this.name, namebox.x, namebox.y);
                ctx.restore();
            }
        },

        getEventPos: function(e) {
            var rect = this.canvas.getBoundingClientRect();
            var touch = e.touches ? e.touches[0] : e;
            return {
                x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
                y: (touch.clientY - rect.top) * (this.canvas.height / rect.height)
            };
        },

        download: function() {
            var link = document.createElement('a');
            link.download = 'flyer-' + (this.name || 'performer').toLowerCase().replace(/\s+/g, '-') + '.png';
            link.href = this.canvas.toDataURL('image/png');
            link.click();
        }
    };

    // ==================== FORM HANDLERS ====================
    window.PFForms = {
        init: function($form, endpoint) {
            var self = this;
            $form.on('submit', function(e) {
                e.preventDefault();
                self.submit($(this), endpoint);
            });
        },

        submit: function($form, endpoint) {
            var $widget = $form.closest('.pf-form-widget');
            var $btn = $form.find('button[type="submit"]');
            var $btnText = $btn.find('.pf-btn-text');
            var $btnLoading = $btn.find('.pf-btn-loading');
            var $message = $widget.find('.pf-form-message');

            $btn.prop('disabled', true);
            $btnText.hide();
            $btnLoading.show();
            $message.hide();

            var data = this.serializeForm($form);

            $.ajax({
                url: API_URL + endpoint,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data)
            })
            .done(function(response) {
                if (response.success) {
                    $form.hide();
                    $widget.find('.pf-form-success').show();
                } else {
                    $message.html('<div class="pf-error">' + (response.message || 'Submission failed') + '</div>').show();
                    $btn.prop('disabled', false);
                    $btnText.show();
                    $btnLoading.hide();
                }
            })
            .fail(function(xhr) {
                var msg = xhr.responseJSON?.message || 'Submission failed. Please try again.';
                $message.html('<div class="pf-error">' + msg + '</div>').show();
                $btn.prop('disabled', false);
                $btnText.show();
                $btnLoading.hide();
            });
        },

        serializeForm: function($form) {
            var data = {};
            var arrays = {};

            $form.find('input, select, textarea').each(function() {
                var $el = $(this);
                var name = $el.attr('name');
                if (!name) return;

                // Handle arrays (checkboxes with [])
                if (name.endsWith('[]')) {
                    var baseName = name.slice(0, -2);
                    if (!arrays[baseName]) arrays[baseName] = [];
                    if ($el.is(':checked')) {
                        arrays[baseName].push($el.val());
                    }
                    return;
                }

                // Handle checkboxes
                if ($el.attr('type') === 'checkbox') {
                    data[name] = $el.is(':checked');
                    return;
                }

                // Handle social links
                if (name.startsWith('social_')) {
                    if (!data.social_links) data.social_links = {};
                    var platform = name.replace('social_', '');
                    var val = $el.val().trim();
                    if (val) data.social_links[platform] = val;
                    return;
                }

                data[name] = $el.val();
            });

            // Merge arrays
            for (var key in arrays) {
                data[key] = arrays[key];
            }

            return data;
        }
    };

    // ==================== INITIALIZATION ====================
    $(document).ready(function() {
        // Voting widgets
        $('.pf-voting-widget').each(function() {
            var voting = Object.create(PFVoting);
            voting.init($(this));
        });

        // Schedule widgets
        $('.pf-schedule-widget').each(function() {
            PFSchedule.init($(this));
        });

        // Flyer widgets
        $('.pf-flyer-widget').each(function() {
            PFFlyer.init($(this));
        });

        // Forms
        $('#pf-performer-form').each(function() {
            PFForms.init($(this), '/apply/performer');
        });

        $('#pf-volunteer-form').each(function() {
            PFForms.init($(this), '/volunteer/signup');
        });

        $('#pf-vendor-form').each(function() {
            PFForms.init($(this), '/apply/vendor');
        });
    });

})(jQuery);
