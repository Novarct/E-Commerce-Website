/* =========================================
   SYSTEM: Constants
   Description: Application constants
   ========================================= */

/* =========================================
   Storage Keys
   ========================================= */

export const CART_STORAGE_KEY = 'user_cart_list';
export const WISHLIST_STORAGE_KEY = 'user_wishlist_list';
export const FAVORITES_STORAGE_KEY = 'user_favorites_list';
export const HISTORY_STORAGE_KEY = 'aether_recently_viewed';
export const AUTH_STORAGE_KEY = 'aether_user_session';

/* =========================================
   Limits & Thresholds
   ========================================= */

export const MAX_CART_ITEMS = 50;
export const MAX_HISTORY_ITEMS = 10;
export const ITEMS_PER_PAGE = 9;
export const MAX_VISIBLE_PAGES = 5;

/* =========================================
   Timing & Animation
   ========================================= */

export const SCROLL_ANIMATION_DURATION = 800;
export const NOTIFICATION_DURATION = 3000;
export const IMAGE_CYCLE_INTERVAL = 2000;
export const FADE_TRANSITION_DURATION = 400;

/* =========================================
   API & Data
   ========================================= */

export const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBbLqkPWvBnKQIwvDPnBJhZVDSdYJrLXCaVDZZJpLqkPWvBnKQIwvDPnBJhZVDSdYJrLXCaVDZZJpL/pub?output=csv';

/* =========================================
   Currency Conversion
   ========================================= */

export const USD_TO_VND = 24000;

/* =========================================
   Design System
   ========================================= */

export const BASE_REM_SIZE = 10;
export const SPACING_UNIT = 0.8;

/* =========================================
   Validation Rules
   ========================================= */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 6;
