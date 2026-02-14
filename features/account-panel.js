/* =========================================
   FEATURE: Account Panel
   Description: User account management panel
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice, showModal, hideModal } from '../utils/helpers.js';
import { updateCartUI } from './cart-panel.js';
import { updateWishlistUI } from './wishlist-panel.js';
import { WishlistService } from '../services/wishlist-service.js';
import { clearHistory } from './history-panel.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { AuthService } from '../services/auth-service.js';
import { CartService } from '../services/cart-service.js';
import { EventBus } from '../systems/event-bus.js';
import { openTradingShop } from './trading-shop.js';

let accountLinkEl;
let logoutBtn;
let orderHistoryContainer;
let couponsContainer;

/** 🎨 Render: Update account UI */
/** ?? Action */
export const updateAccountUI = () => {
    const user = AuthService.getCurrentUser();

    const usernameEl = document.querySelector('.account-username');
    const emailEl = document.querySelector('.account-email');
    usernameEl.innerHTML = `
        <span class="username-text">${user.username || user.name || 'Æther User'}</span>
        <button class="edit-username-btn" title="Edit Username"><i class="fas fa-edit"></i></button>
    `;
    initUsernameEditing(usernameEl);
    emailEl.textContent = user.email || 'user@aetherforge.com';

    renderPointsBadge(user);
    renderOrderHistory();
    renderAvailableCoupons();

    const savedAvatar = AuthService.getAvatar();
    const avatarImgEl = document.getElementById('account-avatar-img');
    const avatarIconEl = document.getElementById('account-avatar-icon');
    if (savedAvatar) {
        avatarImgEl.src = savedAvatar;
        avatarImgEl.style.display = 'block';
        avatarIconEl.style.display = 'none';
    }
};

/** 🎨 Render: Order history */
/** ?? Action */
/** ?? Render */
export const renderOrderHistory = () => {
    orderHistoryContainer = document.getElementById('order-history-items');

    const history = AuthService.getOrderHistory();
    orderHistoryContainer.innerHTML = '';

    if (history.length === 0) {
        orderHistoryContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center;">${t('noOrders')}</p>`;
        return;
    }

    history.slice().reverse().forEach(order => {
        const itemsHtml = order.items.map(item => `
            <div class="order-item-row">
                <i class="fas fa-caret-right"></i>
                <span>${item.name} x${item.quantity}</span>
            </div>
        `).join('');

        orderHistoryContainer.insertAdjacentHTML('beforeend', `
            <div class="account-order-card">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-date">${order.date}</span>
                </div>
                <div class="order-items-list">
                    ${itemsHtml}
                </div>
                <div class="order-total-row">
                    <span class="order-total-label">${t('total')}:</span>
                    <span class="order-total-value">${order.total}</span>
                </div>
            </div>
        `);
    });
};

/** 🎨 Render: Available coupons */
/** ?? Action */
/** ?? Render */
export const renderAvailableCoupons = () => {
    couponsContainer = document.getElementById('available-coupons-list');

    const coupons = AuthService.getAvailableCoupons();
    couponsContainer.innerHTML = '';

    coupons.forEach(coupon => {
        const icon = coupon.type === 'percent' ? 'fa-percent' : 'fa-truck-fast';
        const desc = t(`discount${coupon.code}`) || coupon.description;

        couponsContainer.insertAdjacentHTML('beforeend', `
            <div class="account-coupon-card">
                <div class="coupon-inner">
                    <div class="coupon-icon-box">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="coupon-details">
                        <span class="coupon-code">${coupon.code}</span>
                        <p class="coupon-desc">${desc}</p>
                    </div>
                    <button class="copy-coupon-btn" data-code="${coupon.code}">
                        <i class="fas fa-copy"></i>
                        <span>${t('copyCode')}</span>
                    </button>
                </div>
            </div>
        `);
    });

    couponsContainer.querySelectorAll('.copy-coupon-btn').forEach(btn => {
        btn.onclick = () => {
            const code = btn.dataset.code;
            navigator.clipboard.writeText(code).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> ' + (state.currentLang === 'vi' ? 'Đã chép' : 'Copied');
                setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                NotificationSystem.showToast(t('codeCopied'), 'success');
            });
        };
    });
};

/** 🔧 Core: Initialize avatar upload */
const initAvatarUpload = () => {
    const avatarUploadInput = document.getElementById('avatar-upload');
    const avatarImgEl = document.getElementById('account-avatar-img');
    const avatarIconEl = document.getElementById('account-avatar-icon');

    avatarUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            AuthService.updateAvatar(imageData);

            avatarImgEl.src = imageData;
            avatarImgEl.style.display = 'block';
            avatarIconEl.style.display = 'none';

            NotificationSystem.showToast(t('avatarUpdated'), 'success');
        };
        reader.readAsDataURL(file);
    });
};

/** ⚙️ Action: Handle logout */
/** ?? Action */
export const handleLogout = () => {
    AuthService.logout();
    CartService.clear();
    WishlistService.clearAll();
    clearHistory();
    updateCartUI();
    updateWishlistUI();

    hideAccountPanel();

    NotificationSystem.showToast(t('loggedOut'), 'info');
    accountLinkEl.style.color = '';
};

/** ⚙️ Action: Show account panel */
/** ?? Action */
export const showAccountPanel = () => {
    updateAccountUI();
    const panel = document.getElementById('account-modal');
    showModal(panel);
};

/** ⚙️ Action: Hide account panel */
/** ?? Action */
export const hideAccountPanel = () => {
    const panel = document.getElementById('account-modal');
    hideModal(panel);
};

/** 🎨 Render: Points badge */
/** ?? Action */
/** ?? Render */
export const renderPointsBadge = (user) => {
    const profileCard = document.querySelector('.account-profile-card');

    profileCard.querySelector('.aether-points-widget')?.remove();

    const pointsValue = user.aetherPoints || 0;

    const pointsHtml = `
        <div class="aether-points-widget">
            <div class="points-value">Æ points: ${pointsValue}</div>
            <button class="exchange-btn">
                <i class="fas fa-exchange-alt"></i>
                <span>Exchange</span>
            </button>
        </div>
    `;

    profileCard.insertAdjacentHTML('beforeend', pointsHtml);
};

/** 🔧 Core: Initialize username editing */
const initUsernameEditing = (container) => {
    const editBtn = container.querySelector('.edit-username-btn');
    const textSpan = container.querySelector('.username-text');

    editBtn.onclick = () => {
        const currentName = textSpan.textContent;
        const newName = prompt(state.currentLang === 'vi' ? 'Nhập tên mới:' : 'Enter new username:', currentName);

        if (newName && newName.trim() !== '' && newName !== currentName) {
            AuthService.updateUsername(newName.trim());
            textSpan.textContent = newName.trim();
            NotificationSystem.showToast(t('usernameUpdated'), 'success');
        }
    };
};

let accountInitialized = false;

/** ⚙️ Action: Initialize account panel */
/** ?? Action */
/** ?? Core */
export const initAccountPanel = () => {
    if (accountInitialized) return;
    accountInitialized = true;

    accountLinkEl = document.getElementById('account-link');
    logoutBtn = document.getElementById('logout-btn');
    orderHistoryContainer = document.getElementById('order-history-items');
    couponsContainer = document.getElementById('available-coupons-list');

    accountLinkEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.loggedIn) showAccountPanel();
        else {
            import('./auth-modal.js').then(({ showAuthModal }) => {
                showAuthModal(t('accountLogin'), t('accountLoginText'));
            });
        }
    });

    const accountPanel = document.getElementById('account-modal');
    accountPanel.addEventListener('click', (e) => {
        const exchangeBtn = e.target.closest('.exchange-btn');
        if (exchangeBtn) {
            e.preventDefault();
            openTradingShop();
        }
    });

    logoutBtn.addEventListener('click', handleLogout);

    const panel = document.getElementById('account-modal');
    const closeBtns = panel.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => btn.addEventListener('click', hideAccountPanel));
    panel.addEventListener('click', (e) => {
        if (e.target === panel) hideAccountPanel();
    });

    EventBus.listen('auth:orderAdded', () => {
        if (state.loggedIn) renderOrderHistory();
    });

    EventBus.listen('auth:couponConsumed', () => {
        if (state.loggedIn) renderAvailableCoupons();
    });

    initAvatarUpload();

    const savedAvatar = AuthService.getAvatar();
    const avatarImgEl = document.getElementById('account-avatar-img');
    const avatarIconEl = document.getElementById('account-avatar-icon');
    if (savedAvatar) {
        avatarImgEl.src = savedAvatar;
        avatarImgEl.style.display = 'block';
        avatarIconEl.style.display = 'none';
    }
};
