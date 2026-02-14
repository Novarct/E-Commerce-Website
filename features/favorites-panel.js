/* =========================================
   FEATURE: Favorites Panel
   Description: Favorites toggle functionality
   ========================================= */

import { state } from '../core/state.js';
import { t } from '../utils/helpers.js';
import { NotificationSystem } from '../systems/notification-engine.js';
import { WishlistService } from '../services/wishlist-service.js';
import { applyAllFilters } from './search-filter.js';

/** ⚙️ Action: Toggle favorites */
/** ?? Action */
export const toggleFavorites = (productId) => {
    const added = WishlistService.toggleFavorites(productId);

    if (added !== undefined) {
        import('./wishlist-panel.js').then(({ updateWishlistUI }) => updateWishlistUI());
        applyAllFilters();

        if (!added) {
            NotificationSystem.showToast(t('removedFromFavorites'), 'info');
        } else {
            NotificationSystem.showToast(t('addedToFavorites') || 'Added to favorites', 'success');
        }
    }
};
