/* =========================================
   FEATURE: Translation Manager
   Description: Apply translations to UI
   ========================================= */

import { t } from '../utils/helpers.js';
import { state, setState } from '../core/state.js';
import { translations } from '../systems/i18n-engine.js';

if (!state.translations || Object.keys(state.translations).length === 0) {
    setState('translations', translations);
}

/** ⚙️ Action: Apply translations */
/** ?? Action */
export const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if (k) el.textContent = t(k); });

    const searchInput = document.getElementById('search-input');
    searchInput.placeholder = t('searchPlaceholder');

    const curLang = document.getElementById('current-lang');
    curLang.textContent = t(state.currentLang === 'vi' ? 'vietnamese' : 'english');

    const currEl = document.getElementById('current-currency');
    currEl.textContent = state.currentCurrency;

    const backToTop = document.getElementById('back-to-top');
    backToTop.setAttribute('aria-label', t('backToTop'));

    applyTranslationsModals();
};

/** ⚙️ Action: Apply modal translations */
const applyTranslationsModals = () => {
    const map = [
        ['#language-modal h2', 'selectLanguage'], ['#support-modal h2', 'supportTitle'], ['#currency-modal h2', 'selectCurrency'],
        ['#privacy-modal h2', 'privacyPolicy'], ['#terms-modal h2', 'termsOfService'], ['#shipping-modal h2', 'shippingInfo'],
        ['#checkout-modal h2', 'checkout'], ['#place-order-btn', 'placeOrder'],
        ['.cart-header h3', 'yourCart'], ['.cart-footer .checkout-total span:first-child', 'subtotal'], ['.cart-footer .checkout-btn', 'proceedCheckout'],
        ['.wishlist-header h3', 'yourWishlist'], ['#upcoming-section h2', 'upcomingReleases'],
        ['#checkout-modal .checkout-section:nth-child(1) h3', 'shippingAddress'], ['#checkout-modal .checkout-section:nth-child(2) h3', 'orderSummary'],
        ['#checkout-modal .checkout-total span:first-child', 'total'],
        ['#account h2', 'userProfile'], ['#logout-btn', 'logout']
    ];
    map.forEach(([sel, key]) => { const el = document.querySelector(sel); if (el) el.textContent = t(key); });

    const auth = document.getElementById('auth-modal');
    auth.querySelector('input[type="email"]').placeholder = t('emailPlaceholder');
    auth.querySelector('input[type="password"]').placeholder = t('passwordPlaceholder');

    const cf = document.getElementById('checkout-form');
    [...cf.querySelectorAll('input')].forEach((inp, i) => {
        inp.placeholder = t(['fullName', 'email', 'address', 'city', 'stateProvince', 'zipCode'][i]);
    });

    document.querySelectorAll('.footer-column h4').forEach((el, i) => {
        el.textContent = [t('quickLinks'), t('followUs')][i] || el.textContent;
    });

    ['support', 'privacy', 'terms', 'shipping'].forEach(name => {
        const body = document.querySelector(`#${name}-modal .info-modal-body`);
        if (body && t(name + 'Body')) body.innerHTML = t(name + 'Body');
    });
};
