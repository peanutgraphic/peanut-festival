/**
 * Winner Announcement with Celebration Effects
 * Peanut Festival v1.1.0
 */
(function($) {
    'use strict';

    const WinnerAnnouncement = {
        init: function() {
            this.$widget = $('.pf-winner-widget');
            if (!this.$widget.length) return;

            this.useConfetti = pfWinner.confetti === true;
            this.useSound = pfWinner.sound === true;

            // Trigger celebration on load
            this.celebrate();
        },

        celebrate: function() {
            if (this.useConfetti && typeof confetti === 'function') {
                this.fireConfetti();
            }

            if (this.useSound) {
                this.playSound();
            }

            // Add entrance animation class
            this.$widget.find('.pf-winner-container').addClass('pf-celebrated');
        },

        fireConfetti: function() {
            const duration = 5 * 1000;
            const end = Date.now() + duration;

            // Fire confetti from both sides
            const colors = ['#fbbf24', '#f59e0b', '#6366f1', '#8b5cf6', '#ef4444'];

            (function frame() {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: colors
                });

                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());

            // Fire a big burst in the center
            setTimeout(function() {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: colors
                });
            }, 500);

            // Fire more bursts
            setTimeout(function() {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 80,
                    origin: { x: 0.2, y: 0.5 },
                    colors: colors
                });
            }, 1000);

            setTimeout(function() {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 80,
                    origin: { x: 0.8, y: 0.5 },
                    colors: colors
                });
            }, 1500);
        },

        playSound: function() {
            // Create audio context for celebration sound
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioContext();

                // Simple fanfare-like beeps
                const playNote = (frequency, startTime, duration) => {
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();

                    oscillator.type = 'triangle';
                    oscillator.frequency.value = frequency;
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + startTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);

                    oscillator.start(audioCtx.currentTime + startTime);
                    oscillator.stop(audioCtx.currentTime + startTime + duration);
                };

                // Play a simple fanfare
                playNote(523.25, 0, 0.2);     // C5
                playNote(659.25, 0.15, 0.2);  // E5
                playNote(783.99, 0.3, 0.2);   // G5
                playNote(1046.50, 0.45, 0.5); // C6

            } catch (e) {
                console.log('Audio playback not supported');
            }
        }
    };

    $(document).ready(function() {
        WinnerAnnouncement.init();
    });

    // Re-trigger on visibility change (for embedded displays)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible' && WinnerAnnouncement.$widget) {
            WinnerAnnouncement.celebrate();
        }
    });

})(jQuery);
