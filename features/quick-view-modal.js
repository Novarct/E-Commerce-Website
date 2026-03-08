/* =========================================
   FEATURE: Quick View Modal
   Description: Product quick view modal
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice, showModal, hideModal } from '../utils/helpers.js';
import { addItemToCart } from './cart-panel.js';
import { toggleWishlist } from './wishlist-panel.js';
import { addToHistory } from './history-panel.js';
import { ReviewService } from '../services/review-service.js';
import { AuthGuard } from '../services/authguard.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { Logger } from '../core/logger.js';

const quickViewModalEl = document.getElementById('quick-view-modal');
const quickViewCloseBtn = quickViewModalEl.querySelector('.close-modal');

let currentProductId = null;
let selectedRating = 0;

/** 🎨 Render: Render star icons for a given rating */
const renderStars = (rating) => {
    const r = Math.max(0, Math.min(5, Math.round(Number(rating))));
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= r ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return html;
};

/** 🎨 Render: Render the reviews list in the left pane */
const renderReviewsList = (productId) => {
    const listEl = quickViewModalEl.querySelector('#qv-reviews-list');
    const reviews = ReviewService.getReviews(productId);
    listEl.innerHTML = '';

    if (reviews.length === 0) {
        listEl.innerHTML = '<p class="qv-no-reviews">No reviews yet. Be the first!</p>';
        return;
    }

    reviews.forEach(review => {
        const date = new Date(review.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

        const starsEl = document.createElement('div');
        starsEl.className = 'qv-review-stars';
        starsEl.innerHTML = renderStars(review.rating);

        const avatarEl = document.createElement('div');
        if (review.userAvatar) {
            avatarEl.innerHTML = `<img src="${review.userAvatar}" alt="${review.userName}" class="qv-reviewer-avatar">`;
        } else {
            avatarEl.innerHTML = '<div class="qv-reviewer-avatar qv-reviewer-avatar-placeholder"><i class="fas fa-user"></i></div>';
        }

        const metaEl = document.createElement('div');
        metaEl.className = 'qv-review-meta';
        metaEl.innerHTML = `<span class="qv-reviewer-name">${review.userName}</span><span class="qv-review-date">${date}</span>`;

        const headerEl = document.createElement('div');
        headerEl.className = 'qv-review-header';
        headerEl.appendChild(avatarEl.firstChild);
        headerEl.appendChild(metaEl);
        headerEl.appendChild(starsEl);

        const commentEl = document.createElement('p');
        commentEl.className = 'qv-review-comment';
        commentEl.textContent = review.comment;

        const itemEl = document.createElement('div');
        itemEl.className = 'qv-review-item';
        itemEl.appendChild(headerEl);
        itemEl.appendChild(commentEl);

        listEl.appendChild(itemEl);
    });
};

/** ⚙️ Action: Reset the review form */
const resetReviewForm = () => {
    selectedRating = 0;
    const textarea = quickViewModalEl.querySelector('#qv-review-textarea');
    textarea.value = '';
    quickViewModalEl.querySelectorAll('#qv-star-selector i').forEach(star => {
        star.className = 'far fa-star';
    });
};

/** 🎨 Render: Update the star selector display */
const updateStarSelector = (value) => {
    quickViewModalEl.querySelectorAll('#qv-star-selector i').forEach(star => {
        star.className = parseInt(star.dataset.value) <= value ? 'fas fa-star' : 'far fa-star';
    });
};

/** 🎨 Render: Populate quick view */
/** ?? Action */
export const populateQuickView = (product) => {
    currentProductId = product.id;

    const displayName = state.currentLang === 'vi' && product.name_vn ? product.name_vn : product.name;
    const displayDescription = state.currentLang === 'vi' && product.description_vn ? product.description_vn : product.description;

    const imgContainer = quickViewModalEl.querySelector('.qv-image-container');
    const qvImg = quickViewModalEl.querySelector('#qv-image');

    const existingNav = imgContainer.querySelector('.qv-carousel-nav');
    if (existingNav) existingNav.remove();

    const imgs = product.images.length > 0 ? product.images : [product.image];
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
    const rating = product.rating;
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
        qvDiscount.textContent = product.discounts.join(' + ');
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

    resetReviewForm();
    renderReviewsList(product.id);

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

    // Star selector hover + click
    const starSelector = quickViewModalEl.querySelector('#qv-star-selector');

    starSelector.addEventListener('mouseover', (e) => {
        const star = e.target.closest('i[data-value]');
        if (star) updateStarSelector(parseInt(star.dataset.value));
    });

    starSelector.addEventListener('mouseout', () => {
        updateStarSelector(selectedRating);
    });

    starSelector.addEventListener('click', (e) => {
        const star = e.target.closest('i[data-value]');
        if (star) {
            selectedRating = parseInt(star.dataset.value);
            updateStarSelector(selectedRating);
            Logger.log('UI', `⭐ Star rating selected: ${selectedRating}`);
        }
    });

    // Submit review
    quickViewModalEl.querySelector('#qv-submit-review-btn').addEventListener('click', () => {
        const result = AuthGuard.require(() => {
            const comment = quickViewModalEl.querySelector('#qv-review-textarea').value.trim();

            if (selectedRating === 0) {
                NotificationSystem.showToast('Please select a star rating.', 'warning');
                return null;
            }

            if (!comment) {
                NotificationSystem.showToast('Please write a comment.', 'warning');
                return null;
            }

            const review = {
                userName: state.userName || 'Anonymous',
                userAvatar: state.userAvatar,
                rating: selectedRating,
                comment
            };

            ReviewService.addReview(currentProductId, review);
            renderReviewsList(currentProductId);
            resetReviewForm();
            NotificationSystem.showToast('Review submitted!', 'success');
            Logger.log('UI', `✅ Review submitted for product ${currentProductId}`);
            return true;
        });

        if (result === null && state.loggedIn) {
            // Validation failed — already showed warning toast, do nothing else
        }
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
