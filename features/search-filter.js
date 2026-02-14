/* =========================================
   FEATURE: Search Filter
   Description: Product search and filtering
   ========================================= */

import { state } from '../core/state.js';
import { renderProducts, showLoading, resetPagination } from './product-grid.js';

let searchInputEl;
let brandFiltersEls;
let categoryFiltersEls;
let productGridEl;
let upcomingGridEl;
let productSortEl;

/** ⚙️ Action: Apply all filters */
/** ?? Action */
export const applyAllFilters = () => {
    resetPagination();

    const searchTerm = (searchInputEl?.value || '').trim().toLowerCase();
    const selectedBrands = Array.from(brandFiltersEls || []).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());

    let selectedCategory = 'all';
    categoryFiltersEls.forEach(f => {
        if (f.classList.contains('active')) {
            selectedCategory = (f.dataset.category || 'All').toLowerCase();
        }
    });

    let filteredProducts = state.inventorySource;

    if (selectedCategory !== 'all') {
        const isCategoryMatch = (dataCat, filterCat) => {
            const clean = (s) => (s || '').toLowerCase().trim().replace(/[-_ ]/g, '');
            const d = clean(dataCat);
            const f = clean(filterCat);
            if (d === f) return true;
            const norm = (s) => s.replace(/s$/, '').replace(/ies$/, 'y');
            return norm(d) === norm(f);
        };
        filteredProducts = filteredProducts.filter(p => isCategoryMatch(p.category, selectedCategory));
    }

    if (selectedBrands.length > 0) {
        filteredProducts = filteredProducts.filter(p => {
            const brand = (p.brand || '').toLowerCase();
            return selectedBrands.includes(brand);
        });
    }

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p =>
            (p.name || '').toLowerCase().includes(searchTerm) ||
            (p.brand || '').toLowerCase().includes(searchTerm) ||
            (p.category || '').toLowerCase().includes(searchTerm) ||
            (p.description || '').toLowerCase().includes(searchTerm)
        );
    }

    const regularProducts = filteredProducts.filter(p => !p.isUpcoming);
    const upcomingProducts = filteredProducts.filter(p => p.isUpcoming);

    const sortVal = productSortEl?.value || 'newest';
    const sortFn = (a, b) => {
        switch (sortVal) {
            case 'price-low': return a.effectivePrice - b.effectivePrice;
            case 'price-high': return b.effectivePrice - a.effectivePrice;
            case 'name-az': return a.name.localeCompare(b.name);
            case 'newest': return b.id.localeCompare(a.id);
            default: return 0;
        }
    };
    regularProducts.sort(sortFn);

    renderProducts(regularProducts, productGridEl);
    renderProducts(upcomingProducts, upcomingGridEl);

    document.dispatchEvent(new CustomEvent('app:filtersApplied'));
};

let searchFilterInitialized = false;

/** ⚙️ Action: Initialize search filter */
/** ?? Action */
/** ?? Core */
export const initSearchFilter = () => {
    if (searchFilterInitialized) return;
    searchFilterInitialized = true;

    searchInputEl = document.getElementById('search-input');
    brandFiltersEls = document.querySelectorAll('.brand-filter');
    categoryFiltersEls = document.querySelectorAll('.category-filter');
    productGridEl = document.getElementById('product-grid');
    upcomingGridEl = document.getElementById('upcoming-grid');
    productSortEl = document.getElementById('product-sort');

    const searchForm = document.getElementById('search-form');

    const dropdown = document.getElementById('custom-sort');
    const trigger = document.getElementById('sort-trigger');
    const options = document.querySelectorAll('#sort-options li');
    const currentLabel = document.getElementById('current-sort-label');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        trigger.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            trigger.classList.remove('active');
        }
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const label = option.textContent;

            currentLabel.textContent = label;
            const i18nKey = option.getAttribute('data-i18n');
            if (i18nKey) currentLabel.setAttribute('data-i18n', i18nKey);

            const hiddenInput = document.getElementById('product-sort');
            hiddenInput.value = value;

            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            dropdown.classList.remove('open');
            trigger.classList.remove('active');

            applyAllFilters();
        });
    });

    searchForm.addEventListener('submit', (e) => { e.preventDefault(); applyAllFilters(); });
    searchInputEl.addEventListener('input', applyAllFilters);

    brandFiltersEls.forEach(f => f.addEventListener('change', applyAllFilters));

    categoryFiltersEls.forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();

            searchInputEl.value = '';
            brandFiltersEls.forEach(b => b.checked = false);

            categoryFiltersEls.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            applyAllFilters();
        });
    });

    document.getElementById('product-sort').addEventListener('change', applyAllFilters);
};
