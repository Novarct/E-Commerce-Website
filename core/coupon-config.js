/* =========================================
   SYSTEM: Coupon Configuration
   Description: Available coupons
   ========================================= */

export const COUPONS = {
    'WELCOME10': {
        type: 'percent',
        value: 0.1,
        description: 'Welcome gift: 10% off'
    },
    'AETHER10': {
        type: 'percent',
        value: 0.1,
        description: 'Standard Discount: 10% off'
    },
    'AETHER20': {
        type: 'percent',
        value: 0.2,
        description: 'Premium Discount: 20% off'
    },
    'AETHER50': {
        type: 'percent',
        value: 0.5,
        description: 'Super Discount: 50% off'
    },
    'FREESHIP': {
        type: 'shipping',
        value: 0,
        description: 'Free Shipping'
    },
    'FREESHIP_PRO': {
        type: 'shipping',
        value: 0,
        description: 'Premium Free Shipping'
    },
    'SAVE10': {
        type: 'percent',
        value: 0.1,
        description: 'Save 10%'
    },
    'TRADING_REWARD': {
        type: 'percent',
        value: 0.15,
        description: 'Trading Reward: 15% off'
    }
};
