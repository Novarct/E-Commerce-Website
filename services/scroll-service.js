/* =========================================
   SERVICE: Scroll
   Description: Smooth scroll animations
   ========================================= */

import { Logger } from '../core/logger.js';

export class ScrollService {
    /** ⚙️ Action: Scroll to element */
    static toElement(elementId, options = {}) {
        const { duration = 1000, offset = 0, callback = null } = options;

        const target = document.getElementById(elementId);
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        this.toCoordinates(0, targetPosition, { duration, callback });
    }

    /** ⚙️ Action: Scroll to coordinates */
    static toCoordinates(x, y, options = {}) {
        const { duration = 800, callback = null } = options;

        const startX = window.pageXOffset;
        const startY = window.pageYOffset;
        const distanceX = x - startX;
        const distanceY = y - startY;
        let startTime = null;

        const easeInOutCubic = (t) => {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = easeInOutCubic(progress);
            const currentX = startX + (distanceX * easedProgress);
            const currentY = startY + (distanceY * easedProgress);

            window.scrollTo(currentX, currentY);

            if (progress < 1) {
                requestAnimationFrame(animation);
            } else if (callback) {
                callback();
            }
        };

        requestAnimationFrame(animation);
    }

    /** ⚙️ Action: Scroll to top */
    static toTop(duration = 600) {
        this.toCoordinates(0, 0, { duration });
    }

    /** 🔍 Query: Get position */
    static getPosition() {
        return {
            x: window.pageXOffset,
            y: window.pageYOffset
        };
    }

    /** 🔍 Query: Check if in viewport */
    static isInViewport(element) {
        const el = typeof element === 'string'
            ? document.getElementById(element)
            : element;

        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}
