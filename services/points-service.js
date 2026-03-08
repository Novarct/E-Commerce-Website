/* =========================================
   SERVICE: Points
   Description: ÆTHER Points management
   ========================================= */

import { AuthService } from './auth-service.js';
import { EventBus } from '../systems/event-bus.js';
import { Logger } from '../core/logger.js';

export class PointsService {
    static POINTS_PER_DOLLAR = 10;

    /** 🔍 Query: Calculate points */
    static calculatePoints(total) {
        const numericTotal = Math.round(total * 100) / 100;
        const points = Math.floor(numericTotal * this.POINTS_PER_DOLLAR);
        Logger.log('POINTS', `💎 Calculated ${points} points for $${total}`);
        return points;
    }

    /** ⚙️ Action: Award points */
    static awardPoints(points, source) {
        const user = AuthService.getCurrentUser();
        user.aetherPoints = user.aetherPoints + points;


        user.pointsHistory.push({
            date: new Date().toLocaleDateString(),
            amount: points,
            type: 'gain',
            description: source
        });

        AuthService.saveUser(user);
        Logger.log('POINTS', `💎 Awarded: ${points} (${source}) → Balance: ${user.aetherPoints}`);

        EventBus.emit('points:updated', { balance: user.aetherPoints, change: points, type: 'gain' });
    }

    /** ⚙️ Action: Deduct points */
    static deductPoints(points, description) {
        const user = AuthService.getCurrentUser();
        user.aetherPoints -= points;


        user.pointsHistory.push({
            date: new Date().toLocaleDateString(),
            amount: points,
            type: 'loss',
            description: description
        });

        AuthService.saveUser(user);
        Logger.log('POINTS', `💎 Deducted: -${points} (${description}) → Balance: ${user.aetherPoints}`);

        EventBus.emit('points:updated', { balance: user.aetherPoints, change: points, type: 'loss' });
        return true;
    }

    /** ⚙️ Action: Redeem reward */
    static redeemReward(item) {
        const description = `Redeemed ${item.name}`;
        this.deductPoints(item.cost, description);

        const coupon = {
            code: item.code,
            type: item.type,
            value: item.value,
            description: item.name
        };

        AuthService.addCoupon(coupon);
        Logger.log('POINTS', `💎 Reward: ${item.code}`);

        return true;
    }

    /** 🔍 Query: Get balance */
    static getBalance() {
        const user = AuthService.getCurrentUser();
        return user.aetherPoints;
    }
}
