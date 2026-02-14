/* =========================================
   SYSTEM: Configuration
   Description: Application configuration
   ========================================= */

import { SCROLL_ANIMATION_DURATION } from './constants.js';

/* =========================================
   Scroll Configuration
   ========================================= */

export const SCROLL_CONFIG = {
    Y_COORDINATE: 400,
    DURATION: SCROLL_ANIMATION_DURATION,
    EASING: 'easeInOut'
};

/* =========================================
   Application Configuration
   ========================================= */

export const APP_CONFIG = {
    name: 'ÆTHER FORGE',
    version: '2.0.0',

    features: {
        darkMode: true,
        multiLanguage: true,
        dualCurrency: true,
        productHistory: true,
        quickView: true
    },

    defaults: {
        language: 'en',
        currency: 'usd',
        theme: 'dark',
        itemsPerPage: 9
    },

    performance: {
        lazyLoadImages: true,
        debounceSearch: 300,
        throttleScroll: 100
    },

    debug: {
        DEBUG_TABLE: true,
        DEBUG_TABLE_LIMIT: 0
    }
};

/* =========================================
   Theme Configuration
   ========================================= */

export const THEME_CONFIG = {
    storageKey: 'aether_theme_preference',
    defaultTheme: 'dark',
    themes: ['light', 'dark']
};

/* =========================================
   Language Configuration
   ========================================= */

export const LANGUAGE_CONFIG = {
    storageKey: 'aether_language_preference',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'vi']
};
