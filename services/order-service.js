/* =========================================
   SERVICE: Order Tracking
   Description: Order status management and cancellation
   ========================================= */

import { StorageService } from './storage-service.js';
import { AuthService } from './auth-service.js';
import { Logger } from '../core/logger.js';
import { EventBus } from '../systems/event-bus.js';

export class OrderService {
    static STATUSES = {
        RECEIVED: 'received',
        PACKAGING: 'packaging',
        DELIVERING: 'delivering',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
    };

    /** 🔍 Query: Get all orders from history */
    static getOrders() {
        return AuthService.getOrderHistory();
    }

    /** 🔍 Query: Get single order */
    static getOrder(orderId) {
        const orders = this.getOrders();
        return orders.find(o => o.id === orderId);
    }

    /** ⚙️ Action: Update order status */
    static updateStatus(orderId, newStatus) {
        const orders = this.getOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            StorageService.save(AuthService.ORDER_HISTORY_KEY, orders);
            EventBus.emit('order:statusUpdated', { orderId, status: newStatus });
            Logger.log('ORDER', `📦 Order ${orderId} status updated to: ${newStatus}`);
            return true;
        }
        return false;
    }

    /** ⚙️ Action: Cancel an order */
    static cancelOrder(orderId) {
        const order = this.getOrder(orderId);

        
        if (order.status === this.STATUSES.DELIVERED) {
            return { success: false, message: 'Cannot cancel a delivered order' };
        }
        
        if (order.status === this.STATUSES.CANCELLED) {
            return { success: false, message: 'Order is already cancelled' };
        }

        this.updateStatus(orderId, this.STATUSES.CANCELLED);
        Logger.log('ORDER', `❌ Order ${orderId} cancelled by user`);
        return { success: true, message: 'Order cancelled successfully' };
    }

    /** ⚙️ Action: Simulate tracking progress based on time */
    static getTrackedStatus(order) {
        if (order.status === this.STATUSES.CANCELLED || order.status === this.STATUSES.DELIVERED) {
            return order.status;
        }

        const now = Date.now();
        const elapsed = now - order.timestamp; // ms since order placed

        // Simulation thresholds (ms)
        const PACKAGING_TIME = 2 * 60 * 1000;    // 2 minutes
        const DELIVERING_TIME = 10 * 60 * 1000;   // 10 minutes
        const DELIVERED_TIME = 30 * 60 * 1000;   // 30 minutes

        let currentStatus = this.STATUSES.RECEIVED;

        if (elapsed > DELIVERED_TIME) currentStatus = this.STATUSES.DELIVERED;
        else if (elapsed > DELIVERING_TIME) currentStatus = this.STATUSES.DELIVERING;
        else if (elapsed > PACKAGING_TIME) currentStatus = this.STATUSES.PACKAGING;

        // If the simulated status is further ahead than the stored status, update it
        const statusHierarchy = [this.STATUSES.RECEIVED, this.STATUSES.PACKAGING, this.STATUSES.DELIVERING, this.STATUSES.DELIVERED];
        const currentIdx = statusHierarchy.indexOf(currentStatus);
        const storedIdx = statusHierarchy.indexOf(order.status);

        if (currentIdx > storedIdx && storedIdx !== -1 && order.id) {
            this.updateStatus(order.id, currentStatus);
            return currentStatus;
        }

        return order.status || this.STATUSES.RECEIVED;
    }
}
