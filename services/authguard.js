/* =========================================
   SERVICE: Auth Guard
   Description: Authentication gating utility
   ========================================= */

import { state } from '../core/state.js';
import { t } from '../utils/helpers.js';

export class AuthGuard {
    /** 🔍 Query: Check if authenticated */
    static isAuthenticated() {
        return state.loggedIn === true;
    }

    /** ⚙️ Action: Require authentication */
    static require(fn, options = {}) {
        if (!this.isAuthenticated()) {
            if (options.onAuthFail) {
                options.onAuthFail();
            } else {
                this.showAuthModal(
                    options.message || t('loginRequired'),
                    options.messageText || t('loginRequiredText')
                );
            }
            return null;
        }

        return fn();
    }

    /** ⚙️ Action: Require authentication (async) */
    static async requireAsync(fn, options = {}) {
        if (!this.isAuthenticated()) {
            if (options.onAuthFail) {
                options.onAuthFail();
            } else {
                this.showAuthModal(
                    options.message || t('loginRequired'),
                    options.messageText || t('loginRequiredText')
                );
            }
            return null;
        }

        return await fn();
    }

    /** 🔧 Core: Wrap function with auth check */
    static wrap(fn, options = {}) {
        return (...args) => this.require(() => fn(...args), options);
    }

    /** 🔧 Core: Wrap async function with auth check */
    static wrapAsync(fn, options = {}) {
        return async (...args) => await this.requireAsync(() => fn(...args), options);
    }

    /** ⚙️ Action: Show auth modal */
    static showAuthModal(message, messageText) {
        import('../features/auth-modal.js').then(({ showAuthModal }) => {
            showAuthModal(message, messageText);
        });
    }

    /** 🔧 Core: Decorator for methods */
    static decorator(options = {}) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;

            descriptor.value = function (...args) {
                return AuthGuard.require(
                    () => originalMethod.apply(this, args),
                    options
                );
            };

            return descriptor;
        };
    }

    /** 🔍 Query: Check permissions */
    static hasPermission(permissions) {
        if (!this.isAuthenticated()) return false;

        const userPermissions = state.userPermissions;
        const requiredPermissions = permissions;

        return requiredPermissions.every(perm => userPermissions.includes(perm));
    }

    /** 🔍 Query: Get current user */
    static getCurrentUser() {
        return {
            email: state.userEmail || localStorage.getItem('user_email'),
            name: state.userName || localStorage.getItem('user_name'),
            avatar: state.userAvatar || localStorage.getItem('user_avatar')
        };
    }

    /** 🔧 Core: Execute based on auth state */
    static ifElse(authenticatedFn, unauthenticatedFn) {
        if (this.isAuthenticated()) {
            return authenticatedFn();
        } else {
            return unauthenticatedFn();
        }
    }
}
