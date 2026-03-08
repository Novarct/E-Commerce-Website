/**
 * Product Model
 * Represents a single product in the inventory.
 */
export class Product {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.name_vn = data.name_vn;
        this.brand = data.brand;
        this.price = parseFloat(data.price);
        this.displayPrice = parseFloat(data.displayPrice);
        this.image = data.image;
        this.images = data.images;
        this.stock = parseInt(data.stock);
        this.description = data.description;
        this.description_vn = data.description_vn;
        this.category = data.category;
        this.discountType = data.discountType;
        this.discountOriginalPrice = parseFloat(data.discountOriginalPrice);
        this.discounts = data.discounts;
        this.status = data.status;
        this.rating = parseFloat(data.rating);
        this.reviewCount = parseInt(data.reviewCount);
        this.hasStock = data.hasStock;
        this.isUpcoming = String(data.status).toLowerCase() === 'upcoming';
    }

    get effectivePrice() {
        return this.displayPrice;
    }

    get isDiscounted() {
        return this.displayPrice < this.price;
    }
}
