/**
 * Product Model
 * Represents a single product in the inventory.
 */
export class Product {
    constructor(data = {}) {
        this.id = data.id || '';
        this.name = data.name || 'Unknown Product';
        this.name_vn = data.name_vn || this.name;
        this.brand = data.brand || '';
        this.price = parseFloat(data.price) || 0;
        this.displayPrice = parseFloat(data.displayPrice) || this.price;
        this.image = data.image || 'assets/placeholder.svg';
        this.images = data.images || [this.image];
        this.stock = parseInt(data.stock) || 0;
        this.description = data.description || '';
        this.description_vn = data.description_vn || this.description;
        this.category = data.category || 'Uncategorized';
        this.discountType = data.discountType || 'none';
        this.discountOriginalPrice = parseFloat(data.discountOriginalPrice) || 0;
        this.discounts = data.discounts || [];
        this.status = data.status || '';
        this.rating = parseFloat(data.rating) || 0;
        this.reviewCount = parseInt(data.reviewCount) || 0;
        this.hasStock = data.hasStock !== undefined ? data.hasStock : (this.stock > 0);
        this.isUpcoming = String(data.status || '').toLowerCase() === 'upcoming';
    }

    get effectivePrice() {
        return this.displayPrice;
    }

    get isDiscounted() {
        return this.displayPrice < this.price;
    }
}
