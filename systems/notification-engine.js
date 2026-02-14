/* =========================================
   SYSTEM: Notification Engine
   Description: Toast notifications and visual effects
   ========================================= */

import { Logger } from '../core/logger.js';

export const NotificationSystem = {
    container: null,
    initialized: false,

    /** ⚙️ Action: Initialize notification system */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.container = document.getElementById('notification-container');
        Logger.log('UI', 'Notification System Initialized');

        document.addEventListener('app:toast', (e) => {
            this.showToast(e.detail.message, e.detail.type);
        });

        document.addEventListener('app:logout', () => {
            Logger.log('UI', '🚪 Logout event - triggering rain');
            this.triggerRain();
        });

        document.addEventListener('app:orderPlaced', () => {
            this.triggerConfetti();
        });

        document.addEventListener('app:registerSuccess', () => {
            this.triggerConfetti();
        });
    },

    /** 🎨 Render: Show toast notification */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        const iconClass = icons[type] || icons.info;

        toast.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
            <div class="toast-progress"></div>
        `;

        this.container.appendChild(toast);

        const dismissToast = () => {
            toast.classList.add('dismissing');
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        };

        toast.addEventListener('click', dismissToast);
        toast.style.cursor = 'pointer';

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(dismissToast, 4000);
    },

    /** ☔ FX: Confetti effect */
    triggerConfetti() {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: ['#3b82f6', '#10b981', '#f59e0b']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: ['#3b82f6', '#10b981', '#f59e0b']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    },

    /** ☔ FX: Rain effect */
    triggerRain() {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:10002';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const drops = [];
        const count = 200;

        class Drop {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.x = Math.random() * width;
                this.y = initial ? Math.random() * height : -20;
                this.length = Math.random() * 20 + 10;
                this.speed = Math.random() * 10 + 10;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.width = Math.random() * 2 + 1;
            }

            update() {
                this.y += this.speed;
                if (this.y > height) this.reset();
            }

            draw() {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
                ctx.lineWidth = this.width;
                ctx.lineCap = 'round';
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.y + this.length);
                ctx.stroke();
            }
        }

        for (let i = 0; i < count; i++) {
            drops.push(new Drop());
        }

        const duration = 3000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;

            ctx.clearRect(0, 0, width, height);
            drops.forEach(drop => {
                drop.update();
                drop.draw();
            });

            if (elapsed > duration - 500) {
                canvas.style.transition = 'opacity 0.5s';
                canvas.style.opacity = '0';
            }

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, { once: true });

        animate();
    },

    /** ☔ FX: Sparkle effect */
    triggerSparkle(element) {
        const rect = element.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 15,
            spread: 40,
            origin: { x, y },
            colors: ['#FFD700', '#FFA500'],
            disableForReducedMotion: true,
            gravity: 0.8,
            ticks: 50,
            scalar: 0.6
        });
    }
};
