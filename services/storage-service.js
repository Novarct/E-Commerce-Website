/* =========================================
   SERVICE: Storage
   Description: localStorage operations
   ========================================= */

import { Logger } from '../core/logger.js';

export class StorageService {
    /** ⚙️ Action: Save to localStorage */
    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        Logger.log('CORE', `Saved: ${key}`);
    }

    /** 🔍 Query: Load from localStorage */
    static load(key, defaultValue = null) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }

    /** ⚙️ Action: Remove from localStorage */
    static remove(key) {
        localStorage.removeItem(key);
    }

    /** 🔍 Query: Check if key exists */
    static has(key) {
        return localStorage.getItem(key) !== null;
    }

    /** ⚙️ Action: Clear all storage */
    static clear() {
        localStorage.clear();
    }

    /** 🔍 Query: Get keys by prefix */
    static getKeysByPrefix(prefix) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) keys.push(key);
        }
        return keys;
    }
}
