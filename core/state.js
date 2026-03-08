/* =========================================
   SYSTEM: State Management
   Description: Global application state
   ========================================= */

/** 🔧 Core: Application state object */
export const state = {
    inventorySource: [],
    wishlist: [],
    favorites: [],
    cart: [],
    currentLang: 'en',
    currentCurrency: 'USD',
    loggedIn: false,
    userEmail: '',
    userName: '',
    userAvatar: '',
    translations: {}
};

/** ⚙️ Action: Update single state property */
/** ?? Action */
export const setState = (key, value) => {
    state[key] = value;

    if (key === 'currentLang') {
        document.dispatchEvent(new CustomEvent('app:languageChanged', { detail: value }));
    }
    if (key === 'currentCurrency') {
        document.dispatchEvent(new CustomEvent('app:currencyChanged', { detail: value }));
    }
};

/** ⚙️ Action: Update multiple state properties */
/** ?? Action */
export const updateState = (updates) => {
    Object.keys(updates).forEach(key => setState(key, updates[key]));
};

/** 🔍 Query: Get state value */
/** ?? Query */
export const getState = (key) => state[key];

/** ⚙️ Action: Reset state to defaults */
/** ?? Action */
export const resetState = () => {
    state.inventorySource = [];
    state.wishlist = [];
    state.favorites = [];
    state.cart = [];
    state.currentLang = 'en';
    state.currentCurrency = 'USD';
    state.loggedIn = false;
    state.userEmail = '';
    state.userName = '';
    state.userAvatar = '';
};
