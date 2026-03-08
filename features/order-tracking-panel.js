/* =========================================
   FEATURE: Order Tracking Panel
   Description: Professional order tracking UI logic
   ========================================= */

import { OrderService } from '../services/order-service.js';
import { showModal, hideModal, t } from '../utils/helpers.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { EventBus } from '../systems/event-bus.js';
import { renderOrderHistory } from './account-panel.js';

let trackingModal;
let trackingOrderIdBadge;
let statusText;
let updateTime;
let cancelSection;
let cancelInput;
let confirmCancelBtn;

/** ⚙️ Action: Open tracking panel for a specific order */
export const openOrderTracking = (orderId) => {
    const order = OrderService.getOrder(orderId);
    if (!order) {
        NotificationSystem.showToast('Order not found', 'error');
        return;
    }

    const currentStatus = OrderService.getTrackedStatus(order);

    // Update labels and ID
    trackingOrderIdBadge.textContent = `#${order.id}`;
    updateTrackingUI(currentStatus, order);

    // Show/Hide cancellation section
    const isCancellable = currentStatus === OrderService.STATUSES.RECEIVED || currentStatus === OrderService.STATUSES.PACKAGING;
    cancelSection.style.display = isCancellable ? 'block' : 'none';
    cancelInput.value = '';
    confirmCancelBtn.dataset.orderId = orderId;

    showModal(trackingModal);
};

/** 🎨 Render: Update the progress UI */
const updateTrackingUI = (status, order) => {
    const steps = ['received', 'packaging', 'delivering', 'delivered'];
    const currentIdx = steps.indexOf(status);
    const iconEl = document.getElementById('status-icon-glyph');
    const iconRing = document.querySelector('.status-icon-center');
    const pulseRings = document.querySelectorAll('.status-pulse-ring');

    const statusIcons = {
        received: { icon: 'fa-receipt', color: 'var(--accent-primary)' },
        packaging: { icon: 'fa-box', color: 'var(--accent-primary)' },
        delivering: { icon: 'fa-truck-fast', color: '#00c896' },
        delivered: { icon: 'fa-circle-check', color: '#00c896' },
        cancelled: { icon: 'fa-times-circle', color: '#ff4d4d' }
    };

    // If cancelled, handle specially
    if (status === OrderService.STATUSES.CANCELLED) {
        const cfg = statusIcons.cancelled;
        iconEl.className = `fas ${cfg.icon}`;
        iconRing.style.borderColor = cfg.color;
        iconRing.style.color = cfg.color;
        pulseRings.forEach(r => r.style.borderColor = cfg.color);
        statusText.textContent = t('orderStatusCancelled');
        statusText.style.color = cfg.color;
        document.querySelectorAll('.tracking-step').forEach(s => s.classList.remove('active', 'completed'));
        document.querySelectorAll('.tracking-progress-line').forEach(l => l.classList.remove('completed'));
        updateTime.textContent = `Cancelled on: ${new Date().toLocaleDateString()}`;
        return;
    }

    // Reset colours for non-cancelled states
    const cfg = statusIcons[status] || statusIcons.received;
    iconEl.className = `fas ${cfg.icon} fa-spin`;
    iconRing.style.borderColor = '';
    iconRing.style.color = '';
    pulseRings.forEach(r => r.style.borderColor = '');
    statusText.style.color = '';

    // Update progress steps
    steps.forEach((step, idx) => {
        const stepEl = document.getElementById(`step-${step}`);
        if (idx < currentIdx) {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
        } else if (idx === currentIdx) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
        } else {
            stepEl.classList.remove('active', 'completed');
        }

        // Handle lines
        const line = stepEl.nextElementSibling;
        if (line && line.classList.contains('tracking-progress-line')) {
            if (idx < currentIdx) line.classList.add('completed');
            else line.classList.remove('completed');
        }
    });

    // Update status text
    const statusMessages = {
        received: t('orderStatusReceived'),
        packaging: t('orderStatusPackaging'),
        delivering: t('orderStatusDelivering'),
        delivered: t('orderStatusDelivered')
    };

    // Stop spinning on final step
    if (status === 'delivered') {
        iconEl.className = `fas ${cfg.icon}`;
    }

    statusText.textContent = statusMessages[status] || 'Order is being processed.';
    updateTime.textContent = `${t('lastUpdate')}: ${new Date().toLocaleTimeString()}`;
};

/** ⚙️ Action: Initialize the tracking panel */
export const initOrderTracking = () => {
    trackingModal = document.getElementById('order-tracking-modal');
    trackingOrderIdBadge = trackingModal.querySelector('.tracking-order-id-badge');
    statusText = document.getElementById('current-tracking-status-text');
    updateTime = document.getElementById('status-update-time');
    cancelSection = document.getElementById('cancel-order-section');
    cancelInput = document.getElementById('cancel-order-id-confirm');
    confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    // Close logic
    const closeBtns = trackingModal.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => btn.onclick = () => hideModal(trackingModal));

    // Cancellation logic
    confirmCancelBtn.onclick = () => {
        const orderId = confirmCancelBtn.dataset.orderId;
        const enteredId = cancelInput.value.trim().replace('#', '');
        const actualId = orderId.replace('#', '');

        if (enteredId === actualId) {
            const result = OrderService.cancelOrder(orderId);
            if (result.success) {
                NotificationSystem.showToast(result.message, 'success');
                updateTrackingUI(OrderService.STATUSES.CANCELLED, OrderService.getOrder(orderId));
                cancelSection.style.display = 'none';
                renderOrderHistory(); // Update the account panel list
            } else {
                NotificationSystem.showToast(result.message, 'error');
            }
        } else {
            NotificationSystem.showToast('Order ID mismatch. Please try again.', 'error');
            cancelInput.style.borderColor = 'var(--accent-danger)';
            setTimeout(() => cancelInput.style.borderColor = '', 2000);
        }
    };

    EventBus.listen('order:statusUpdated', (event) => {
        const { orderId, status } = event.detail;
        const modalIsOpen = trackingModal.classList.contains('show');
        const currentModalOrderId = trackingOrderIdBadge.textContent.replace('#', '');
        if (modalIsOpen && currentModalOrderId === orderId.replace('#', '')) {
            updateTrackingUI(status, OrderService.getOrder(orderId));
        }
    });
};
