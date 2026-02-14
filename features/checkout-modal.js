/* =========================================
   FEATURE: Checkout Modal
   Description: Checkout process and order placement
   ========================================= */

import { state } from '../core/state.js';
import { t, formatPrice, showModal, hideModal } from '../utils/helpers.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { CartService } from '../services/cart-service.js';
import { CheckoutService } from '../services/checkout-service.js';
import { AuthGuard } from '../services/authguard.js';
import { Logger } from '../core/logger.js';

const checkoutModalEl = document.getElementById('checkout-modal');
const checkoutSummaryContainer = document.getElementById('checkout-summary');
const checkoutTotalPriceEl = document.getElementById('checkout-total-price');
const checkoutFormEl = document.getElementById('checkout-form');
const shippingPriceEl = document.getElementById('checkout-shipping-price');
const couponInputEl = document.getElementById('coupon-input');
const appliedCouponContainerEl = document.getElementById('applied-coupon-container');
const applyCouponBtnEl = document.getElementById('apply-coupon-btn');
const shippingOptionsEl = document.getElementById('shipping-options');

let appliedCoupon = null;

/** 🔧 Core: Update checkout total */
/** ?? Action */
export const updateCheckoutTotal = () => {
    const selectedMethod = document.querySelector('input[name="shipping-method"]:checked')?.value || 'standard';
    const totals = CheckoutService.calculateTotals(selectedMethod, appliedCoupon);

    shippingPriceEl.textContent = totals.shipping === 0 ? t('free') || 'Free' : formatPrice(totals.shipping);

    const existingDiscountRow = document.querySelector('.discount-row');
    if (existingDiscountRow) existingDiscountRow.remove();

    if (totals.discount > 0) {
        checkoutSummaryContainer.insertAdjacentHTML('afterend', `
            <div class="checkout-summary-row discount-row">
                <span>${t('discount')}</span>
                <span class="discount-value">${formatPrice(totals.discount)}</span>
            </div>
        `);
    }

    checkoutTotalPriceEl.textContent = formatPrice(totals.total);

    return totals;
};

/** ⚙️ Action: Handle coupon apply */
/** ?? Action */
export const handleCouponApply = () => {
    const code = couponInputEl.value.trim().toUpperCase();
    const validCoupon = CheckoutService.validateCoupon(code);

    if (validCoupon) {
        appliedCoupon = validCoupon;
        couponInputEl.value = '';
        renderAppliedCoupon(appliedCouponContainerEl);
        updateCheckoutTotal();
        NotificationSystem.showToast(t('couponApplied'), 'success');
    } else {
        NotificationSystem.showToast(t('couponInvalid'), 'error');
    }
};

/** 🎨 Render: Applied coupon */
const renderAppliedCoupon = (container) => {
    if (!appliedCoupon) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }

    container.innerHTML = `
        <div class="coupon-badge">
            <i class="fas fa-ticket-alt"></i>
            <span>${appliedCoupon.code}</span>
            <button class="remove-coupon-btn" title="${t('remove')}">&times;</button>
        </div>
    `;
    container.classList.remove('hidden');

    container.querySelector('.remove-coupon-btn').onclick = () => {
        appliedCoupon = null;
        renderAppliedCoupon(container);
        updateCheckoutTotal();
    };
};

/** ⚙️ Action: Show checkout modal */
/** ?? Action */
export const showCheckoutModal = () => {
    if (CartService.isEmpty()) {
        NotificationSystem.showToast(t('cartEmptyAlert'), 'warning');
        return;
    }

    if (!state.loggedIn) {
        if (confirm(t('guestCheckoutPrompt') || 'Do you want to checkout as a guest?')) {
            state.isGuest = true;
        } else {
            import('./cart-panel.js').then(({ hideCartPanel }) => hideCartPanel());
            AuthGuard.showAuthModal(t('loginRequired'), t('loginToCheckout'));
            return;
        }
    }

    import('./cart-panel.js').then(({ hideCartPanel }) => hideCartPanel());

    if (state.loggedIn) {
        NotificationSystem.showToast(t('couponTip'), 'info');
    }

    appliedCoupon = null;
    renderAppliedCoupon(appliedCouponContainerEl);
    couponInputEl.value = '';

    checkoutSummaryContainer.innerHTML = '';
    const cart = CartService.getAll();

    cart.forEach(item => {
        const product = state.inventorySource.find(p => p.id === String(item.id)) || item;
        const name = product.name || 'Unknown Product';
        const lineTotal = item.price * item.quantity;
        checkoutSummaryContainer.insertAdjacentHTML('beforeend', `
            <div class="checkout-summary-item">
                <span>${name} × ${item.quantity}</span>
                <span>${formatPrice(lineTotal)}</span>
            </div>
        `);
    });

    updateCheckoutTotal();

    shippingOptionsEl.onchange = () => updateCheckoutTotal();

    showModal(checkoutModalEl);
};

/** ⚙️ Action: Hide checkout modal */
export const hideCheckoutModal = () => hideModal(checkoutModalEl);

/** ⚙️ Action: Handle place order */
/** ?? Action */
export const handlePlaceOrder = (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('place-order-btn');
    if (!submitBtn) {
        Logger.error('[CHECKOUT]', 'Place order button not found');
        return;
    }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const selectedMethod = document.querySelector('input[name="shipping-method"]:checked')?.value || 'standard';
    const formData = new FormData(checkoutFormEl);
    const formObject = Object.fromEntries(formData.entries());

    const orderData = {
        ...formObject,
        shippingMethod: selectedMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null
    };

    const result = CheckoutService.placeOrder(orderData);

    if (result.success) {
        NotificationSystem.showToast(t('orderSuccess'), 'success');

        checkoutFormEl.reset();
        appliedCoupon = null;
        appliedCouponContainerEl.innerHTML = '';
        couponInputEl.value = '';
        const standardOption = shippingOptionsEl.querySelector('input[value="standard"]');
        standardOption.checked = true;

        hideCheckoutModal();
        import('./cart-panel.js').then(({ hideCartPanel }) => hideCartPanel());
    } else {
        NotificationSystem.showToast(result.message || t('orderFailed'), 'error');
    }

    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = t('placeOrder') || 'Place Order';
    }, 500);
};

/** 🔧 Core: Navigate steps */
/** ?? Action */
export const goToStep = (stepNumber) => {
    const steps = checkoutModalEl.querySelectorAll('.step');
    const contents = checkoutModalEl.querySelectorAll('.checkout-step-content');

    steps.forEach(s => s.classList.toggle('active', parseInt(s.dataset.step) === stepNumber));
    contents.forEach((c, i) => c.classList.toggle('active', i + 1 === stepNumber));
};

let checkoutInitialized = false;

/** ⚙️ Action: Initialize checkout modal */
/** ?? Action */
/** ?? Core */
export const initCheckoutModal = () => {
    if (checkoutInitialized) return;
    checkoutInitialized = true;

    applyCouponBtnEl.onclick = handleCouponApply;

    checkoutModalEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('next-step')) {
            const currentStep = e.target.closest('.checkout-step-content');
            const inputs = currentStep.querySelectorAll('input[required]');
            let valid = true;
            inputs.forEach(i => { if (!i.checkValidity()) { i.reportValidity(); valid = false; } });

            if (valid) {
                const nextStepNum = parseInt(currentStep.id.split('-')[1]) + 1;
                goToStep(nextStepNum);
            }
        } else if (e.target.classList.contains('prev-step')) {
            const currentStep = e.target.closest('.checkout-step-content');
            const prevStepNum = parseInt(currentStep.id.split('-')[1]) - 1;
            goToStep(prevStepNum);
        }
    });

    checkoutFormEl.addEventListener('submit', handlePlaceOrder);

    const closeCheckoutBtn = checkoutModalEl.querySelector('.close-modal');
    closeCheckoutBtn.addEventListener('click', hideCheckoutModal);
    checkoutModalEl.addEventListener('click', (e) => { if (e.target === checkoutModalEl) hideCheckoutModal(); });
};
