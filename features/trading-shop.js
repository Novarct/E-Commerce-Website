/* =========================================
   FEATURE: Trading Shop
   Description: ÆTHER Points trading system
   ========================================= */

import { AuthService } from '../services/auth-service.js';
import { PointsService } from '../services/points-service.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { showModal, hideModal, t } from '../utils/helpers.js';
import { Logger } from '../core/logger.js';

const SHOP_ITEMS = [
    {
        id: 'coupon-10',
        name: '10% OFF Coupon',
        code: 'AETHER10',
        cost: 500,
        type: 'percent',
        value: 0.1
    },
    {
        id: 'coupon-20',
        name: '20% OFF Coupon',
        code: 'AETHER20',
        cost: 1000,
        type: 'percent',
        value: 0.2
    },
    {
        id: 'coupon-freeship',
        name: 'Free Shipping',
        code: 'FREESHIP_PRO',
        cost: 300,
        type: 'shipping',
        value: 0
    },
    {
        id: 'coupon-50',
        name: '50% OFF Coupon',
        code: 'AETHER50',
        cost: 2500,
        type: 'percent',
        value: 0.5
    }
];

/** ⚙️ Action: Open trading shop */
/** ?? Action */
export const openTradingShop = () => {
    ensureShopModal();
    renderShopItems();
    showModal(document.getElementById('trading-shop-modal'));
};

/** 🔧 Core: Ensure shop modal exists */
const ensureShopModal = () => {
    if (document.getElementById('trading-shop-modal')) return;

    const modalHtml = `
        <div id="trading-shop-modal" class="modal-overlay hidden">
            <div class="modal-content trading-shop-content">
                <button class="close-modal">&times;</button>
                <div class="shop-header">
                    <h2><i class="fas fa-random"></i> ÆTHER Trading Shop</h2>
                    <p>Exchange your points for exclusive rewards</p>
                </div>
                <div class="user-balance-bar">
                    <span>Your Balance:</span>
                    <span class="shop-balance-value">Æ ${PointsService.getBalance()}</span>
                </div>
                <div id="shop-items-grid" class="shop-items-grid">
                    <!-- Items injected by JS -->
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('trading-shop-modal');
    modal.querySelector('.close-modal').onclick = () => hideModal(modal);
    modal.onclick = (e) => { if (e.target === modal) hideModal(modal); };
};

/** 🎨 Render: Shop items */
const renderShopItems = () => {
    const grid = document.querySelector('.shop-items-grid');

    const balance = PointsService.getBalance();
    const userCoupons = AuthService.getUserCoupons();
    const balanceDisplay = document.querySelector('.shop-balance-value');
    balanceDisplay.textContent = `Æ ${balance}`;

    grid.innerHTML = SHOP_ITEMS.map(item => {
        const canAfford = balance >= item.cost;
        const isOwned = userCoupons.some(c => c.code === item.code);

        let btnText = canAfford ? 'Redeem' : 'Insufficient Points';
        let btnClass = canAfford ? '' : 'disabled';
        let disabledAttr = canAfford ? '' : 'disabled';

        if (isOwned) {
            btnText = 'Redeemed';
            btnClass = 'owned';
            disabledAttr = 'disabled';
        }

        return `
            <div class="shop-item-card ${isOwned ? 'owned' : (canAfford ? '' : 'locked')}">
                <div class="item-icon">
                    <i class="fas ${item.type === 'shipping' ? 'fa-truck-fast' : 'fa-percent'}"></i>
                </div>
                <div class="item-info">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-cost">Cost: ${item.cost} Points</p>
                </div>
                <button class="redeem-btn ${btnClass}" ${disabledAttr} data-id="${item.id}">
                    ${btnText}
                </button>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.redeem-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.onclick = () => handleRedeem(btn.dataset.id);
        }
    });
};

/** 🔧 Core: Handle redemption */
const handleRedeem = (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);

    PointsService.redeemReward(item);
    NotificationSystem.showToast(t('itemRedeemed').replace('{item}', item.name), 'success');

    Logger.log('POINTS', `💎 Traded ${item.cost} points for ${item.code}`);

    renderShopItems();

    import('./account-panel.js').then(m => m.updateAccountUI());
};
