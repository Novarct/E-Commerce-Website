/* =========================================
   FEATURE: Cart Panel
   Description: Shopping cart side panel
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice, getImageWithFallback } from '../utils/helpers.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { CartService } from '../services/cart-service.js';
import { AuthGuard } from '../services/authguard.js';
import { PanelManager } from '../services/panel-manager.js';
import { EventBus } from '../systems/event-bus.js';

const cartPanelEl = document.getElementById('cart');
const cartOverlayEl = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-products');
const cartSubtotalPriceEl = document.getElementById('cart-subtotal-price');
const headerCartTotalEl = document.querySelector('.cart-total');
const cartLinkEl = document.querySelector('.cart-link');
const quickViewModalEl = document.getElementById('quick-view-modal');

/** 🎨 Render: Update cart UI */
/** ?? Action */
export const updateCartUI = () => {
    cartItemsContainer.innerHTML = '';
    const cart = CartService.getAll();
    const subtotal = CartService.getSubtotal();

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="cart-empty">${t('cartEmpty')}</p>`;
    } else {
        cart.forEach(cartItem => {
            const product = state.inventorySource.find(p => p.id === String(cartItem.id)) || cartItem;
            const price = cartItem.price || product.effectivePrice || product.price;
            const itemTotal = price * cartItem.quantity;

            cartItemsContainer.insertAdjacentHTML('beforeend', `
                <div class="utility-card" data-id="${product.id}">
                    <div class="utility-card__image-container">
                        ${getImageWithFallback(product.image, product.name, 'utility-card__image')}
                    </div>
                    <div class="utility-card__content">
                        <div class="utility-card__header">
                            <div>
                                <h3 class="utility-card__title">${product.name}</h3>
                                <p class="utility-card__price">${formatPrice(price)}</p>
                            </div>
                            <button class="utility-card__delete-btn" data-id="${product.id}" title="${t('remove')}">
                                <span class="material-symbols-outlined" style="font-size: 1.5rem;">delete</span>
                            </button>
                        </div>
                        <div class="utility-card__row">
                            <div class="utility-card__quantity-control">
                                <button class="utility-card__qty-btn qty-minus" data-id="${product.id}">
                                    <span class="material-symbols-outlined" style="font-size: 1.2rem;">remove</span>
                                </button>
                                <input type="number" class="utility-card__qty-input qty-input" value="${cartItem.quantity}" min="1" max="99" data-id="${product.id}">
                                <button class="utility-card__qty-btn qty-plus" data-id="${product.id}">
                                    <span class="material-symbols-outlined" style="font-size: 1.2rem;">add</span>
                                </button>
                            </div>
                            <div class="utility-card__line-total">${formatPrice(itemTotal)}</div>
                        </div>
                    </div>
                </div>
            `);
        });
    }

    const formattedSubtotal = formatPrice(subtotal);
    cartSubtotalPriceEl.textContent = formattedSubtotal;
    headerCartTotalEl.textContent = formattedSubtotal;

    const totalQuantity = CartService.getItemCount();
    const cartCountEl = cartLinkEl.querySelector('.cart-count');
    cartCountEl.textContent = totalQuantity;
    cartCountEl.style.display = totalQuantity > 0 ? 'flex' : 'none';

    cartLinkEl.classList.toggle('active', cart.length > 0);
};

/** ⚙️ Action: Add item to cart */
/** ?? Action */
export const addItemToCart = (productId, buttonElement) => {
    const cart = CartService.addItem(productId);

    if (cart) {
        updateCartUI();

        if (buttonElement) {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = t('added');
            setTimeout(() => { buttonElement.textContent = originalText; }, 1500);
        }

        const icon = cartLinkEl.querySelector('i');
        NotificationSystem.triggerSparkle(icon);
        icon.classList.add('cart-bounce');
        setTimeout(() => icon.classList.remove('cart-bounce'), 500);

        NotificationSystem.showToast(t('added') || 'Added to cart', 'success');
    } else {
        if (quickViewModalEl && quickViewModalEl.classList.contains('show')) {
            import('../utils/helpers.js').then(({ hideModal }) => hideModal(quickViewModalEl));
        }
    }
};

/** ⚙️ Action: Remove item from cart */
/** ?? Action */
export const removeItemFromCart = (productId) => {
    CartService.removeItem(productId);
    updateCartUI();
    NotificationSystem.showToast(t('removedFromCart'), 'info');
};

/** ⚙️ Action: Update item quantity */
/** ?? Action */
export const updateItemQuantity = (productId, newQuantity) => {
    CartService.updateQuantity(productId, newQuantity);
    updateCartUI();
};

/** ⚙️ Action: Show cart panel */
/** ?? Action */
export const showCartPanel = () => {
    AuthGuard.require(() => {
        PanelManager.show(cartPanelEl, cartOverlayEl);
    });
};

/** ⚙️ Action: Hide cart panel */
/** ?? Action */
export const hideCartPanel = () => {
    PanelManager.hide(cartPanelEl, cartOverlayEl);
};

let cartInitialized = false;

/** ⚙️ Action: Initialize cart panel */
/** ?? Action */
/** ?? Core */
export const initCartPanel = () => {
    if (cartInitialized) return;
    cartInitialized = true;

    CartService.init();
    updateCartUI();

    EventBus.listen('cart:updated', () => {
        updateCartUI();
    });

    document.addEventListener('app:inventorySynced', () => {
        updateCartUI();
    });

    const toggleCart = () => {
        if (cartPanelEl.classList.contains('show')) {
            hideCartPanel();
        } else {
            showCartPanel();
        }
    };

    const cartBtn = document.getElementById('cart-link');
    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });

    const closeCartBtn = cartPanelEl.querySelector('.close-cart');
    closeCartBtn.addEventListener('click', hideCartPanel);
    cartOverlayEl.addEventListener('click', hideCartPanel);

    const checkoutBtn = cartPanelEl.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const { showCheckoutModal } = await import('./checkout-modal.js');
        showCheckoutModal();
    });

    cartPanelEl.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.utility-card__delete-btn');
        if (removeBtn) {
            e.preventDefault();
            removeItemFromCart(removeBtn.dataset.id);
            return;
        }

        const qtyBtn = e.target.closest('.utility-card__qty-btn');
        if (qtyBtn) {
            e.preventDefault();
            const productId = qtyBtn.dataset.id;
            if (qtyBtn.classList.contains('qty-plus')) {
                CartService.incrementQuantity(productId);
            } else {
                CartService.decrementQuantity(productId);
            }
            updateCartUI();
        }
    });

    cartPanelEl.addEventListener('change', (e) => {
        if (e.target.classList.contains('qty-input')) {
            updateItemQuantity(e.target.dataset.id, e.target.value);
        }
    });

    const miniCart = document.createElement('div');
    miniCart.id = 'mini-cart-tooltip';
    miniCart.className = 'mini-cart-tooltip';
    cartLinkEl.appendChild(miniCart);

    const updateMiniCart = () => {
        const cart = CartService.getAll();
        if (cart.length === 0) {
            miniCart.innerHTML = `<p>${t('cartEmpty')}</p>`;
        } else {
            let html = '<div class="mini-cart-items">';
            cart.slice(0, 3).forEach(item => {
                const product = state.inventorySource.find(p => p.id === String(item.id)) || item;
                const name = product.name || 'Product';
                const image = product.image || 'assets/placeholder.svg';
                html += `
                    <div class="mini-cart-item">
                        <img src="${image}" alt="${name}">
                        <div>
                            <p>${name}</p>
                            <span>${item.quantity} × ${formatPrice(item.price)}</span>
                        </div>
                    </div>
                `;
            });
            if (cart.length > 3) html += `<p class="more-items">+ ${cart.length - 3} ${state.currentLang === 'vi' ? 'mục khác' : 'more items'}</p>`;
            html += '</div>';
            miniCart.innerHTML = html;
        }
    };

    cartLinkEl.addEventListener('mouseenter', updateMiniCart);
    document.addEventListener('app:cartUpdated', updateMiniCart);
}
