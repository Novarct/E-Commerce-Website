/* =========================================
   FEATURE: Wishlist Panel
   Description: Wishlist and favorites panel
   ========================================= */

import { state } from '../core/state.js';
import { t, getImageWithFallback, formatPrice } from '../utils/helpers.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { WishlistService } from '../services/wishlist-service.js';
import { AuthGuard } from '../services/authguard.js';
import { EventBus } from '../systems/event-bus.js';
import { PanelManager } from '../services/panel-manager.js';
import { applyAllFilters } from './search-filter.js';
import { Logger } from '../core/logger.js';

const wishlistPanelEl = document.getElementById('wishlist');
const wishlistOverlayEl = document.getElementById('wishlist-overlay');
const wishlistItemsContainer = document.getElementById('wishlist-products');
const favoritesItemsContainer = document.getElementById('favorites-products');
const wishlistLinkEl = document.getElementById('wishlist-link');

/** 🎨 Render: Update wishlist UI */
/** ?? Action */
export const updateWishlistUI = () => {
    favoritesItemsContainer.innerHTML = '';
    wishlistItemsContainer.innerHTML = '';

    const totalCount = WishlistService.getTotalCount();
    const countEl = wishlistLinkEl.querySelector('.wishlist-count');
    countEl.textContent = totalCount;
    countEl.style.display = totalCount > 0 ? 'flex' : 'none';

    const icon = wishlistLinkEl.querySelector('i');
    icon.className = totalCount > 0 ? 'fas fa-heart' : 'far fa-heart';
    wishlistLinkEl.classList.toggle('active', totalCount > 0);

    const favorites = WishlistService.getFavorites();
    if (favorites.length === 0) {
        favoritesItemsContainer.innerHTML = `<p class="wishlist-empty">${t('wishlistEmpty')}</p>`;
    } else {
        favorites.forEach(favItem => {
            const product = state.inventorySource.find(p => p.id === String(favItem.id)) || favItem;
            const price = product.displayPrice != null ? product.displayPrice : product.price;
            const displayName = state.currentLang === 'vi' && product.name_vn ? product.name_vn : product.name;

            favoritesItemsContainer.insertAdjacentHTML('beforeend', `
                <div class="utility-card" data-id="${product.id}">
                    <div class="utility-card__image-container">
                        ${getImageWithFallback(product.image, displayName, 'utility-card__image')}
                    </div>
                    <div class="utility-card__content">
                        <div class="utility-card__header">
                            <div>
                                <h3 class="utility-card__title">${displayName}</h3>
                                <p class="utility-card__price">${formatPrice(price)}</p>
                            </div>
                            <button class="utility-card__delete-btn" data-id="${product.id}" title="${t('removeFromWishlist')}">
                                <span class="material-symbols-outlined" style="font-size: 1.5rem;">delete</span>
                            </button>
                        </div>
                        <button class="utility-card__action-btn add-to-cart-btn" data-id="${product.id}">${t('addToCart')}</button>
                    </div>
                </div>
            `);
        });
    }

    const wishlist = WishlistService.getWishlist();
    if (wishlist.length === 0) {
        wishlistItemsContainer.innerHTML = `<p class="wishlist-empty">${t('wishlistEmpty')}</p>`;
    } else {
        wishlist.forEach(wishItem => {
            const product = state.inventorySource.find(p => p.id === String(wishItem.id)) || wishItem;
            const displayName = state.currentLang === 'vi' && product.name_vn ? product.name_vn : product.name;

            wishlistItemsContainer.insertAdjacentHTML('beforeend', `
                <div class="utility-card" data-id="${product.id}">
                    <div class="utility-card__image-container">
                        <img src="${product.image}" alt="${displayName}" class="utility-card__image" onerror="this.onerror=null; this.src='assets/placeholder.svg';">
                    </div>
                    <div class="utility-card__content">
                        <div class="utility-card__header">
                            <div>
                                <h3 class="utility-card__title">${displayName}</h3>
                                <p class="utility-card__price">${t('comingSoon')}</p>
                            </div>
                            <button class="utility-card__delete-btn" data-id="${product.id}" title="${t('removeFromWishlist')}">
                                <span class="material-symbols-outlined" style="font-size: 1.5rem;">delete</span>
                            </button>
                        </div>
                        <div class="status-indicator">${t('comingSoon')}</div>
                    </div>
                </div>
            `);
        });
    }
};

/** ⚙️ Action: Toggle wishlist */
export const toggleWishlist = (productId, btn) => {
    const isInWishlist = state.wishlist.some(w => w.id === productId);

    let result;
    if (btn && btn.classList.contains('add-to-wishlist-btn')) {
        if (isInWishlist) {
            return;
        }
        result = WishlistService.addToWishlist(productId);
    } else {
        result = WishlistService.toggleWishlist(productId);
    }

    if (result !== null) {
        updateWishlistUI();
        applyAllFilters();

        const message = t('addedToWishlist') || 'Added to wishlist';
        NotificationSystem.showToast(message, 'success');

        Logger.log('UI', `💙 Added to wishlist: ${productId}`);

        const wishlistIcon = wishlistLinkEl.querySelector('i');
        NotificationSystem.triggerSparkle(wishlistIcon);

        if (btn && btn.classList.contains('add-to-wishlist-btn')) {
            btn.textContent = t('added');
            btn.classList.add('active');
            btn.disabled = true;
        }
    }
};

/** ⚙️ Action: Show wishlist panel */
/** ?? Action */
export const showWishlistPanel = () => {
    AuthGuard.require(() => {
        PanelManager.show(wishlistPanelEl, wishlistOverlayEl);
    });
};

/** ⚙️ Action: Hide wishlist panel */
/** ?? Action */
export const hideWishlistPanel = () => {
    PanelManager.hide(wishlistPanelEl, wishlistOverlayEl);
};

let wishlistInitialized = false;

/** ⚙️ Action: Initialize wishlist panel */
/** ?? Action */
/** ?? Core */
export const initWishlistPanel = () => {
    if (wishlistInitialized) return;
    wishlistInitialized = true;

    WishlistService.init();
    WishlistService.load();
    updateWishlistUI();

    EventBus.listen('wishlist:updated', () => {
        updateWishlistUI();
    });

    wishlistLinkEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (!state.loggedIn) AuthGuard.showAuthModal(t('loginRequired'), t('loginRequiredText'));
        else showWishlistPanel();
    });

    const closeBtn = wishlistPanelEl.querySelector('.close-wishlist');
    closeBtn.addEventListener('click', hideWishlistPanel);
    wishlistOverlayEl.addEventListener('click', hideWishlistPanel);

    wishlistPanelEl.addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.utility-card__delete-btn');
        if (removeBtn) {
            e.preventDefault();
            const id = removeBtn.dataset.id;

            if (WishlistService.isInFavorites(id)) {
                const { toggleFavorites } = await import('./favorites-panel.js');
                toggleFavorites(id);
            } else {
                toggleWishlist(id);
            }
        }
    });
};
