// [SECTION] Imports
import { initProductDisplay, handleQuickView } from './features/product-grid.js';
import { initQuickView } from './features/quick-view-modal.js';
import { showModal } from './utils/helpers.js';
import { applyTranslations } from './features/translation-manager.js';
import { initHeroCarousel } from './features/hero-carousel.js';
import { initThemeToggle } from './features/theme-toggle.js';
import { initBackToTop } from './features/mobile-menu.js';
import { initAuthModal } from './features/auth-modal.js';
import { initAccountPanel } from './features/account-panel.js';
import { initCartPanel, updateCartUI, addItemToCart } from './features/cart-panel.js';
import { initCheckoutModal } from './features/checkout-modal.js';
import { initWishlistPanel, updateWishlistUI, toggleWishlist } from './features/wishlist-panel.js';
import { toggleFavorites } from './features/favorites-panel.js';
import { initSearchFilter, applyAllFilters } from './features/search-filter.js';
import { syncInventory, CSV_URL } from './systems/inventory-engine.js';
import { setState } from './core/state.js';
import { initHistory } from './features/history-panel.js';
import { NotificationSystem } from './systems/notification-engine.js';
import { initScrollAnimation } from './features/scroll-animation.js';
import { initTopBar } from './features/top-bar.js';
import { APP_CONFIG } from './core/config.js';

// Services
import { CartService } from './services/cart-service.js';
import { WishlistService } from './services/wishlist-service.js';
import { AuthService } from './services/auth-service.js';
import { EventBus } from './systems/event-bus.js';

import { Logger } from './core/logger.js';

window.APP_CONFIG = APP_CONFIG;

// [SECTION] Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing E-Commerce App...');

    // Initialize Logger
    Logger.init();

    // Initialize Features directly (no try-catch overhead)
    NotificationSystem.init();
    applyTranslations();
    initHeroCarousel();
    initThemeToggle();
    initBackToTop();
    initAuthModal();
    initAccountPanel();
    initCartPanel();
    initCheckoutModal();
    initWishlistPanel();
    initSearchFilter();
    initProductDisplay();
    initQuickView();
    initHistory();
    initScrollAnimation();
    initTopBar();

    // [SECTION] Global Events
    // Global Events for cross-feature updates
    document.addEventListener('app:languageChanged', () => {
        applyTranslations(); // Update text content
        applyAllFilters(); // Re-render products with new lang
        updateCartUI();
        updateWishlistUI();
    });

    document.addEventListener('app:currencyChanged', () => {
        applyTranslations(); // Update currency display in top bar
        applyAllFilters();
        updateCartUI();
        updateWishlistUI();
    });

    // Global Delegation for Product Actions (Grid)
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('#auth-modal')) return;

        // Add to Cart
        const cartBtn = target.closest('.add-to-cart-btn');
        if (cartBtn && !cartBtn.disabled && !cartBtn.closest('.modal-content') && !cartBtn.closest('.cart-panel')) {
            e.preventDefault();
            const id = cartBtn.dataset.id || cartBtn.closest('[data-id]')?.dataset.id;
            if (id) addItemToCart(id, cartBtn);
        }

        // Add to Wishlist / Favorites
        const wishBtn = target.closest('.add-to-wishlist-btn');
        if (wishBtn) {
            e.preventDefault();
            const id = wishBtn.dataset.id || wishBtn.closest('[data-id]')?.dataset.id;
            if (id) toggleWishlist(id, wishBtn);
        }

        const heartBtn = target.closest('.favorites-btn');
        if (heartBtn) {
            e.preventDefault();
            const id = heartBtn.dataset.id || heartBtn.closest('[data-id]')?.dataset.id;
            if (id) toggleFavorites(id);
        }

        // Quick View
        const qvBtn = target.closest('.quick-view-btn');
        if (qvBtn) {
            e.preventDefault();
            handleQuickView(qvBtn);
        }
    });

    // Initial Data Fetch
    syncInventory(CSV_URL).then(data => {
        setState('inventorySource', data);

        // Count product breakdown
        const regularProducts = data.filter(p => !p.isUpcoming).length;
        const upcomingProducts = data.filter(p => p.isUpcoming).length;

        // Essential startup logs (always visible)
        console.log('✅ Inventory synced:', data.length, 'products loaded');
        console.log('   📦 Regular products:', regularProducts);
        console.log('   🔜 Upcoming products:', upcomingProducts);

        applyAllFilters();
        document.dispatchEvent(new CustomEvent('app:inventorySynced'));
    }).catch(err => {
        console.error('Initial sync error:', err);
    });

    console.log('✅ App initialized with service layer');
});
