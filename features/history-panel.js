/* =========================================
   FEATURE: History Panel
   Description: Recently viewed products
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice, getImageWithFallback } from '../utils/helpers.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { StorageService } from '../services/storage-service.js';
import { AuthGuard } from '../services/authguard.js';
import { PanelManager } from '../services/panel-manager.js';
import { Logger } from '../core/logger.js';
import { LocalizationService } from '../services/localization-service.js';

const HISTORY_KEY = 'aether_recently_viewed';
const MAX_HISTORY = 10;

const historyPanelEl = document.getElementById('history-panel');
const historyOverlayEl = document.getElementById('history-overlay');
const historyContainerEl = document.getElementById('history-products');
const historyLinkEl = document.getElementById('history-link');

/** 🔍 Query: Load history IDs */
const loadHistoryIds = () => {
    return StorageService.load(HISTORY_KEY, []);
};

/** 🎨 Render: Update history badge */
const updateHistoryBadge = () => {
    const count = loadHistoryIds().length;
    const badge = historyLinkEl.querySelector('.history-count');
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
};

/** 🎨 Render: History list */
const renderHistory = () => {
    const ids = loadHistoryIds();

    if (ids.length === 0) {
        historyContainerEl.innerHTML = `<p class="history-empty">${t('emptyHistory')}</p>`;
        return;
    }

    historyContainerEl.innerHTML = '';

    ids.forEach(id => {
        const product = state.inventorySource.find(p => p.id === id);
        if (!product) return;

        const displayName = LocalizationService.getProductName(product);
        const price = product.effectivePrice || product.price;

        historyContainerEl.insertAdjacentHTML('beforeend', `
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
                        <button class="utility-card__delete-btn" data-id="${product.id}" title="${t('remove')}">
                            <span class="material-symbols-outlined" style="font-size: 1.5rem;">delete</span>
                        </button>
                    </div>
                    <button class="utility-card__action-btn add-to-cart-btn" data-id="${product.id}">${t('addToCart')}</button>
                </div>
            </div>
        `);
    });
};

/** ⚙️ Action: Add to history */
/** ?? Action */
export const addToHistory = (productId) => {
    if (!state.loggedIn) return;

    const id = String(productId);
    let history = loadHistoryIds();

    history = history.filter(h => h !== id);
    history.unshift(id);

    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);

    StorageService.save(HISTORY_KEY, history);
    updateHistoryBadge();
    renderHistory();
};

/** ⚙️ Action: Remove from history */
/** ?? Action */
export const removeFromHistory = (productId) => {
    const id = String(productId);
    let history = loadHistoryIds();
    history = history.filter(h => h !== id);

    StorageService.save(HISTORY_KEY, history);
    updateHistoryBadge();
    renderHistory();
    NotificationSystem.showToast(t('removedFromHistory'), 'info');
};

/** 🔍 Query: Get history */
/** ?? Action */
/** ?? Query */
export const getHistory = () => {
    renderHistory();
    updateHistoryBadge();
};

/** ⚙️ Action: Clear history */
/** ?? Action */
export const clearHistory = () => {
    StorageService.remove(HISTORY_KEY);
    renderHistory();
    updateHistoryBadge();
};

/** ⚙️ Action: Show history panel */
/** ?? Action */
export const showHistoryPanel = () => {
    AuthGuard.require(() => {
        PanelManager.show(historyPanelEl, historyOverlayEl);
        Logger.log('UI', '📜 Opened History Panel');
    });
};

/** ⚙️ Action: Hide history panel */
/** ?? Action */
export const hideHistoryPanel = () => {
    PanelManager.hide(historyPanelEl, historyOverlayEl);
};

let historyInitialized = false;

/** ⚙️ Action: Initialize history */
/** ?? Action */
/** ?? Core */
export const initHistory = () => {
    if (historyInitialized) return;
    historyInitialized = true;

    updateHistoryBadge();

    document.addEventListener('app:inventorySynced', () => {
        renderHistory();
        updateHistoryBadge();
    });

    historyLinkEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (!state.loggedIn) {
            AuthGuard.showAuthModal(t('loginRequired'), t('loginRequiredText'));
        } else {
            showHistoryPanel();
        }
    });

    const closeBtn = historyPanelEl.querySelector('.close-history');
    closeBtn.addEventListener('click', hideHistoryPanel);
    historyOverlayEl.addEventListener('click', hideHistoryPanel);

    historyContainerEl.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.utility-card');
        if (!card) return;
        const id = card.dataset.id;

        if (target.closest('.utility-card__delete-btn')) {
            removeFromHistory(id);
        }
    });
};
