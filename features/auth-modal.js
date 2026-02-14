/* =========================================
   FEATURE: Auth Modal
   Description: Login and signup modal
   ========================================= */

import { state } from '../core/state.js';
import { t, showModal, hideModal } from '../utils/helpers.js';
import { updateCartUI } from './cart-panel.js';
import { updateWishlistUI } from './wishlist-panel.js';
import { getHistory } from './history-panel.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { AuthService } from '../services/auth-service.js';
import { Logger } from '../core/logger.js';

let authModalEl;
let tabLoginBtn;
let tabSignupBtn;
let loginFormEl;
let authTitleEl;
let authTextEl;
let accountLinkEl;

/** ?? Action */
export const showAuthModal = (title, text) => {
    authModalEl = document.getElementById('auth-modal');
    authTitleEl = document.getElementById('auth-modal-title');
    authTextEl = document.getElementById('auth-modal-text');
    tabSignupBtn = document.getElementById('tab-signup');

    authTitleEl.textContent = title || t('loginRequired');
    authTextEl.textContent = text || t('loginRequiredText');
    tabSignupBtn.click(); // Changed to show Sign Up first
    showModal(authModalEl);
};

/** ⚙️ Action: Hide auth modal */
/** ?? Action */
export const hideAuthModal = () => {
    authModalEl = document.getElementById('auth-modal');
    hideModal(authModalEl);
};

let authInitialized = false;

/** ⚙️ Action: Initialize auth modal */
/** ?? Action */
/** ?? Core */
export const initAuthModal = () => {
    if (authInitialized) return;
    authInitialized = true;

    authModalEl = document.getElementById('auth-modal');
    tabLoginBtn = document.getElementById('tab-login');
    tabSignupBtn = document.getElementById('tab-signup');
    loginFormEl = document.getElementById('login-form');
    authTitleEl = document.getElementById('auth-modal-title');
    authTextEl = document.getElementById('auth-modal-text');
    accountLinkEl = document.getElementById('account-link');

    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.className = 'login-btn';
        tabSignupBtn.className = 'signup-btn';
        authTitleEl.textContent = t('login');
        document.getElementById('signup-fields').classList.add('hidden');
        document.getElementById('confirm-password-field').classList.add('hidden');
        const submitBtn = loginFormEl.querySelector('button[type="submit"]');
        submitBtn.textContent = t('login');
    });

    tabSignupBtn.addEventListener('click', () => {
        tabSignupBtn.className = 'login-btn';
        tabLoginBtn.className = 'signup-btn';
        authTitleEl.textContent = t('createAccount');
        document.getElementById('signup-fields').classList.remove('hidden');
        document.getElementById('confirm-password-field').classList.remove('hidden');
        const submitBtn = loginFormEl.querySelector('button[type="submit"]');
        submitBtn.textContent = t('signUp');
    });

    loginFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        const confirmPasswordInput = document.getElementById('auth-confirm-password');
        const usernameInput = document.getElementById('signup-username');

        const email = emailInput.value;
        const password = passwordInput.value;
        const isSignup = tabSignupBtn.classList.contains('login-btn');

        if (isSignup) {
            const username = usernameInput.value.trim();
            const confirmPassword = confirmPasswordInput.value;

            AuthService.login(email, { isSignup: true, username });
            Logger.log('AUTH', `🪵 New user registered: ${username} (${email})`);
            NotificationSystem.showToast(t('signupSuccess'), 'success');
            hideAuthModal();
            getHistory();
            updateCartUI();
            updateWishlistUI();
            accountLinkEl.style.color = 'var(--accent-primary)';
        } else {
            AuthService.login(email, { isSignup: false });
            Logger.log('AUTH', `🪵 User logged in: ${email}`);
            NotificationSystem.showToast(t('loginSuccess'), 'success');
            hideAuthModal();
            getHistory();
            updateCartUI();
            updateWishlistUI();
            accountLinkEl.style.color = 'var(--accent-primary)';
        }

        import('./account-panel.js').then(({ updateAccountUI }) => updateAccountUI());
    });

    const closeBtns = authModalEl.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => btn.addEventListener('click', hideAuthModal));
    authModalEl.addEventListener('click', (e) => { if (e.target === authModalEl) hideAuthModal(); });
};
