/**
 * Module de gestion du panier
 * Gère l'ajout, la modification et la suppression de produits
 */

class Cart {
    constructor() {
        this.items = [];
        this.loadFromStorage();
    }

    /**
     * Ajouter un produit au panier
     * @param {Object} product - Produit à ajouter
     * @param {number} quantity - Quantité
     */
    addProduct(product, quantity = 1) {
        const existingItem = this.items.find(item => item.product.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                product: product,
                quantity: quantity
            });
        }

        this.saveToStorage();
        console.log(`✅ Produit ajouté au panier: ${product.name} (x${quantity})`);
    }

    /**
     * Supprimer un produit du panier
     * @param {number} productId - ID du produit
     */
    removeProduct(productId) {
        const index = this.items.findIndex(item => item.product.id === productId);

        if (index !== -1) {
            const productName = this.items[index].product.name;
            this.items.splice(index, 1);
            this.saveToStorage();
            console.log(`🗑️ Produit retiré du panier: ${productName}`);
            return true;
        }
        return false;
    }

    /**
     * Mettre à jour la quantité d'un produit
     * @param {number} productId - ID du produit
     * @param {number} quantity - Nouvelle quantité
     */
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.product.id === productId);

        if (item) {
            if (quantity <= 0) {
                this.removeProduct(productId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                console.log(`📝 Quantité mise à jour: ${item.product.name} (x${quantity})`);
            }
            return true;
        }
        return false;
    }

    /**
     * Obtenir tous les articles du panier
     * @returns {Array}
     */
    getItems() {
        return this.items;
    }

    /**
     * Obtenir le nombre total d'articles
     * @returns {number}
     */
    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Calculer le total du panier
     * @returns {number}
     */
    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.product.list_price * item.quantity);
        }, 0);
    }

    /**
     * Vider le panier
     */
    clear() {
        this.items = [];
        this.saveToStorage();
        console.log('🧹 Panier vidé');
    }

    /**
     * Vérifier si le panier est vide
     * @returns {boolean}
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Sauvegarder le panier dans localStorage
     */
    saveToStorage() {
        localStorage.setItem('odoo_cart', JSON.stringify(this.items));
    }

    /**
     * Charger le panier depuis localStorage
     */
    loadFromStorage() {
        const cartData = localStorage.getItem('odoo_cart');
        if (cartData) {
            try {
                this.items = JSON.parse(cartData);
                console.log(`📦 Panier restauré: ${this.items.length} produit(s)`);
            } catch (error) {
                console.error('❌ Erreur lors du chargement du panier:', error);
                this.items = [];
            }
        }
    }

    /**
     * Obtenir les lignes de commande formatées pour Odoo
     * @returns {Array}
     */
    getOrderLines() {
        return this.items.map(item => ({
            product_id: item.product.id,
            product_uom_qty: item.quantity,
            price_unit: item.product.list_price,
            name: item.product.name
        }));
    }
}

// Exporter comme singleton
const cart = new Cart();
