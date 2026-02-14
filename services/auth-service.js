/* =========================================
   SERVICE: Authentication
   Description: User authentication and management
   ========================================= */

import { state } from '../core/state.js';
import { StorageService } from './storage-service.js';
import { EventBus } from '../systems/event-bus.js';
import { Logger } from '../core/logger.js';
import { COUPONS } from '../core/coupon-config.js';

export class AuthService {
    static AUTH_KEY = 'aether_logged_in';
    static EMAIL_KEY = 'aether_user_email';
    static NAME_KEY = 'aether_user_name';
    static AVATAR_KEY = 'aether_user_avatar';
    static ORDER_HISTORY_KEY = 'aether_order_history';
    static POINTS_KEY = 'aether_user_points';
    static POINTS_HISTORY_KEY = 'aether_user_points_history';
    static USERNAME_KEY = 'aether_user_username';
    static COUPONS_KEY = 'aether_user_coupons';
    static USED_COUPONS_KEY = 'aether_used_coupons';

    /** 🔍 Query: Check if authenticated */
    static isAuthenticated() {
        return state.loggedIn === true;
    }

    /** 🔍 Query: Get current user */
    static getCurrentUser() {
        return {
            email: state.userEmail || localStorage.getItem(this.EMAIL_KEY),
            name: state.userName || localStorage.getItem(this.NAME_KEY),
            username: state.userUsername || localStorage.getItem(this.USERNAME_KEY),
            avatar: state.userAvatar || localStorage.getItem(this.AVATAR_KEY),
            aetherPoints: parseInt(localStorage.getItem(this.POINTS_KEY) || '0'),
            pointsHistory: JSON.parse(localStorage.getItem(this.POINTS_HISTORY_KEY) || '[]'),
            usedCoupons: JSON.parse(localStorage.getItem(this.USED_COUPONS_KEY) || '[]')
        };
    }

    /** ⚙️ Action: Login user */
    static login(email, options = {}) {
        const userName = options.name || email.split('@')[0];
        const userUsername = options.username || userName;

        state.loggedIn = true;
        state.userEmail = email;
        state.userName = userName;
        state.userUsername = userUsername;

        localStorage.setItem(this.AUTH_KEY, 'true');
        localStorage.setItem(this.EMAIL_KEY, email);
        localStorage.setItem(this.NAME_KEY, userName);
        localStorage.setItem(this.USERNAME_KEY, userUsername);

        if (options.isSignup) {
            localStorage.setItem(this.POINTS_KEY, '0');
            localStorage.setItem(this.POINTS_HISTORY_KEY, '[]');

            const welcomeCoupons = [
                { ...COUPONS['WELCOME10'], code: 'WELCOME10' },
                { ...COUPONS['FREESHIP'], code: 'FREESHIP' }
            ];
            state.userCoupons = welcomeCoupons;
            localStorage.setItem(this.COUPONS_KEY, JSON.stringify(welcomeCoupons));

            Logger.log('AUTH', `🪵 New user: ${userUsername} (${email})`);
        }

        EventBus.emit('auth:login', { email, userName, isSignup: options.isSignup });
        EventBus.emit('auth:stateChanged', { loggedIn: true });
        document.dispatchEvent(new CustomEvent('app:authStateChanged'));

        if (options.isSignup) {
            document.dispatchEvent(new CustomEvent('app:registerSuccess'));
        }

        return this.getCurrentUser();
    }

    /** ⚙️ Action: Logout user */
    static logout() {
        state.loggedIn = false;
        state.userEmail = null;
        state.userName = null;
        state.userUsername = null;
        state.userAvatar = null;

        localStorage.removeItem(this.AUTH_KEY);

        EventBus.emit('auth:logout');
        EventBus.emit('auth:stateChanged', { loggedIn: false });
        document.dispatchEvent(new CustomEvent('app:logout'));
    }

    /** ⚙️ Action: Load auth state */
    static loadAuthState() {
        const persistedLogin = localStorage.getItem(this.AUTH_KEY) === 'true';
        state.loggedIn = persistedLogin;

        if (persistedLogin) {
            state.userEmail = localStorage.getItem(this.EMAIL_KEY);
            state.userName = localStorage.getItem(this.NAME_KEY);
            state.userAvatar = localStorage.getItem(this.AVATAR_KEY);
        }

        return persistedLogin;
    }

    /** ⚙️ Action: Update avatar */
    static updateAvatar(avatarData) {
        state.userAvatar = avatarData;
        localStorage.setItem(this.AVATAR_KEY, avatarData);
        EventBus.emit('auth:avatarUpdated', { avatar: avatarData });
    }

    /** ⚙️ Action: Update username */
    static updateUsername(newUsername) {
        const oldName = state.userUsername || localStorage.getItem(this.USERNAME_KEY);
        state.userUsername = newUsername;
        localStorage.setItem(this.USERNAME_KEY, newUsername);
        Logger.log('AUTH', `🪵 Username: ${oldName} → ${newUsername}`);
        EventBus.emit('auth:usernameUpdated', { newUsername });
    }

    /** ⚙️ Action: Save user data */
    static saveUser(user) {
        if (user.aetherPoints !== undefined) {
            localStorage.setItem(this.POINTS_KEY, user.aetherPoints.toString());
        }
        if (user.pointsHistory) {
            localStorage.setItem(this.POINTS_HISTORY_KEY, JSON.stringify(user.pointsHistory));
        }
        if (user.coupons) {
            localStorage.setItem(this.COUPONS_KEY, JSON.stringify(user.coupons));
        }
    }

    /** 🔍 Query: Get avatar */
    static getAvatar() {
        return state.userAvatar || localStorage.getItem(this.AVATAR_KEY);
    }

    /** 🔍 Query: Get order history */
    static getOrderHistory() {
        const history = StorageService.load(this.ORDER_HISTORY_KEY, []);
        state.orderHistory = history;
        return history;
    }

    /** ⚙️ Action: Add order */
    static addOrder(order) {
        const history = this.getOrderHistory();
        history.push(order);
        StorageService.save(this.ORDER_HISTORY_KEY, history);
        state.orderHistory = history;
        EventBus.emit('auth:orderAdded', { order });
        return history;
    }

    /** ⚙️ Action: Clear order history */
    static clearOrderHistory() {
        state.orderHistory = [];
        StorageService.save(this.ORDER_HISTORY_KEY, []);
        EventBus.emit('auth:orderHistoryCleared');
    }

    /** 🔍 Query: Get available coupons */
    static getAvailableCoupons() {
        return this.getUserCoupons();
    }

    /** 🔍 Query: Get user coupons */
    static getUserCoupons() {
        if (state.userCoupons) return state.userCoupons;
        const stored = localStorage.getItem(this.COUPONS_KEY);
        state.userCoupons = stored ? JSON.parse(stored) : [];
        return state.userCoupons;
    }

    /** 🔍 Query: Check if has coupon */
    static hasCoupon(code) {
        return COUPONS[code] && !this.hasUsedCoupon(code);
    }

    /** 🔍 Query: Check if used coupon */
    static hasUsedCoupon(code) {
        return this.getUsedCoupons().includes(code);
    }

    /** 🔍 Query: Get used coupons */
    static getUsedCoupons() {
        if (state.usedCoupons) return state.usedCoupons;
        state.usedCoupons = JSON.parse(localStorage.getItem(this.USED_COUPONS_KEY) || '[]');
        return state.usedCoupons;
    }

    /** ⚙️ Action: Consume coupon */
    static consumeCoupon(code) {
        const used = this.getUsedCoupons();
        if (!used.includes(code)) {
            used.push(code);
            state.usedCoupons = used;
            localStorage.setItem(this.USED_COUPONS_KEY, JSON.stringify(used));
        }

        const inventory = this.getUserCoupons();
        const index = inventory.findIndex(c => c.code === code);
        if (index !== -1) {
            inventory.splice(index, 1);
            state.userCoupons = inventory;
            localStorage.setItem(this.COUPONS_KEY, JSON.stringify(inventory));
        }

        EventBus.emit('auth:couponConsumed', { code });
        Logger.log('AUTH', `🪵 Coupon consumed: ${code}`);
    }

    /** ⚙️ Action: Add coupon */
    static addCoupon(coupon) {
        const coupons = this.getUserCoupons();
        if (coupons.some(c => c.code === coupon.code)) return false;

        coupons.push(coupon);
        state.userCoupons = coupons;
        localStorage.setItem(this.COUPONS_KEY, JSON.stringify(coupons));
        EventBus.emit('auth:couponAdded', { coupon });
        return true;
    }

    /** ⚙️ Action: Initialize */
    static init() {
        this.loadAuthState();

        EventBus.listen('order:placed', (e) => {
            if (this.isAuthenticated()) this.addOrder(e.detail);
        });

        document.addEventListener('app:orderPlaced', (e) => {
            if (this.isAuthenticated()) this.addOrder(e.detail);
        });
    }
}
