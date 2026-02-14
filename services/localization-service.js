/* =========================================
   SERVICE: Localization
   Description: Translation and formatting
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice } from '../utils/helpers.js';

export class LocalizationService {
    /** 🔍 Query: Get current language */
    static getCurrentLanguage() {
        return state.currentLang || 'en';
    }

    /** 🔍 Query: Check if Vietnamese */
    static isVietnamese() {
        return this.getCurrentLanguage() === 'vi';
    }

    /** 🔍 Query: Get product name */
    static getProductName(product) {
        return this.isVietnamese() && product.name_vn ? product.name_vn : product.name;
    }

    /** 🔍 Query: Get product description */
    static getProductDescription(product) {
        return this.isVietnamese() && product.description_vn ? product.description_vn : product.description;
    }

    /** 🔍 Query: Get category name */
    static getCategoryName(category) {
        return t(`category_${category}`) || category;
    }

    /** 🔍 Query: Format price */
    static formatPrice(price, currency) {
        return formatPrice(parseFloat(price || 0));
    }

    /** 🔍 Query: Format date */
    static formatDate(date, options = {}) {
        const dateObj = date instanceof Date ? date : new Date(date);
        const locale = this.isVietnamese() ? 'vi-VN' : 'en-US';

        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...options
        };

        return dateObj.toLocaleDateString(locale, defaultOptions);
    }

    /** 🔍 Query: Format date time */
    static formatDateTime(date, options = {}) {
        const dateObj = date instanceof Date ? date : new Date(date);
        const locale = this.isVietnamese() ? 'vi-VN' : 'en-US';

        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return dateObj.toLocaleString(locale, defaultOptions);
    }

    /** 🔍 Query: Format number */
    static formatNumber(number, options = {}) {
        const num = typeof number !== 'number' ? parseFloat(number) || 0 : number;
        const locale = this.isVietnamese() ? 'vi-VN' : 'en-US';
        return num.toLocaleString(locale, options);
    }

    /** 🔍 Query: Get text */
    static getText(key, params = {}) {
        let text = t(key);
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        return text;
    }

    /** 🔍 Query: Get product field */
    static getProductField(product, field) {
        const vnField = `${field}_vn`;
        return this.isVietnamese() && product[vnField] ? product[vnField] : product[field];
    }

    /** 🔍 Query: Format relative time */
    static formatRelativeTime(date) {
        const dateObj = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return t('justNow');
        } else if (diffMin < 60) {
            return this.getText('minutesAgo', { count: diffMin });
        } else if (diffHour < 24) {
            return this.getText('hoursAgo', { count: diffHour });
        } else if (diffDay < 7) {
            return this.getText('daysAgo', { count: diffDay });
        } else {
            return this.formatDate(dateObj);
        }
    }

    /** 🔍 Query: Pluralize */
    static pluralize(count, singular, plural = null) {
        const word = count === 1 ? t(singular) : t(plural || `${singular}s`);
        return `${count} ${word}`;
    }

    /** 🔍 Query: Get sort label */
    static getSortLabel(sortKey) {
        return t(`sort_${sortKey}`) || sortKey;
    }

    /** 🔍 Query: Get filter label */
    static getFilterLabel(filterKey) {
        return t(`filter_${filterKey}`) || filterKey;
    }

    /** 🔍 Query: Format discount */
    static formatDiscount(originalPrice, discountedPrice) {
        if (!originalPrice || !discountedPrice || originalPrice <= discountedPrice) {
            return '';
        }
        const percentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        return `-${percentage}%`;
    }

    /** 🔍 Query: Get availability status */
    static getAvailabilityStatus(stock) {
        if (stock > 10) {
            return t('inStock');
        } else if (stock > 0) {
            return t('lowStock');
        } else {
            return t('outOfStock');
        }
    }

    /** 🔍 Query: Format file size */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}
