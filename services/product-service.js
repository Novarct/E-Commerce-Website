/* =========================================
   SERVICE: Product
   Description: Product data access and queries
   ========================================= */

import { state } from '../core/state.js';
import { LocalizationService } from './localization-service.js';

export class ProductService {
    /** 🔍 Query: Get all products */
    static getAll() {
        return state.inventorySource || [];
    }

    /** 🔍 Query: Get by ID */
    static getById(productId) {
        return state.inventorySource.find(p => p.id === String(productId)) || null;
    }

    /** 🔍 Query: Get by IDs */
    static getByIds(productIds) {
        const ids = productIds.map(id => String(id));
        return state.inventorySource.filter(p => ids.includes(p.id));
    }

    /** 🔍 Query: Get by category */
    static getByCategory(category) {
        return state.inventorySource.filter(p => p.category === category);
    }

    /** 🔍 Query: Get by brand */
    static getByBrand(brand) {
        return state.inventorySource.filter(p => p.brand === brand);
    }

    /** 🔍 Query: Get categories */
    static getCategories() {
        const categories = new Set(state.inventorySource.map(p => p.category));
        return Array.from(categories).filter(Boolean);
    }

    /** 🔍 Query: Get brands */
    static getBrands() {
        const brands = new Set(state.inventorySource.map(p => p.brand));
        return Array.from(brands).filter(Boolean);
    }

    /** 🔍 Query: Get name */
    static getName(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return LocalizationService.getProductName(productObj);
    }

    /** 🔍 Query: Get description */
    static getDescription(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return LocalizationService.getProductDescription(productObj);
    }

    /** 🔍 Query: Get price */
    static getPrice(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return productObj.effectivePrice || productObj.price || 0;
    }

    /** 🔍 Query: Get display price */
    static getDisplayPrice(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return productObj.displayPrice != null ? productObj.displayPrice : productObj.price || 0;
    }

    /** 🔍 Query: Check if has discount */
    static hasDiscount(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return productObj.effectivePrice && productObj.effectivePrice < productObj.price;
    }

    /** 🔍 Query: Get discount percentage */
    static getDiscountPercentage(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        if (!this.hasDiscount(productObj)) return 0;
        const discount = ((productObj.price - productObj.effectivePrice) / productObj.price) * 100;
        return Math.round(discount);
    }

    /** 🔍 Query: Check if in stock */
    static isInStock(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return (productObj.stock || 0) > 0;
    }

    /** 🔍 Query: Get stock */
    static getStock(product) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return productObj.stock || 0;
    }

    /** 🔍 Query: Search products */
    static search(query) {
        if (!query || query.trim() === '') return this.getAll();

        const lowerQuery = query.toLowerCase();

        return state.inventorySource.filter(product => {
            const name = this.getName(product).toLowerCase();
            const description = this.getDescription(product).toLowerCase();
            const category = (product.category || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();

            return name.includes(lowerQuery) ||
                description.includes(lowerQuery) ||
                category.includes(lowerQuery) ||
                brand.includes(lowerQuery);
        });
    }

    /** 🔍 Query: Filter products */
    static filter(criteria = {}) {
        let products = this.getAll();

        if (criteria.category) {
            products = products.filter(p => p.category === criteria.category);
        }

        if (criteria.brand) {
            products = products.filter(p => p.brand === criteria.brand);
        }

        if (criteria.minPrice != null) {
            products = products.filter(p => this.getPrice(p) >= criteria.minPrice);
        }

        if (criteria.maxPrice != null) {
            products = products.filter(p => this.getPrice(p) <= criteria.maxPrice);
        }

        if (criteria.inStockOnly) {
            products = products.filter(p => this.isInStock(p));
        }

        if (criteria.onSaleOnly) {
            products = products.filter(p => this.hasDiscount(p));
        }

        return products;
    }

    /** 🔍 Query: Sort products */
    static sort(products, sortBy = 'newest') {
        const sorted = [...products];

        switch (sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) => this.getPrice(a) - this.getPrice(b));
            case 'price-desc':
                return sorted.sort((a, b) => this.getPrice(b) - this.getPrice(a));
            case 'name-asc':
                return sorted.sort((a, b) => this.getName(a).localeCompare(this.getName(b)));
            case 'name-desc':
                return sorted.sort((a, b) => this.getName(b).localeCompare(this.getName(a)));
            case 'newest':
                return sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
            default:
                return sorted;
        }
    }

    /** 🔍 Query: Get related products */
    static getRelated(product, limit = 4) {
        const productObj = typeof product === 'string' ? this.getById(product) : product;
        return state.inventorySource
            .filter(p => p.category === productObj.category && p.id !== productObj.id)
            .slice(0, limit);
    }

    /** 🔍 Query: Get featured products */
    static getFeatured(limit = 8) {
        return state.inventorySource
            .filter(p => p.featured === true)
            .slice(0, limit);
    }

    /** 🔍 Query: Get on sale products */
    static getOnSale(limit = 8) {
        return state.inventorySource
            .filter(p => this.hasDiscount(p))
            .slice(0, limit);
    }

    /** 🔍 Query: Get new arrivals */
    static getNewArrivals(limit = 8) {
        return state.inventorySource
            .sort((a, b) => (b.id || 0) - (a.id || 0))
            .slice(0, limit);
    }
}
