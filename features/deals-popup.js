/* =========================================
   FEATURE: Today's Deals Popup
   Description: First-visit popup showcasing active flash sale deals
   ========================================= */

import { ProductService } from '../services/product-service.js';
import { t, formatPrice } from '../utils/helpers.js';
import { getState } from '../core/state.js';

const STORAGE_KEY = 'aether_deals_dismissed';

/** Category icon mapping */
const CATEGORY_ICONS = {
    'RAMs':         { icon: 'fa-memory',       bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
    'CPUs':         { icon: 'fa-microchip',    bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    'GPUs':         { icon: 'fa-display',      bg: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    'Motherboards': { icon: 'fa-server',       bg: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
    'PSUs':         { icon: 'fa-bolt',         bg: 'linear-gradient(135deg, #fa709a, #fee140)' },
    'Cooling':      { icon: 'fa-snowflake',    bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
    'Cases':        { icon: 'fa-box-open',     bg: 'linear-gradient(135deg, #fccb90, #d57eeb)' },
    'Pre-builts':   { icon: 'fa-desktop',      bg: 'linear-gradient(135deg, #96fbc4, #f9f586)' },
};

/** 🔍 Query: Analyze today's deals from inventory */
function analyzeDealData() {
    const products = ProductService.getAll().filter(p => !p.isUpcoming);
    const onSale = products.filter(p => p.discountType === 'percent');
    const freeship = products.filter(p =>
        p.discounts && p.discounts.some(d => /freeship/i.test(d))
    );

    // Group by category
    const categoryDeals = {};
    onSale.forEach(p => {
        if (!categoryDeals[p.category]) {
            categoryDeals[p.category] = { count: 0, maxDiscount: 0, products: [] };
        }
        categoryDeals[p.category].count++;
        // Calculate discount % from price difference
        const pct = p.price > 0 ? Math.round((1 - p.displayPrice / p.price) * 100) : 0;
        if (pct > categoryDeals[p.category].maxDiscount) {
            categoryDeals[p.category].maxDiscount = pct;
        }
        categoryDeals[p.category].products.push(p);
    });

    // Compute max single discount
    const maxDiscount = onSale.reduce((max, p) => {
        const pct = p.price > 0 ? Math.round((1 - p.displayPrice / p.price) * 100) : 0;
        return pct > max ? pct : max;
    }, 0);

    return {
        totalOnSale: onSale.length,
        totalProducts: products.length,
        freeshipCount: freeship.length,
        maxDiscount,
        categoryDeals,
    };
}

/** 🎨 Render: Build popup HTML */
function renderPopup(data) {
    const lang = getState('currentLang');
    const isVN = lang === 'vi';

    const statsHTML = `
        <div class="deals-stats">
            <div class="deals-stat-card">
                <span class="stat-value">${data.totalOnSale}</span>
                <span class="stat-label">${isVN ? 'Sản phẩm giảm giá' : 'Items on Sale'}</span>
            </div>
            <div class="deals-stat-card">
                <span class="stat-value">${data.maxDiscount}%</span>
                <span class="stat-label">${isVN ? 'Giảm tối đa' : 'Max Discount'}</span>
            </div>
            <div class="deals-stat-card">
                <span class="stat-value">${data.freeshipCount}</span>
                <span class="stat-label">${isVN ? 'Miễn phí vận chuyển' : 'Free Shipping'}</span>
            </div>
        </div>
    `;

    const categories = Object.entries(data.categoryDeals)
        .sort((a, b) => b[1].maxDiscount - a[1].maxDiscount)
        .slice(0, 5);

    const categoriesHTML = categories.map(([cat, info]) => {
        const cfg = CATEGORY_ICONS[cat] || { icon: 'fa-tag', bg: 'linear-gradient(135deg, #667eea, #764ba2)' };
        return `
            <div class="deals-category-row">
                <div class="cat-icon" style="background: ${cfg.bg}; color: white;">
                    <i class="fas ${cfg.icon}"></i>
                </div>
                <div class="cat-info">
                    <span class="cat-name">${cat}</span>
                    <span class="cat-detail">${info.count} ${isVN ? 'sản phẩm đang giảm giá' : 'products on sale'}</span>
                </div>
                <span class="cat-badge">${isVN ? 'GIẢM ĐẾN' : 'UP TO'} ${info.maxDiscount}% ${isVN ? '' : 'OFF'}</span>
            </div>
        `;
    }).join('');

    const couponsHTML = `
        <div class="deals-coupons">
            <div class="coupon-chip welcome">
                <i class="fas fa-ticket-alt"></i>
                WELCOME10 — ${isVN ? 'Giảm 10% cho thành viên mới' : '10% off for new members'}
            </div>
            <div class="coupon-chip freeship">
                <i class="fas fa-truck"></i>
                FREESHIP — ${isVN ? 'Miễn phí vận chuyển' : 'Free shipping'}
            </div>
        </div>
    `;

    return `
        <div class="deals-popup">
            <button class="deals-popup-close" id="deals-popup-close">&times;</button>
            <div class="deals-popup-header">
                <div class="deals-tag">
                    <span class="pulse-dot"></span>
                    ${isVN ? 'ĐANG DIỄN RA' : 'LIVE NOW'}
                </div>
                <h2>🔥 ${isVN ? 'Ưu Đãi Hôm Nay' : "Today's Hot Deals"}</h2>
                <p>${isVN ? 'Khuyến mãi có thời hạn — đừng bỏ lỡ!' : 'Limited-time offers — grab them before they expire!'}</p>
            </div>
            <div class="deals-popup-body">
                ${statsHTML}
                ${categoriesHTML ? `<div class="deals-categories">${categoriesHTML}</div>` : ''}
                ${couponsHTML}
            </div>
            <div class="deals-popup-footer">
                <button class="deals-shop-btn" id="deals-shop-btn">
                    <i class="fas fa-bolt"></i>
                    ${isVN ? 'Mua Ngay' : 'Shop the Sale'}
                </button>
                <button class="deals-dismiss-btn" id="deals-dismiss-btn">
                    ${isVN ? 'Để sau' : 'Maybe Later'}
                </button>
            </div>
        </div>
    `;
}

/** ⚙️ Action: Show the popup */
function showPopup() {
    const data = analyzeDealData();

    // Don't show if no deals
    if (data.totalOnSale === 0) return;

    const overlay = document.getElementById('deals-popup-overlay');
    overlay.innerHTML = renderPopup(data);

    // Slight delay for DOM paint
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    });

    // Close handlers
    const closeBtn = document.getElementById('deals-popup-close');
    const dismissBtn = document.getElementById('deals-dismiss-btn');
    const shopBtn = document.getElementById('deals-shop-btn');

    const close = () => {
        overlay.classList.remove('show');
        sessionStorage.setItem(STORAGE_KEY, Date.now());
    };

    closeBtn.addEventListener('click', close);
    dismissBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    shopBtn.addEventListener('click', () => {
        close();
        // Scroll to products section
        const productsSection = document.querySelector('.section-title');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

/** ⚙️ Action: Initialize deals popup */
export const initDealsPopup = () => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // Wait for inventory to load, then show popup after a short delay
    document.addEventListener('app:inventorySynced', () => {
        setTimeout(showPopup, 1500);
    }, { once: true });
};
