/* =========================================
   SYSTEM: Logger
   Description: Centralized logging with emoji icons
   ========================================= */

/** 🔧 Core: Logger system */
export const Logger = {
    enabled: localStorage.getItem('AETHER_DEBUG') !== 'false', // Default enabled unless explicitly disabled


    SYSTEMS: {
        CORE: 'CORE',
        AUTH: 'AUTH',
        CART: 'CART',
        POINTS: 'POINTS',
        UI: 'UI',
        NETWORK: 'NETWORK',
        INVENTORY: 'INVENTORY',
        CHECKOUT: 'CHECKOUT'
    },

    /** ⚙️ Action: Enable logging */
    enable() {
        this.enabled = true;
        localStorage.setItem('AETHER_DEBUG', 'true');
        console.log('%c🔧 ÆTHER Observatory Mode ENABLED', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    },

    /** ⚙️ Action: Disable logging */
    disable() {
        this.enabled = false;
        localStorage.setItem('AETHER_DEBUG', 'false');
        console.log('%c🚫 ÆTHER Observatory Mode DISABLED', 'background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
    },

    /** 🪵 Logger: Log message */
    log(system, message, data = null) {
        if (!this.enabled) return;

        const style = 'color: #3b82f6; font-weight: bold;';
        const prefix = `[${system}]`;

        if (data) {
            console.groupCollapsed(`%c${prefix} ${message}`, style);
            console.log(data);
            console.groupEnd();
        } else {
            console.log(`%c${prefix} ${message}`, style);
        }
    },

    /** 🪵 Logger: Log warning */
    warn(system, message, data = null) {
        if (!this.enabled) return;
        const prefix = `[${system}]`;
        console.warn(`${prefix} ${message}`, data || '');
    },

    /** 🪵 Logger: Log error */
    error(system, message, error = null) {
        console.error(`[${system}] ${message}`, error || '');
    },

    /** 🪵 Logger: Group logs */
    group(label) {
        if (this.enabled) console.group(label);
    },

    groupEnd() {
        if (this.enabled) console.groupEnd();
    },

    /** ⚙️ Action: Initialize logger */
    init() {
        // Show debug mode status on startup
        if (this.enabled) {
            console.log('%c🔧 ÆTHER Observatory Mode ACTIVE', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
            console.log('%c💡 Tip: Use window.AetherDebug.disable() to turn off logging', 'color: #6b7280; font-style: italic;');
            this.setupInteractionLogger();
        } else {
            console.log('%c🚫 ÆTHER Observatory Mode DISABLED', 'background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px;');
            console.log('%c💡 Tip: Use window.AetherDebug.enable() to turn on logging', 'color: #6b7280; font-style: italic;');
        }
    },

    /** ⚙️ Action: Setup interaction logger */
    setupInteractionLogger() {
        if (this._loggerAttached) return;
        this._loggerAttached = true;

        document.addEventListener('click', (e) => {
            if (!this.enabled) return;

            const target = e.target.closest('button, a, input, select, textarea, [role="button"]');
            if (target) {
                const elInfo = {
                    tag: target.tagName.toLowerCase(),
                    id: target.id ? `#${target.id}` : '',
                    class: target.className ? `.${target.className.split(' ').join('.')}` : '',
                    text: target.innerText?.substring(0, 30).replace(/\s+/g, ' ').trim() || target.value || ''
                };

                const logStyle = 'color: #8b5cf6; font-weight: bold;';
                console.log(
                    `%c[INTERACTION] Clicked ${elInfo.tag}${elInfo.id}${elInfo.class} "${elInfo.text}"`,
                    logStyle,
                    target
                );
            }
        }, true);
    }
};

window.AetherDebug = Logger;
