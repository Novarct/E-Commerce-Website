/* =========================================
   FEATURE: Top Bar
   Description: Top navigation and modals
   ========================================= */

import { showModal, hideModal } from '../utils/helpers.js';
import { setState } from '../core/state.js';

let isInitialized = false;
const elements = {};

/** ⚙️ Action: Initialize top bar */
/** ?? Action */
/** ?? Core */
export const initTopBar = () => {
    if (isInitialized) return;

    elements.links = document.querySelectorAll('.top-bar-link, .footer-link');
    elements.modals = document.querySelectorAll('.modal-overlay');
    elements.langBtns = document.querySelectorAll('#language-modal .lang-btn[data-lang]');
    elements.currencyBtns = document.querySelectorAll('#currency-modal .currency-btn[data-currency]');

    bindEvents();

    isInitialized = true;
};

/** 🔧 Core: Bind events */
const bindEvents = () => {
    elements.links.forEach(link => {
        link.addEventListener('click', handleLinkClick);
    });

    elements.modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => hideModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal(modal);
        });
    });

    elements.langBtns.forEach(btn => {
        btn.addEventListener('click', () => handleLangSwitch(btn));
    });

    elements.currencyBtns.forEach(btn => {
        btn.addEventListener('click', () => handleCurrencySwitch(btn));
    });
};

/** 🔧 Core: Handle link click */
const handleLinkClick = (e) => {
    const link = e.currentTarget;
    const modalId = link.dataset.modal;

    if (modalId) {
        e.preventDefault();
        const modal = document.getElementById(modalId);
        showModal(modal);
    }
};

/** 🔧 Core: Handle language switch */
const handleLangSwitch = (btn) => {
    elements.langBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setState('currentLang', btn.dataset.lang);
    hideModal(document.getElementById('language-modal'));
};

/** 🔧 Core: Handle currency switch */
const handleCurrencySwitch = (btn) => {
    elements.currencyBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setState('currentCurrency', btn.dataset.currency);
    hideModal(document.getElementById('currency-modal'));
};
