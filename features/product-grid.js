/* =========================================
   FEATURE: Product Grid
   Description: Product grid rendering and pagination
   ========================================= */

import { state } from '../core/state.js';
import { t, showModal } from '../utils/helpers.js';
import { createProductCardHTML, startImageCycling, stopImageCycling, clearAllImageCycling } from './product-card.js';
import { addItemToCart } from './cart-panel.js';
import { toggleWishlist } from './wishlist-panel.js';
import { toggleFavorites } from './favorites-panel.js';
import { ScrollService } from '../services/scroll-service.js';
import { populateQuickView } from './quick-view-modal.js';

const paginationState = {
    'product-grid': 1,
    'upcoming-grid': 1
};

const ITEMS_PER_PAGE = 9;

/** 🎨 Render: Show loading spinner */
/** ?? Action */
export const showLoading = (container) => {
    container.innerHTML = `<div class="loading-spinner" style="grid-column: 1/-1; text-align: center; padding: 40px; font-size: 1.5rem; color: var(--electric-blue);"><i class="fas fa-spinner fa-spin"></i> <span style="margin-left: 10px;">Loading Æther...</span></div>`;
};

/** 🎨 Render: Display products in grid */
/** ?? Action */
/** ?? Render */
export const renderProducts = (products, container, isAppend = false) => {
    const isMainGrid = container.id === 'product-grid';
    const isUpcomingGrid = container.id === 'upcoming-grid';
    const isPaginated = isMainGrid || isUpcomingGrid;

    clearAllImageCycling();

    const validProducts = products.filter(p =>
        p.price !== undefined && p.price !== null && p.brand && p.name && !isNaN(p.price)
    );

    if (validProducts.length === 0) {
        container.innerHTML = '<p class="no-results">' + t('noProducts') + '</p>';
        const oldPagination = container.parentNode.querySelector('.pagination-container');
        if (oldPagination) oldPagination.remove();
        return;
    }

    if (isPaginated) {
        let currentPage = paginationState[container.id] || 1;

        const totalPages = Math.ceil(validProducts.length / ITEMS_PER_PAGE);

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        paginationState[container.id] = currentPage;

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        const displayedProducts = validProducts.slice(startIndex, endIndex);

        container.innerHTML = '';

        displayedProducts.forEach(product => {
            const html = createProductCardHTML(product);
            container.insertAdjacentHTML('beforeend', html);
        });

        let paginationContainerEl = container.parentNode.querySelector(`.pagination-container[data-for="${container.id}"]`);

        if (!paginationContainerEl) {
            const legacyPagination = container.nextElementSibling;
            if (legacyPagination && legacyPagination.classList.contains('pagination-container') && !legacyPagination.dataset.for) {
                legacyPagination.remove();
            }

            paginationContainerEl = document.createElement('div');
            paginationContainerEl.className = 'pagination-container';
            paginationContainerEl.dataset.for = container.id;
            container.insertAdjacentElement('afterend', paginationContainerEl);

            paginationContainerEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.page-btn');
                if (!btn || btn.disabled || btn.classList.contains('active')) return;

                const action = btn.dataset.action;
                let newPage = paginationState[container.id];

                if (action === 'prev') {
                    if (newPage > 1) newPage--;
                } else if (action === 'next') {
                    if (newPage < totalPages) newPage++;
                } else {
                    newPage = parseInt(action, 10);
                }

                paginationState[container.id] = newPage;

                ScrollService.toElement(container.id, { offset: -100 });

                renderProducts(products, container);
            });
        }

        renderPaginationControls(paginationContainerEl, totalPages, currentPage);
        paginationContainerEl.style.display = totalPages > 1 ? 'flex' : 'none';

        const oldLoadMore = document.querySelector('.load-more-container');
        if (oldLoadMore) oldLoadMore.remove();

    } else {
        container.innerHTML = '';
        validProducts.forEach(product => {
            const html = createProductCardHTML(product);
            container.insertAdjacentHTML('beforeend', html);
        });
    }
};

/** 🎨 Render: Pagination controls */
const renderPaginationControls = (container, totalPages, currentPage) => {
    let html = '';

    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''} data-action="prev"><i class="fas fa-chevron-left"></i></button>`;

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button class="page-btn" data-action="1">1</button>`;
        if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-action="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
        html += `<button class="page-btn" data-action="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''} data-action="next"><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;
};

/** ⚙️ Action: Reset pagination */
/** ?? Action */
export const resetPagination = () => {
    paginationState['product-grid'] = 1;
    paginationState['upcoming-grid'] = 1;
};

/** 🔧 Core: Handle quick view */
/** ?? Action */
export const handleQuickView = (qvBtn) => {
    const card = qvBtn.closest('.product-card');
    const product = state.inventorySource.find(p => p.id === card?.dataset?.id);
    populateQuickView(product);
    const qvModal = document.getElementById('quick-view-modal');
    showModal(qvModal);
};

let productGridInitialized = false;

/** ⚙️ Action: Initialize product display */
/** ?? Action */
/** ?? Core */
export const initProductDisplay = () => {
    if (productGridInitialized) return;
    productGridInitialized = true;

    const handleMouseEnter = (e) => {
        const card = e.target.closest('.product-card');
        const productId = card.dataset.id;
        const product = state.inventorySource.find(p => p.id === productId);
        startImageCycling(card, product);
    };

    const handleMouseLeave = (e) => {
        const card = e.target.closest('.product-card');
        const productId = card.dataset.id;
        const product = state.inventorySource.find(p => p.id === productId);
        stopImageCycling(card, product);
    };

    const productGridEl = document.getElementById('product-grid');
    const upcomingGridEl = document.getElementById('upcoming-grid');

    const attachHover = (grid) => {
        grid.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.product-card');
            if (card) handleMouseEnter({ target: card });
        });
        grid.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.product-card');
            if (card && !card.contains(e.relatedTarget)) {
                handleMouseLeave({ target: card });
            }
        });
    };

    attachHover(productGridEl);
    attachHover(upcomingGridEl);
};
