/* =========================================
   UTILITIES: Helpers
   Description: Common utility functions
   ========================================= */

import { getState } from '../core/state.js';
import { USD_TO_VND } from '../core/constants.js';

/** 🔧 Core: Format price to currency */
/** ?? Action */
export const formatPrice = (price) => {
    const currency = getState('currentCurrency').toUpperCase();
    const val = parseFloat(price);

    if (currency === 'VND') {
        const converted = val * USD_TO_VND;
        return `${converted.toLocaleString('vi-VN')} ₫`;
    }

    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** 🌐 Query: Get translation for key */
/** ?? Action */
export const t = (key) => {
    const lang = getState('currentLang');
    const translations = getState('translations');
    return translations[lang]?.[key] || key;
};

/** ⚙️ Action: Show modal */
/** ?? Action */
export const showModal = (modal) => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    void modal.offsetHeight;

    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
};

/** ⚙️ Action: Hide modal */
/** ?? Action */
export const hideModal = (modal) => {
    modal.classList.remove('show');
    document.body.style.overflow = '';
};

/** 🎨 Render: Image with fallback */
/** ?? Action */
/** ?? Query */
export const getImageWithFallback = (src, alt, className = '', style = '') => {
    const safeSrc = src || 'assets/placeholder.svg';
    const safeAlt = renderSafe(alt || 'Product Image');
    return `<img src="${safeSrc}" alt="${safeAlt}" class="${className}" style="${style}" onerror="this.onerror=null;this.src='assets/placeholder.svg';">`;
};

/** 🔒 Security: Render safe HTML string */
/** ?? Action */
/** ?? Render */
export const renderSafe = (str) => {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
};
