/* =========================================
   FEATURE: Scroll Animation
   Description: Smooth scroll to products
   ========================================= */

import { SCROLL_CONFIG } from '../core/config.js';

let isInitialized = false;
const elements = {};

/** ⚙️ Action: Initialize scroll animation */
/** ?? Action */
/** ?? Core */
export const initScrollAnimation = () => {
    if (isInitialized) return;

    elements.categoryButtons = document.querySelectorAll('.category-filter');
    elements.heroButtons = document.querySelectorAll('.hero-btn');

    bindEvents();

    isInitialized = true;
};

/** 🔧 Core: Bind events */
const bindEvents = () => {
    elements.categoryButtons.forEach(btn => {
        btn.addEventListener('click', handleCategoryClick);
    });

    elements.heroButtons.forEach(btn => {
        btn.addEventListener('click', handleHeroClick);
    });
};

/** 🔧 Core: Handle category click */
const handleCategoryClick = () => {
    setTimeout(scrollToConfiguredPosition, 50);
};

/** 🔧 Core: Handle hero click */
const handleHeroClick = (e) => {
    e.preventDefault();
    scrollToConfiguredPosition();
};

/** ⚙️ Action: Scroll to configured position */
/** ?? Action */
export const scrollToConfiguredPosition = () => {
    const targetY = SCROLL_CONFIG.Y_COORDINATE;
    const duration = SCROLL_CONFIG.DURATION;
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    let startTime = null;

    const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easedProgress = progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

        window.scrollTo(0, startY + (distance * easedProgress));

        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    };

    requestAnimationFrame(animation);
};
