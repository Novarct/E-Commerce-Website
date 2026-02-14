/* =========================================
   SYSTEM: Inventory Engine
   Description: Product data syncing and parsing
   ========================================= */

import { Product } from '../models/product.js';
import { Logger } from '../core/logger.js';
import { APP_CONFIG } from '../core/config.js';

/** 🔧 Core: CSV Source */
export const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfZQHKK1M4OEo_DOdzEXTyoa2o8f7DyscXStDkxZIeNyipKgNGUbdMzhRNH5xll_1Gdmugd9k4t1iQ/pub?output=csv';

/** 🔍 Query: Split CSV line */
const splitCSVLine = (line) => {
    const result = [];
    let curValue = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                curValue += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(curValue.trim());
            curValue = '';
        } else {
            curValue += char;
        }
    }
    result.push(curValue.trim());
    return result;
};

/** 🔍 Query: Build header map */
const buildHeaderMap = (headers) => {
    const map = {};
    const keyAliases = {
        id: ['id'],
        name: ['name'],
        brand: ['brand'],
        price: ['price'],
        image: ['images', 'image', 'img'],
        stock: ['stock', 'inventory', 'quantity'],
        status: ['status'],
        category: ['category_en', 'category', 'type'],
        description: ['description_en', 'description'],
        description_vn: ['description_vn'],
        name_vn: ['name_vn', 'title_vn'],
        discount: ['discounts', 'discount'],
        rating: ['rating', 'stars', 'rate'],
        reviewCount: ['reviews', 'review', 'review_count']
    };

    for (const [canonical, aliases] of Object.entries(keyAliases)) {
        for (const alias of aliases) {
            const idx = headers.findIndex(h => h.toLowerCase().trim() === alias.toLowerCase());
            if (idx >= 0) {
                map[canonical] = idx;
                break;
            }
        }
    }
    return map;
};

/** 🔍 Query: Parse CSV into products */
const parseCSVProducts = (csvText) => {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            inQuotes = !inQuotes;
            currentLine += char;
        } else if (char === '\n' && !inQuotes) {
            if (currentLine.trim()) {
                lines.push(currentLine.replace(/\r/g, ''));
            }
            currentLine = '';
        } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
            continue;
        } else {
            currentLine += char;
        }
    }

    if (currentLine.trim()) {
        lines.push(currentLine.replace(/\r/g, ''));
    }

    if (lines.length < 2) return [];

    const headers = splitCSVLine(lines[0]);
    const map = buildHeaderMap(headers);

    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = splitCSVLine(line);
            const get = (key) => {
                const value = values[map[key]] || '';
                return value.replace(/[\r\n]+/g, ' ').trim();
            };

            const price = parseFloat(get('price')) || 0;
            const discountRaw = get('discount');
            let displayPrice = price;
            let discountOriginalPrice = 0;
            let badgeText = '';

            const percentMatch = discountRaw.match(/^-(\d+)%$/);
            if (percentMatch) {
                const percent = parseInt(percentMatch[1], 10);
                discountOriginalPrice = price;
                displayPrice = Math.round(price * (1 - percent / 100) * 100) / 100;
                badgeText = `-${percent}%`;
            }

            return new Product({
                id: get('id'),
                name: get('name'),
                name_vn: get('name_vn') || get('name'),
                brand: get('brand'),
                price,
                displayPrice,
                discountOriginalPrice,
                image: (get('image').split(',')[0] || 'assets/placeholder.svg').trim(),
                images: get('image').split(',').map(s => s.trim()).filter(Boolean),
                stock: parseInt(get('stock'), 10) || 0,
                description: get('description'),
                description_vn: get('description_vn') || get('description'),
                category: get('category'),
                discountType: percentMatch ? 'percent' : (discountRaw ? 'text' : 'none'),
                badgeText,
                discounts: [discountRaw].filter(Boolean),
                status: get('status'),
                rating: parseFloat(get('rating')) || 0,
                reviewCount: parseInt(get('reviewCount'), 10) || 0
            });
        });
};

/** ⚙️ Action: Sync inventory from source */
export const syncInventory = async (csvUrl) => {
    const response = await fetch(csvUrl + `&t=${Date.now()}`);
    const csvText = await response.text();
    const products = parseCSVProducts(csvText);

    Logger.log('INVENTORY', 'Inventory synced');

    /** 🔍 Query: Log inventory source for verification */
    if (APP_CONFIG.debug.DEBUG_TABLE) {
        const limit = APP_CONFIG.debug.DEBUG_TABLE_LIMIT;
        const data = limit > 0 ? products.slice(0, limit) : products;
        console.table(data.map((p, i) => ({
            '#': i + 1,
            ID: p.id,
            Name: p.name,
            Brand: p.brand,
            Price: p.displayPrice,
            Stock: p.stock,
            Status: p.status
        })));
    }

    return products;
};
