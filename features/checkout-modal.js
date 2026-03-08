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
    const selectedMethod = document.querySelector('input[name="shipping-method"]:checked').value || 'standard';
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

    // T&C checkbox validation
    const tcCheckbox = document.getElementById('tc-agree-checkbox');
    const tcRow      = document.getElementById('tc-agreement-row');
    
    // Clear error automatically when user checks it
    if (tcCheckbox && !tcCheckbox.dataset.listenerAdded) {
        tcCheckbox.addEventListener('change', () => {
            if (tcCheckbox.checked && tcRow) tcRow.classList.remove('tc-error-active');
        });
        tcCheckbox.dataset.listenerAdded = 'true';
    }

    if (tcCheckbox && !tcCheckbox.checked) {
        if (tcRow) {
            tcRow.classList.add('tc-error-active');
            tcRow.classList.remove('tc-shake');
            void tcRow.offsetWidth; // reflow to restart animation
            tcRow.classList.add('tc-shake');
        }
        tcCheckbox.focus();
        return;
    }
    
    if (tcRow) tcRow.classList.remove('tc-error-active');

    const submitBtn = document.getElementById('place-order-btn');
    if (!submitBtn) {
        Logger.error('[CHECKOUT]', 'Place order button not found');
        return;
    }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const selectedMethod = document.querySelector('input[name="shipping-method"]:checked').value || 'standard';
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
        // Reset T&C checkbox
        const tcCheckbox = document.getElementById('tc-agree-checkbox');
        if (tcCheckbox) tcCheckbox.checked = false;
        const tcErr = document.getElementById('tc-error-msg');
        if (tcErr) tcErr.style.display = 'none';

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

    // Numeric-only filtering for phone and ZIP fields
    const digitsOnlyFields = checkoutFormEl.querySelectorAll('[name="phone"], [name="zipCode"]');
    digitsOnlyFields.forEach(field => {
        field.addEventListener('keydown', (e) => {
            const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
            if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });
        field.addEventListener('input', () => {
            const pos = field.selectionStart;
            const cleaned = field.value.replace(/[^0-9]/g, '');
            if (field.value !== cleaned) {
                field.value = cleaned;
                field.setSelectionRange(pos - 1, pos - 1);
            }
        });
        field.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            const digits = pasted.replace(/[^0-9]/g, '');
            document.execCommand('insertText', false, digits);
        });
    });

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

    // Open T&C/Policy links from within the checkout modal
    const openTermsModal = (e) => {
        e.preventDefault();
        const termsModal = document.getElementById('terms-modal');


        // Ensure it appears above the checkout modal
        termsModal.style.zIndex = '99999';
        termsModal.classList.remove('hidden');
        // The CSS rule requires .show to become visible
        requestAnimationFrame(() => termsModal.classList.add('show'));

        const closeTerms = () => {
            termsModal.classList.remove('show');
            setTimeout(() => termsModal.classList.add('hidden'), 200);
        };

        const closeBtn = termsModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', closeTerms, { once: true });
        termsModal.addEventListener('click', (ev) => {
            if (ev.target === termsModal) closeTerms();
        }, { once: true });
    };
    document.getElementById('open-tc-from-checkout').addEventListener('click', openTermsModal);
    document.getElementById('open-privacy-from-checkout').addEventListener('click', openTermsModal);
    document.getElementById('open-shipping-from-checkout').addEventListener('click', openTermsModal);


    const closeCheckoutBtn = checkoutModalEl.querySelector('.close-modal');
    closeCheckoutBtn.addEventListener('click', hideCheckoutModal);
    checkoutModalEl.addEventListener('click', (e) => { if (e.target === checkoutModalEl) hideCheckoutModal(); });
};
