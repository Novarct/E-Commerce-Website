/* =========================================
   FEATURE: Quick View Modal
   Description: Product quick view modal
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice, showModal, hideModal } from '../utils/helpers.js';
import { addItemToCart } from './cart-panel.js';
import { toggleWishlist } from './wishlist-panel.js';
import { addToHistory } from './history-panel.js';

const quickViewModalEl = document.getElementById('quick-view-modal');
const quickViewCloseBtn = quickViewModalEl?.querySelector('.close-modal');

/** 🎨 Render: Populate quick view */
/** ?? Action */
export const populateQuickView = (product) => {
    const displayName = state.currentLang === 'vi' && product.name_vn ? product.name_vn : product.name;
    const displayDescription = state.currentLang === 'vi' && product.description_vn ? product.description_vn : product.description;

    const imgContainer = quickViewModalEl.querySelector('.qv-image-container');
    const qvImg = quickViewModalEl.querySelector('#qv-image');

    const existingNav = imgContainer.querySelector('.qv-carousel-nav');
    if (existingNav) existingNav.remove();

    const imgs = product.images.length > 0 ? product.images : [product.image || ''];
    qvImg.src = imgs[0];
    qvImg.alt = displayName;

    if (imgs.length > 1) {
        let idx = 0;
        const nav = document.createElement('div');
        nav.className = 'qv-carousel-nav';
        nav.innerHTML = '<button type="button" class="qv-carousel-prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button><button type="button" class="qv-carousel-next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>';
        imgContainer.appendChild(nav);
        const go = (delta) => { idx = (idx + delta + imgs.length) % imgs.length; qvImg.src = imgs[idx]; };
        nav.querySelector('.qv-carousel-prev').addEventListener('click', () => go(-1));
        nav.querySelector('.qv-carousel-next').addEventListener('click', () => go(1));
    }

    quickViewModalEl.querySelector('#qv-brand').textContent = product.brand;
    quickViewModalEl.querySelector('#qv-name').textContent = displayName;

    const qvRating = quickViewModalEl.querySelector('.qv-rating');
    const rating = typeof product.rating === 'number' && !isNaN(product.rating) ? product.rating : 0;
    const filledStars = Math.max(0, Math.min(5, Math.round(rating)));
    const emptyStars = 5 - filledStars;
    qvRating.innerHTML = `
        ${'<i class="fas fa-star"></i>'.repeat(filledStars)}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
        <span class="product-review-count">(${product.reviewCount} ${t('reviews')})</span>
    `;

    let priceHtml = '';
    if (product.discountOriginalPrice > 0) {
        priceHtml = `<s class="price-original">${formatPrice(product.discountOriginalPrice)}</s> ${formatPrice(product.displayPrice)}`;
    } else {
        priceHtml = formatPrice(product.price);
    }
    quickViewModalEl.querySelector('#qv-price').innerHTML = priceHtml;

    const qvDiscount = quickViewModalEl.querySelector('#qv-discount');
    if (product.discounts && product.discounts.length > 0) {
        qvDiscount.textContent = Array.isArray(product.discounts) ? product.discounts.join(' + ') : product.discounts;
        qvDiscount.className = 'deal-badge qv-badge badge-cell badge-text';
        qvDiscount.style.display = 'inline-block';
    } else {
        qvDiscount.style.display = 'none';
    }
    quickViewModalEl.querySelector('#qv-description').textContent = displayDescription || t('noDescription');

    const qvRelated = quickViewModalEl.querySelector('#qv-related-products');
    qvRelated.innerHTML = '';
    const related = state.inventorySource
        .filter(p => p.id !== product.id && p.category === product.category && !p.isUpcoming)
        .slice(0, 4);

    if (related.length > 0) {
        related.forEach(rp => {
            const rpName = state.currentLang === 'vi' && rp.name_vn ? rp.name_vn : rp.name;
            qvRelated.insertAdjacentHTML('beforeend', `
                <div class="qv-related-item" data-id="${rp.id}">
                    <img src="${rp.image}" alt="${rpName}">
                    <p>${rpName}</p>
                    <span>${formatPrice(rp.effectivePrice)}</span>
                </div>
            `);
        });
        quickViewModalEl.querySelector('.qv-related-section').style.display = 'block';
    } else {
        quickViewModalEl.querySelector('.qv-related-section').style.display = 'none';
    }

    const qvAddToCartBtn = quickViewModalEl.querySelector('.add-to-cart-btn');
    qvAddToCartBtn.dataset.id = product.id;

    if (product.isUpcoming) {
        const inWishlist = state.wishlist.some(w => w.id === product.id);
        qvAddToCartBtn.textContent = inWishlist ? t('added') : t('addWishlist');
        qvAddToCartBtn.disabled = false;
        qvAddToCartBtn.style.opacity = '1';
        qvAddToCartBtn.style.cursor = 'pointer';
        qvAddToCartBtn.classList.add('add-to-wishlist-btn');
    } else {
        qvAddToCartBtn.classList.remove('add-to-wishlist-btn');
        if (product.stock === 0) {
            qvAddToCartBtn.textContent = state.currentLang === 'vi' ? 'Hết hàng' : 'Out of Stock';
            qvAddToCartBtn.disabled = true;
            qvAddToCartBtn.style.opacity = '0.5';
            qvAddToCartBtn.style.cursor = 'not-allowed';
        } else {
            qvAddToCartBtn.textContent = t('addToCart');
            qvAddToCartBtn.disabled = false;
            qvAddToCartBtn.style.opacity = '1';
            qvAddToCartBtn.style.cursor = 'pointer';
        }
    }

    addToHistory(product.id);
};

let quickViewInitialized = false;

/** ⚙️ Action: Initialize quick view */
/** ?? Action */
/** ?? Core */
export const initQuickView = () => {
    if (quickViewInitialized) return;
    quickViewInitialized = true;

    quickViewCloseBtn.addEventListener('click', () => hideModal(quickViewModalEl));

    quickViewModalEl.addEventListener('click', (e) => {
        if (e.target === quickViewModalEl) hideModal(quickViewModalEl);
    });

    quickViewModalEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-wishlist-btn')) {
            e.preventDefault();
            toggleWishlist(e.target.dataset.id, e.target);
        } else if (e.target.classList.contains('add-to-cart-btn')) {
            e.preventDefault();
            addItemToCart(e.target.dataset.id, e.target);
        }

        const relatedItem = e.target.closest('.qv-related-item');
        if (relatedItem) {
            const product = state.inventorySource.find(p => p.id === relatedItem.dataset.id);
            populateQuickView(product);
        }
    });
};
