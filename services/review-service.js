/* =========================================
   SERVICE: Review
   Description: Product review management with seeding
   ========================================= */

import { StorageService } from './storage-service.js';
import { Logger } from '../core/logger.js';

export class ReviewService {
    static REVIEWS_KEY = 'aether_product_reviews';
    static SEEDED_FLAG_KEY = 'aether_reviews_seeded';

    static HUMAN_NAMES = [
        'Alex Johnson', 'TechWiz_99', 'Sarah M.', 'David Chen', 'GamingGuru',
        'Emily Watson', 'Mike R.', 'PixelMaster', 'Linda_Dev', 'Chris_ProBuild',
        'Jessica T.', 'Brandon K.', 'AetherEnthusiast', 'CyberBuilder', 'Ryan_P'
    ];

    static REVIEW_COMMENTS = [
        'The performance is absolutely top-notch. Noticed a significant speed boost in my daily tasks.',
        'Installation was a breeze. Fits perfectly in my case and looks great.',
        'Great value for the price. Stays cool even under heavy load.',
        'Build quality is solid. You can tell they didn\'t cut any corners.',
        'Efficient and reliable. Best upgrade I\'ve made in a while.',
        'Smooth experience overall. Highly recommend for any PC enthusiast.',
        'Runs quiet and cool. Exactly what I was looking for.',
        'A bit pricey but definitely worth it for the performance you get.',
        'The design is sleek and modern. Adds a nice touch to my setup.',
        'Exceeded my expectations. Delivery was fast too!',
        'No issues so far. Been using it for a week and it works like a charm.',
        'Compatibility was perfect with my current setup. Plug and play.',
        'The aesthetic fits my build perfectly. RGB is a nice touch too.',
        'Powerful yet power-efficient. Impressed with the thermal management.',
        'If you\'re building a high-end rig, this is a must-have component.'
    ];

    /** ⚙️ Action: Seed reviews for a product if not already seeded */
    static seedReviews(productId) {
        const id = String(productId);
        const seededFlags = StorageService.load(this.SEEDED_FLAG_KEY, {});

        if (seededFlags[id]) return;

        const allReviews = StorageService.load(this.REVIEWS_KEY, {});
        if (!allReviews[id]) {
            allReviews[id] = [];
        }

        const count = Math.floor(Math.random() * 4) + 3; // 3 to 6 reviews
        const availableNames = [...this.HUMAN_NAMES];
        const availableComments = [...this.REVIEW_COMMENTS];

        for (let i = 0; i < count; i++) {
            const nameIndex = Math.floor(Math.random() * availableNames.length);
            const commentIndex = Math.floor(Math.random() * availableComments.length);
            
            const name = availableNames.splice(nameIndex, 1)[0];
            const comment = availableComments.splice(commentIndex, 1)[0];
            const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars for seeded reviews
            
            // Random date within the last 6 months
            const date = new Date();
            date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
            date.setDate(date.getDate() - Math.floor(Math.random() * 28));

            const seededReview = {
                id: `seeded-${Date.now()}-${i}`,
                userName: name,
                userAvatar: '',
                rating: rating,
                comment: comment,
                timestamp: date.toISOString(),
                isSeeded: true
            };

            allReviews[id].push(seededReview);
        }

        // Sort by timestamp
        allReviews[id].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        StorageService.save(this.REVIEWS_KEY, allReviews);
        
        seededFlags[id] = true;
        StorageService.save(this.SEEDED_FLAG_KEY, seededFlags);
        
        Logger.log('REVIEW', `🌱 Seeded ${count} reviews for product ${id}`);
    }

    /** 🔍 Query: Get all reviews for a product (seeds if necessary) */
    /** ?? Query */
    static getReviews(productId) {
        this.seedReviews(productId);
        const id = String(productId);
        const allReviews = StorageService.load(this.REVIEWS_KEY, {});
        return allReviews[id];
    }

    /** ⚙️ Action: Add a review */
    /** ?? Action */
    static addReview(productId, review) {
        const id = String(productId);
        const allReviews = StorageService.load(this.REVIEWS_KEY, {});
        
        if (!allReviews[id]) {
            allReviews[id] = [];
        }

        const newReview = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...review
        };

        allReviews[id].unshift(newReview);
        StorageService.save(this.REVIEWS_KEY, allReviews);
        
        Logger.log('REVIEW', `⭐ Review added for product ${id}`, newReview);
        return newReview;
    }

    /** 🔍 Query: Get average rating */
    /** ?? Query */
    static getAverageRating(productId) {
        const reviews = this.getReviews(productId);
        // Naked Logic: assumed that reviews array exists and contains valid elements
        
        const sum = reviews.reduce((total, r) => total + r.rating, 0);
        return parseFloat((sum / reviews.length).toFixed(1));
    }
}
