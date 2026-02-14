/* =========================================
   FEATURE: Product Card
   Description: Product card HTML generation
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice, renderSafe, getImageWithFallback } from '../utils/helpers.js';


/** 🎨 Render: Create product card HTML */
export const createProductCardHTML = (product) => {
    const isUpcoming = product.isUpcoming;
    const inWishlist = state.wishlist.some(w => w.id === product.id);
    const inFavorites = state.favorites.some(f => f.id === product.id);

    const heartIcon = inFavorites ? 'fas fa-heart' : 'far fa-heart';
    const favoritesBtnClass = inFavorites ? 'favorites-btn active' : 'favorites-btn';

    const displayName = renderSafe(state.currentLang === 'vi' && product.name_vn ? product.name_vn : product.name, 'Unnamed Product');
    const stock = product.stock;

    let badgesHtml = '';
    if (product.status) badgesHtml += `<span class="badge badge-status">${product.status}</span>`;
    if (Array.isArray(product.discounts)) {
        product.discounts.forEach(d => {
            const isPercent = d.includes('%');
            badgesHtml += `<span class="badge ${isPercent ? 'badge-percent' : 'badge-text'}">${d}</span>`;
        });
    } else if (product.discounts) {
        badgesHtml += `<span class="badge badge-text">${product.discounts}</span>`;
    }

    let priceHtml = '';
    if (product.discountOriginalPrice > 0) {
        priceHtml = `
            <div class="price-container">
                <p class="product-price"><s class="price-original">${formatPrice(product.discountOriginalPrice)}</s> ${formatPrice(product.displayPrice)}</p>
            </div>`;
    } else {
        priceHtml = `
            <div class="price-container">
                <p class="product-price">${formatPrice(product.price)}</p>
            </div>`;
    }

    let stockBar = '';
    if (product.hasStock && !isUpcoming) {
        if (stock > 0) {
            const stockPercent = Math.min((stock / 20) * 100, 100);
            const progressBarColor = stock < 5 ? '#f2994a' : '#27ae60';
            stockBar = `<div class="stock-progress-container"><div class="stock-progress-bar" style="width: ${stockPercent}%; background-color: ${progressBarColor};"></div><span class="stock-label">${stock} ${state.currentLang === 'vi' ? 'còn lại' : 'left'}</span></div>`;
        } else {
            stockBar = `<div class="stock-progress-container"><div class="stock-progress-bar" style="width: 0%; background-color: #adb5bd;"></div><span class="stock-label" style="color: #dc3545;">${state.currentLang === 'vi' ? 'Hết hàng' : 'Out of Stock'}</span></div>`;
        }
    } else if (stock === 0 && !isUpcoming) {
        stockBar = `<div class="stock-progress-container"><span class="stock-label" style="color: #dc3545; font-weight:700;">${state.currentLang === 'vi' ? 'Hết hàng' : 'Out of Stock'}</span></div>`;
    } else {
        stockBar = `<div class="stock-spacer"></div>`;
    }

    const isOutOfStock = stock === 0 && !isUpcoming;
    const imgStyle = isOutOfStock ? 'style="opacity: 0.8;"' : '';

    const categoryIcons = {
        'Motherboards': 'fas fa-columns',
        'CPUs': 'fas fa-microchip',
        'RAMs': 'fas fa-memory',
        'Memory': 'fas fa-memory',
        'GPUs': 'fas fa-gamepad',
        'PSUs': 'fas fa-plug',
        'Cooling': 'fas fa-fan',
        'Cases': 'fas fa-cube',
        'Pre-builts': 'fas fa-desktop'
    };
    const categoryIcon = categoryIcons[product.category] || 'fas fa-tags';

    let actionBtns = '';
    let wishlistHeart = '';

    if (isUpcoming) {
        const wishlistText = inWishlist ? t('added') : t('addWishlist');
        actionBtns = `
            <button class="add-to-wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${product.id}">${wishlistText}</button>
        `;
    } else {
        actionBtns = isOutOfStock
            ? `<button class="add-to-cart-btn disabled" disabled>${state.currentLang === 'vi' ? 'Hết hàng' : 'Out of Stock'}</button>`
            : `<button class="add-to-cart-btn" data-id="${product.id}">${t('addToCart')}</button>`;

        wishlistHeart = `<button class="${favoritesBtnClass}" data-id="${product.id}" aria-label="${t('addFavorites')}"><i class="${heartIcon}"></i></button>`;
    }

    return `
        <article class="product-card ${isUpcoming ? 'upcoming' : ''}" data-id="${product.id}" data-category="${product.category || ''}">
            <div class="product-image-container">
                <div class="product-card-badges">${badgesHtml}</div>
                ${wishlistHeart}
                ${getImageWithFallback(product.image, displayName, 'product-image', imgStyle)}
                <button class="quick-view-btn" data-id="${product.id}"><i class="fas fa-eye"></i> ${t('quickView')}</button>
            </div>

            <div class="product-info">
                <div class="product-header">
                    <div class="category-logo" title="${product.category || 'Uncategorized'}"><i class="${categoryIcon}"></i></div>
                    <span class="product-brand">${renderSafe(product.brand)}</span>
                    <h3 class="product-name" title="${displayName}">${displayName}</h3>
                </div>
                
                <div class="rating-container">
                    <div class="rating-stars" ${isUpcoming ? 'style="visibility: hidden;"' : ''}>
                        ${(() => {
            const rating = typeof product.rating === 'number' && !isNaN(product.rating) ? product.rating : 0;
            const filledStars = Math.max(0, Math.min(5, Math.round(rating)));
            const emptyStars = 5 - filledStars;
            return '<i class="fas fa-star" style="color: #FFD700;"></i>'.repeat(filledStars) +
                '<i class="fas fa-star" style="color: #dee2e6;"></i>'.repeat(emptyStars);
        })()}
                        <span class="product-review-count">${product.reviewCount ? `(${renderSafe(product.reviewCount)})` : ''}</span>
                    </div>
                </div>

                <div class="stock-status-container">
                    ${stockBar}
                </div>

                ${priceHtml}

                <div class="product-actions-stack">
                    ${actionBtns}
                </div>
            </div>
        </article>
    `;
};

const activeIntervals = new Map();

/** ⚙️ Action: Start image cycling */
/** ?? Action */
export const startImageCycling = (card, product) => {
    const productId = card.dataset.id;

    if (Array.isArray(product.images) && product.images.length > 1) {
        const imgEl = card.querySelector('.product-image');

        let imgIdx = 0;
        const images = product.images;

        if (activeIntervals.has(productId)) clearInterval(activeIntervals.get(productId));

        const interval = setInterval(() => {
            imgEl.classList.add('fade-out');

            setTimeout(() => {
                imgIdx = (imgIdx + 1) % images.length;
                imgEl.src = images[imgIdx];
                imgEl.onload = () => imgEl.classList.remove('fade-out');
                setTimeout(() => imgEl.classList.remove('fade-out'), 50);
            }, 400);

        }, 2000);

        activeIntervals.set(productId, interval);
    }
};

/** ⚙️ Action: Stop image cycling */
/** ?? Action */
export const stopImageCycling = (card, product) => {
    const productId = card.dataset.id;

    if (activeIntervals.has(productId)) {
        clearInterval(activeIntervals.get(productId));
        activeIntervals.delete(productId);
    }

    const imgEl = card.querySelector('.product-image');
    imgEl.classList.remove('fade-out');
    imgEl.src = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');
};

/** ⚙️ Action: Clear all image cycling */
/** ?? Action */
export const clearAllImageCycling = () => {
    activeIntervals.forEach(interval => clearInterval(interval));
    activeIntervals.clear();
};
