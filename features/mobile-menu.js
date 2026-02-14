/* =========================================
   FEATURE: Mobile Menu
   Description: Back to top button
   ========================================= */

import { ScrollService } from '../services/scroll-service.js';

let isInitialized = false;
const elements = {};

/** ⚙️ Action: Initialize back to top */
/** ?? Action */
/** ?? Core */
export const initBackToTop = () => {
    if (isInitialized) return;

    elements.backToTopBtn = document.getElementById('back-to-top');

    bindEvents();

    isInitialized = true;
};

/** 🔧 Core: Bind events */
const bindEvents = () => {
    window.addEventListener('scroll', handleScroll);
    elements.backToTopBtn.addEventListener('click', () => ScrollService.toTop());
};

/** 🔧 Core: Handle scroll */
const handleScroll = () => {
    if (window.scrollY > 300) {
        elements.backToTopBtn.classList.add('show');
    } else {
        elements.backToTopBtn.classList.remove('show');
    }
};
