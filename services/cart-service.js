/* =========================================
   SERVICE: Cart
   Description: Shopping cart operations
   ========================================= */

import { state } from '../core/state.js';
import { StorageService } from './storage-service.js';
import { EventBus } from '../systems/event-bus.js';
import { AuthGuard } from './authguard.js';
import { Logger } from '../core/logger.js';

export class CartService {
    static CART_KEY = 'user_cart_list';

    /** 🔍 Query: Get all cart items */
    static getAll() {
        return state.cart || [];
    }

    /** ⚙️ Action: Load cart from storage */
    static load() {
        state.cart = StorageService.load(this.CART_KEY, []);
        return state.cart;
    }

    /** ⚙️ Action: Save cart to storage */
    static save() {
        StorageService.save(this.CART_KEY, state.cart);
    }

    /** ⚙️ Action: Add item to cart */
    static addItem(productId, options = {}) {
        return AuthGuard.require(() => {
            const id = String(productId);
            const quantity = options.quantity || 1;

            const product = state.inventorySource.find(p => p.id === id);
            const effectivePrice = product.effectivePrice || product.price;
            const existingItem = state.cart.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + quantity;
            } else {
                const hasFreeShipping = Array.isArray(product.discounts) &&
                    product.discounts.some(d => d.toUpperCase() === 'FREESHIP');

                state.cart.push({
                    id,
                    quantity,
                    price: effectivePrice,
                    hasFreeShipping
                });
            }

            this.save();
            this.emitUpdate();
            Logger.log('CART', `🛒 Added: ${product.name} (Qty: ${quantity})`);

            return state.cart;
        });
    }

    /** ⚙️ Action: Remove item */
    static removeItem(productId) {
        const id = String(productId);
        state.cart = state.cart.filter(item => item.id !== id);
        this.save();
        this.emitUpdate();
        Logger.log('CART', `🛒 Removed: ${productId}`);
        return state.cart;
    }

    /** ⚙️ Action: Update quantity */
    static updateQuantity(productId, quantity) {
        const id = String(productId);
        const item = state.cart.find(item => item.id === id);
        item.quantity = Math.max(1, parseInt(quantity) || 1);
        this.save();
        this.emitUpdate();
        return item;
    }

    /** ⚙️ Action: Increment quantity */
    static incrementQuantity(productId) {
        const id = String(productId);
        const item = state.cart.find(item => item.id === id);
        item.quantity = (item.quantity || 1) + 1;
        this.save();
        this.emitUpdate();
        return item;
    }

    /** ⚙️ Action: Decrement quantity */
    static decrementQuantity(productId) {
        const id = String(productId);
        const item = state.cart.find(item => item.id === id);

        if (item.quantity <= 1) {
            return this.removeItem(id);
        }

        item.quantity -= 1;
        this.save();
        this.emitUpdate();
        return item;
    }

    /** ⚙️ Action: Clear cart */
    static clear() {
        state.cart = [];
        this.save();
        this.emitUpdate();
        Logger.log('CART', '🛒 Cart cleared');
    }

    /** 🔍 Query: Get item count */
    static getItemCount() {
        return state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }

    /** 🔍 Query: Get subtotal */
    static getSubtotal() {
        return state.cart.reduce((sum, item) => {
            const product = state.inventorySource.find(p => p.id === String(item.id)) || item;
            const price = item.price || product.effectivePrice || product.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    }

    /** 🔍 Query: Check if empty */
    static isEmpty() {
        return state.cart.length === 0;
    }

    /** 🔍 Query: Check if has item */
    static hasItem(productId) {
        return state.cart.some(item => item.id === String(productId));
    }

    /** 🔍 Query: Get item */
    static getItem(productId) {
        return state.cart.find(item => item.id === String(productId)) || null;
    }

    /** 🔍 Query: Get items with details */
    static getItemsWithDetails() {
        return state.cart.map(item => ({
            ...item,
            product: state.inventorySource.find(p => p.id === String(item.id)) || null
        }));
    }

    /** ⚙️ Action: Validate cart */
    static validateCart() {
        const removedItems = [];
        const validItems = state.cart.filter(item => {
            const product = state.inventorySource.find(p => p.id === String(item.id));
            if (!product) {
                removedItems.push(item);
                return false;
            }
            return true;
        });

        if (removedItems.length > 0) {
            state.cart = validItems;
            this.save();
            this.emitUpdate();
        }

        return { valid: removedItems.length === 0, removedItems };
    }

    /** ⚙️ Action: Emit update event */
    static emitUpdate() {
        EventBus.emit('cart:updated', {
            items: state.cart,
            count: this.getItemCount(),
            subtotal: this.getSubtotal()
        });
        document.dispatchEvent(new CustomEvent('app:cartUpdated'));
    }

    /** ⚙️ Action: Initialize */
    static init() {
        this.load();
        EventBus.listen('app:inventorySynced', () => this.validateCart());
    }
}
