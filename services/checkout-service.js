/* =========================================
   SERVICE: Checkout
   Description: Checkout process and order placement
   ========================================= */

import { PointsService } from './points-service.js';
import { CartService } from './cart-service.js';
import { state } from '../core/state.js';
import { EventBus } from '../systems/event-bus.js';
import { Logger } from '../core/logger.js';
import { AuthService } from './auth-service.js';
import { COUPONS } from '../core/coupon-config.js';

export class CheckoutService {
    static SHIPPING_RATES = {
        standard: 9.99,
        express: 19.99,
        international: 39.99
    };

    static FREE_SHIPPING_THRESHOLD = 299;

    /** 🔍 Query: Calculate shipping */
    static calculateShipping(shippingMethod = 'standard', subtotal = 0) {
        let shippingFee = this.SHIPPING_RATES[shippingMethod] || this.SHIPPING_RATES.standard;

        if (shippingMethod === 'standard' && subtotal > this.FREE_SHIPPING_THRESHOLD) {
            shippingFee = 0;
        }

        return shippingFee;
    }

    /** 🔍 Query: Validate coupon */
    static validateCoupon(code) {
        const upperCode = code.trim().toUpperCase();
        const couponDef = COUPONS[upperCode];

        if (!couponDef || !AuthService.hasCoupon(upperCode)) {
            return null;
        }

        return { ...couponDef, code: upperCode };
    }

    /** 🔍 Query: Calculate discount */
    static calculateDiscount(coupon, subtotal) {
        if (!coupon) return 0;
        if (coupon.type === 'percent') {
            return subtotal * coupon.value;
        }
        return 0;
    }

    /** 🔍 Query: Calculate totals */
    static calculateTotals(shippingMethod = 'standard', coupon = null) {
        const subtotal = CartService.getSubtotal();
        const cart = CartService.getAll();

        const validCoupon = typeof coupon === 'string' ? this.validateCoupon(coupon) : coupon;

        let shipping = this.calculateShipping(shippingMethod, subtotal);
        let discount = this.calculateDiscount(validCoupon, subtotal);

        const shouldApplyFreeShipping = this.checkBatchFreeShipping(cart, validCoupon);

        if (shouldApplyFreeShipping) {
            shipping = 0;
        } else if (validCoupon && validCoupon.type === 'shipping') {
            shipping = 0;
        }

        const total = Math.round(Math.max(0, subtotal + shipping - discount) * 100) / 100;

        return {
            subtotal,
            shipping,
            discount,
            total,
            coupon: validCoupon
        };
    }

    /** 🔍 Query: Check batch free shipping */
    static checkBatchFreeShipping(cartItems, coupon = null) {
        if (!cartItems || cartItems.length === 0) return false;
        return cartItems.every(item => item.hasFreeShipping === true);
    }

    /** 🔧 Core: Create order object */
    static createOrder(formData, totals) {
        const orderItems = state.cart.map(item => {
            const product = state.inventorySource.find(p => p.id === String(item.id)) || item;
            return {
                id: item.id,
                name: product.name || 'Unknown Product',
                quantity: item.quantity,
                price: item.price || product.effectivePrice || product.price
            };
        });

        const roundedTotal = Math.round(totals.total * 100) / 100;

        return {
            id: `ORD-${Date.now().toString().slice(-6)}`,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            customer: {
                name: formData.name || state.userName,
                email: formData.email || state.userEmail,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                zipCode: formData.zipCode,
                country: formData.country
            },
            items: orderItems,
            subtotal: totals.subtotal,
            shippingFee: totals.shipping,
            shippingMethod: formData.shippingMethod || 'standard',
            discount: totals.discount,
            coupon: totals.coupon?.code || null,
            total: roundedTotal,
            paymentMethod: formData.paymentMethod || 'card',
            status: 'pending'
        };
    }

    /** ⚙️ Action: Place order */
    static placeOrder(formData) {
        Logger.log('CHECKOUT', '💳 Processing order...', {
            customer: formData.email,
            method: formData.shippingMethod
        });

        const totals = this.calculateTotals(formData.shippingMethod, formData.couponCode);
        const order = this.createOrder(formData, totals);

        AuthService.addOrder(order);
        PointsService.awardPoints(PointsService.calculatePoints(totals.total), `Order #${order.id}`);

        if (totals.coupon) {
            AuthService.consumeCoupon(totals.coupon.code);
        }

        CartService.clear();

        Logger.log('CHECKOUT', `💳 Order ${order.id} placed: $${order.total.toFixed(2)}`);

        EventBus.emit('order:placed', order);
        document.dispatchEvent(new CustomEvent('app:orderPlaced', { detail: order }));

        return {
            success: true,
            orderId: order.id,
            message: 'Order placed successfully',
            ...order
        };
    }

    /** 🔍 Query: Validate form */
    static validateForm(formData) {
        const errors = {};
        const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'zipCode', 'country'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                errors[field] = `${field} is required`;
            }
        });

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            errors.phone = 'Invalid phone format';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    /** 🔍 Query: Get shipping methods */
    static getShippingMethods() {
        return Object.entries(this.SHIPPING_RATES).map(([method, rate]) => ({
            method,
            rate,
            label: method.charAt(0).toUpperCase() + method.slice(1)
        }));
    }

    /** 🔍 Query: Check if free shipping available */
    static isFreeShippingAvailable(subtotal = null) {
        const total = subtotal !== null ? subtotal : CartService.getSubtotal();
        return total > this.FREE_SHIPPING_THRESHOLD;
    }

    /** 🔍 Query: Get amount for free shipping */
    static getAmountForFreeShipping(subtotal = null) {
        const total = subtotal !== null ? subtotal : CartService.getSubtotal();
        const needed = this.FREE_SHIPPING_THRESHOLD - total;
        return Math.max(0, needed);
    }
}
