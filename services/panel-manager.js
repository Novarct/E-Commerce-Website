/* =========================================
   SERVICE: Panel Manager
   Description: UI panel state management
   ========================================= */

import { Logger } from '../core/logger.js';

export const PanelManager = {
    activePanel: null,
    activeOverlay: null,

    /** ⚙️ Action: Show panel */
    show(panel, overlay) {
        if (this.activePanel && this.activePanel !== panel) {
            this.hide(this.activePanel, this.activeOverlay);
        }

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('show');
        }

        panel.classList.remove('hidden');
        panel.classList.add('show');
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('no-scroll');

        Logger.log('UI', `Panel opened: ${panel.id}`);

        this.activePanel = panel;
        this.activeOverlay = overlay;
    },

    /** ⚙️ Action: Hide panel */
    hide(panel, overlay) {
        const targetPanel = panel || this.activePanel;
        const targetOverlay = overlay || this.activeOverlay;

        if (targetOverlay) {
            targetOverlay.classList.remove('show');
        }

        targetPanel.classList.remove('show');
        targetPanel.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('no-scroll');

        Logger.log('UI', `Panel closed: ${targetPanel.id}`);

        if (this.activePanel === targetPanel) {
            this.activePanel = null;
            this.activeOverlay = null;
        }
    },

    /** ⚙️ Action: Close all panels */
    closeAll() {
        if (this.activePanel) {
            this.hide(this.activePanel, this.activeOverlay);
        }
    }
};
