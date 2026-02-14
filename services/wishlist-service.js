/* =========================================
   SERVICE: Wishlist
   Description: Wishlist and favorites management
   ========================================= */

import { state } from '../core/state.js';
import { StorageService } from './storage-service.js';
import { EventBus } from '../systems/event-bus.js';
import { AuthGuard } from './authguard.js';
import { Logger } from '../core/logger.js';

export class WishlistService {
    static WISHLIST_KEY = 'user_wishlist_list';
    static FAVORITES_KEY = 'user_favorites_list';

    /** ⚙️ Action: Load from storage */
    static load() {
        state.wishlist = StorageService.load(this.WISHLIST_KEY, []);
        state.favorites = StorageService.load(this.FAVORITES_KEY, []);
    }

    /** ⚙️ Action: Save to storage */
    static save() {
        StorageService.save(this.WISHLIST_KEY, state.wishlist);
        StorageService.save(this.FAVORITES_KEY, state.favorites);
    }

    /** 🔍 Query: Get wishlist */
    static getWishlist() {
        return state.wishlist || [];
    }

    /** 🔍 Query: Get favorites */
    static getFavorites() {
        return state.favorites || [];
    }

    /** 🔍 Query: Get total count */
    static getTotalCount() {
        return (state.wishlist?.length || 0) + (state.favorites?.length || 0);
    }

    /** 🔍 Query: Check if in wishlist */
    static isInWishlist(productId) {
        return state.wishlist.some(item => item.id === String(productId));
    }

    /** 🔍 Query: Check if in favorites */
    static isInFavorites(productId) {
        return state.favorites.some(item => item.id === String(productId));
    }

    /** ⚙️ Action: Toggle wishlist */
    static toggleWishlist(productId) {
        return AuthGuard.require(() => {
            const id = String(productId);
            const index = state.wishlist.findIndex(item => item.id === id);

            if (index >= 0) {
                state.wishlist.splice(index, 1);
                this.save();
                this.emitUpdate('wishlist', false);
                Logger.log('UI', `Wishlist ${id}: Removed`);
                return false;
            } else {
                const product = state.inventorySource.find(p => p.id === id);
                state.wishlist.push(product);
                this.save();
                this.emitUpdate('wishlist', true);
                Logger.log('UI', `Wishlist ${id}: Added`);
                return true;
            }
        });
    }

    /** ⚙️ Action: Toggle favorites */
    static toggleFavorites(productId) {
        return AuthGuard.require(() => {
            const id = String(productId);
            const index = state.favorites.findIndex(item => item.id === id);

            if (index >= 0) {
                state.favorites.splice(index, 1);
                this.save();
                this.emitUpdate('favorites', false);
                Logger.log('UI', `Favorites ${id}: Removed`);
                return false;
            } else {
                const product = state.inventorySource.find(p => p.id === id);
                state.favorites.push(product);
                this.save();
                this.emitUpdate('favorites', true);
                Logger.log('UI', `Favorites ${id}: Added`);
                return true;
            }
        });
    }

    /** ⚙️ Action: Add to wishlist */
    static addToWishlist(productId) {
        return AuthGuard.require(() => {
            const id = String(productId);
            if (this.isInWishlist(id)) return false;

            const product = state.inventorySource.find(p => p.id === id);
            state.wishlist.push(product);
            this.save();
            this.emitUpdate('wishlist', true);
            return true;
        });
    }

    /** ⚙️ Action: Add to favorites */
    static addToFavorites(productId) {
        return AuthGuard.require(() => {
            const id = String(productId);
            if (this.isInFavorites(id)) return false;

            const product = state.inventorySource.find(p => p.id === id);
            state.favorites.push(product);
            this.save();
            this.emitUpdate('favorites', true);
            return true;
        });
    }

    /** ⚙️ Action: Remove from wishlist */
    static removeFromWishlist(productId) {
        const id = String(productId);
        const index = state.wishlist.findIndex(item => item.id === id);
        if (index < 0) return false;

        state.wishlist.splice(index, 1);
        this.save();
        this.emitUpdate('wishlist', false);
        return true;
    }

    /** ⚙️ Action: Remove from favorites */
    static removeFromFavorites(productId) {
        const id = String(productId);
        const index = state.favorites.findIndex(item => item.id === id);
        if (index < 0) return false;

        state.favorites.splice(index, 1);
        this.save();
        this.emitUpdate('favorites', false);
        return true;
    }

    /** ⚙️ Action: Clear all */
    static clearAll() {
        state.wishlist = [];
        state.favorites = [];
        this.save();
        this.emitUpdate('all', false);
    }

    /** ⚙️ Action: Clear wishlist */
    static clearWishlist() {
        state.wishlist = [];
        this.save();
        this.emitUpdate('wishlist', false);
    }

    /** ⚙️ Action: Clear favorites */
    static clearFavorites() {
        state.favorites = [];
        this.save();
        this.emitUpdate('favorites', false);
    }

    /** ⚙️ Action: Validate against inventory */
    static validate() {
        const removedWishlist = [];
        const removedFavorites = [];

        const validWishlist = state.wishlist.filter(item => {
            const product = state.inventorySource.find(p => p.id === String(item.id));
            if (!product) {
                removedWishlist.push(item);
                return false;
            }
            return true;
        });

        const validFavorites = state.favorites.filter(item => {
            const product = state.inventorySource.find(p => p.id === String(item.id));
            if (!product) {
                removedFavorites.push(item);
                return false;
            }
            return true;
        });

        const hasChanges = removedWishlist.length > 0 || removedFavorites.length > 0;

        if (hasChanges) {
            state.wishlist = validWishlist;
            state.favorites = validFavorites;
            this.save();
            this.emitUpdate('all', false);
        }

        return { valid: !hasChanges, removedWishlist, removedFavorites };
    }

    /** ⚙️ Action: Emit update event */
    static emitUpdate(type, added) {
        EventBus.emit('wishlist:updated', {
            type,
            added,
            wishlist: state.wishlist,
            favorites: state.favorites,
            totalCount: this.getTotalCount()
        });
    }

    /** ⚙️ Action: Initialize */
    static init() {
        this.load();
        EventBus.listen('app:inventorySynced', () => this.validate());
    }
}
