/**
 * Odoo API Client
 * Generic wrapper for Odoo JSON-RPC API calls
 * Requires: auth.js
 */

class OdooAPI {
    constructor(authInstance) {
        this.auth = authInstance;
    }

    /**
     * Make a generic JSON-RPC call to Odoo
     * @param {string} endpoint - API endpoint (e.g., '/web/dataset/call_kw')
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} API response
     */
    async call(endpoint, params) {
        if (!this.auth.isAuthenticated()) {
            throw new Error('Not authenticated. Please login first.');
        }

        const sessionInfo = this.auth.getSessionInfo();
        const requestBody = {
            jsonrpc: "2.0",
            method: "call",
            params: params,
            id: Math.floor(Math.random() * 1000000)
        };

        try {
            const response = await fetch(`${sessionInfo.serverUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.data?.message || 'API call failed');
            }

            return data.result;
        } catch (error) {
            console.error('❌ API call error:', error);
            throw error;
        }
    }

    /**
     * Search and read records from Odoo
     * @param {string} model - Odoo model name (e.g., 'product.product')
     * @param {Array} domain - Search domain
     * @param {Array} fields - Fields to retrieve
     * @param {number} limit - Maximum number of records
     * @returns {Promise<Array>} Array of records
     */
    async searchRead(model, domain = [], fields = [], limit = 80) {
        const sessionInfo = this.auth.getSessionInfo();

        const params = {
            model: model,
            method: 'search_read',
            args: [domain],
            kwargs: {
                fields: fields,
                limit: limit,
                context: { lang: 'en_US' }
            }
        };

        return await this.call('/web/dataset/call_kw', params);
    }

    /**
     * Get products from Odoo
     * @param {number} limit - Maximum number of products
     * @returns {Promise<Array>} Array of product records
     */
    async getProducts(limit = 80) {
        const fields = [
            'name',
            'list_price',
            'standard_price',
            'qty_available',
            'categ_id',
            'default_code',
            'barcode',
            'image_128'
        ];

        return await this.searchRead('product.product', [], fields, limit);
    }

    /**
     * Create a new record
     * @param {string} model - Odoo model name
     * @param {Object} values - Field values for the new record
     * @returns {Promise<number>} ID of created record
     */
    async create(model, values) {
        const params = {
            model: model,
            method: 'create',
            args: [values],
            kwargs: {}
        };

        return await this.call('/web/dataset/call_kw', params);
    }

    /**
     * Update existing record(s)
     * @param {string} model - Odoo model name
     * @param {Array} ids - Record IDs to update
     * @param {Object} values - Field values to update
     * @returns {Promise<boolean>} Success status
     */
    async write(model, ids, values) {
        const params = {
            model: model,
            method: 'write',
            args: [ids, values],
            kwargs: {}
        };

        return await this.call('/web/dataset/call_kw', params);
    }

    /**
     * Delete record(s)
     * @param {string} model - Odoo model name
     * @param {Array} ids - Record IDs to delete
     * @returns {Promise<boolean>} Success status
     */
    async unlink(model, ids) {
        const params = {
            model: model,
            method: 'unlink',
            args: [ids],
            kwargs: {}
        };

        return await this.call('/web/dataset/call_kw', params);
    }

    /**
     * Rechercher des partenaires (clients)
     * @param {string} searchTerm - Terme de recherche
     * @param {number} limit - Nombre maximum de résultats
     * @returns {Promise<Array>} Liste de partenaires
     */
    async getPartners(searchTerm = '', limit = 10) {
        const domain = searchTerm ? [['name', 'ilike', searchTerm]] : [];
        const fields = ['name', 'email', 'phone'];

        return await this.searchRead('res.partner', domain, fields, limit);
    }

    /**
     * Créer une commande de vente dans Odoo
     * @param {number} partnerId - ID du client
     * @param {Array} orderLines - Lignes de commande
     * @returns {Promise<number>} ID de la commande créée
     */
    async createSaleOrder(partnerId, orderLines) {
        // Formater les lignes de commande pour Odoo
        const formattedLines = orderLines.map(line => [0, 0, {
            product_id: line.product_id,
            product_uom_qty: line.product_uom_qty,
            price_unit: line.price_unit,
            name: line.name || `Produit ${line.product_id}`
        }]);

        const orderData = {
            partner_id: partnerId,
            order_line: formattedLines,
            state: 'draft'
        };

        const orderId = await this.create('sale.order', orderData);
        console.log(`✅ Commande créée avec succès: ID ${orderId}`);
        return orderId;
    }

    /**
     * Confirmer une commande de vente
     * @param {number} orderId - ID de la commande
     * @returns {Promise<boolean>}
     */
    async confirmSaleOrder(orderId) {
        const params = {
            model: 'sale.order',
            method: 'action_confirm',
            args: [[orderId]],
            kwargs: {}
        };

        const result = await this.call('/web/dataset/call_kw', params);
        console.log(`✅ Commande ${orderId} confirmée`);
        return result;
    }

    /**
     * Obtenir les détails d'une commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<Object>}
     */
    async getSaleOrder(orderId) {
        const fields = ['name', 'partner_id', 'amount_total', 'state', 'date_order'];
        const orders = await this.searchRead('sale.order', [['id', '=', orderId]], fields, 1);
        return orders.length > 0 ? orders[0] : null;
    }

    /**
     * Obtenir la liste des commandes
     * @param {string} stateFilter - Filtre par état (optionnel)
     * @param {number} limit - Nombre maximum de commandes
     * @returns {Promise<Array>}
     */
    async getSaleOrders(stateFilter = null, limit = 50) {
        const fields = [
            'name',
            'partner_id',
            'amount_total',
            'state',
            'date_order',
            'order_line',
            'user_id'
        ];

        let domain = [];
        if (stateFilter) {
            domain.push(['state', '=', stateFilter]);
        }

        const orders = await this.searchRead('sale.order', domain, fields, limit);
        return orders;
    }

    /**
     * Obtenir les lignes de commande
     * @param {number} orderId - ID de la commande
     * @returns {Promise<Array>}
     */
    async getOrderLines(orderId) {
        const fields = ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'];
        const lines = await this.searchRead('sale.order.line', [['order_id', '=', orderId]], fields, 100);
        return lines;
    }
}

// Export as singleton using the global auth instance
const odooAPI = new OdooAPI(odooAuth);
