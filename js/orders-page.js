/**
 * Logique de la page de suivi des commandes
 * Affiche la liste des commandes et leurs détails
 */

// Éléments du DOM
const DOM = {
    username: document.getElementById('username'),
    logoutBtn: document.getElementById('logout-btn'),
    loadingZone: document.getElementById('loading-zone'),
    errorZone: document.getElementById('error-zone'),
    errorMessage: document.getElementById('error-message'),
    emptyState: document.getElementById('empty-state'),
    ordersList: document.getElementById('orders-list'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    modal: document.getElementById('order-details-modal'),
    modalOrderNumber: document.getElementById('modal-order-number'),
    modalPartner: document.getElementById('modal-partner'),
    modalDate: document.getElementById('modal-date'),
    modalStatus: document.getElementById('modal-status'),
    modalTotal: document.getElementById('modal-total'),
    modalLines: document.getElementById('modal-lines'),
    closeModalBtn: document.getElementById('close-modal-btn')
};

let allOrders = [];
let currentFilter = 'all';

/**
 * Vérifier l'authentification
 */
function checkAuthentication() {
    if (!odooAuth.loadSession() || !odooAuth.isAuthenticated()) {
        console.log('❌ Non authentifié, redirection vers login');
        window.location.href = './login.html';
        return false;
    }
    return true;
}

/**
 * Afficher les informations utilisateur
 */
function displayUserInfo() {
    const sessionInfo = odooAuth.getSessionInfo();
    if (sessionInfo) {
        DOM.username.textContent = `User #${sessionInfo.userId}`;
    }
}

/**
 * Afficher une erreur
 */
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorZone.classList.remove('hidden');
}

/**
 * Masquer l'erreur
 */
function hideError() {
    DOM.errorZone.classList.add('hidden');
}

/**
 * Afficher le chargement
 */
function showLoading() {
    DOM.loadingZone.classList.remove('hidden');
    DOM.ordersList.innerHTML = '';
    DOM.emptyState.classList.add('hidden');
}

/**
 * Masquer le chargement
 */
function hideLoading() {
    DOM.loadingZone.classList.add('hidden');
}

/**
 * Charger les commandes
 */
async function loadOrders() {
    try {
        showLoading();
        hideError();

        const orders = await odooAPI.getSaleOrders(null, 50);
        allOrders = orders;
        console.log(`📋 ${orders.length} commandes chargées`);

        displayOrders(orders);
        hideLoading();

    } catch (error) {
        console.error('❌ Erreur chargement commandes:', error);
        showError(`Erreur lors du chargement des commandes: ${error.message}`);
        hideLoading();
    }
}

/**
 * Afficher les commandes
 */
function displayOrders(orders) {
    DOM.ordersList.innerHTML = '';

    if (orders.length === 0) {
        DOM.emptyState.classList.remove('hidden');
        return;
    }

    DOM.emptyState.classList.add('hidden');

    orders.forEach(order => {
        const card = createOrderCard(order);
        DOM.ordersList.appendChild(card);
    });
}

/**
 * Créer une carte de commande
 */
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.onclick = () => showOrderDetails(order);

    // En-tête
    const header = document.createElement('div');
    header.className = 'order-header';

    const orderNumber = document.createElement('div');
    orderNumber.className = 'order-number';
    orderNumber.textContent = order.name || `Commande #${order.id}`;

    const status = document.createElement('span');
    status.className = `order-status status-${order.state}`;
    status.textContent = getStatusLabel(order.state);

    header.appendChild(orderNumber);
    header.appendChild(status);

    // Informations
    const info = document.createElement('div');
    info.className = 'order-info';

    const partnerItem = createInfoItem('Client', order.partner_id ? order.partner_id[1] : 'N/A');
    const dateItem = createInfoItem('Date', formatDate(order.date_order));
    const totalItem = createInfoItem('Total', `${order.amount_total.toFixed(2)} €`, 'order-total');

    info.appendChild(partnerItem);
    info.appendChild(dateItem);
    info.appendChild(totalItem);

    // Pied de page
    const footer = document.createElement('div');
    footer.className = 'order-footer';

    const date = document.createElement('div');
    date.className = 'order-date';
    date.textContent = `Créée le ${formatDate(order.date_order)}`;

    const actions = document.createElement('div');
    actions.className = 'order-actions';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-outline';
    viewBtn.textContent = 'Voir détails';
    viewBtn.onclick = (e) => {
        e.stopPropagation();
        showOrderDetails(order);
    };

    actions.appendChild(viewBtn);
    footer.appendChild(date);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(info);
    card.appendChild(footer);

    return card;
}

/**
 * Créer un élément d'information
 */
function createInfoItem(label, value, valueClass = '') {
    const item = document.createElement('div');
    item.className = 'order-info-item';

    const labelEl = document.createElement('span');
    labelEl.className = 'order-info-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = `order-info-value ${valueClass}`;
    valueEl.textContent = value;

    item.appendChild(labelEl);
    item.appendChild(valueEl);

    return item;
}

/**
 * Afficher les détails d'une commande
 */
async function showOrderDetails(order) {
    try {
        // Afficher les infos de base
        DOM.modalOrderNumber.textContent = order.name || `Commande #${order.id}`;
        DOM.modalPartner.textContent = order.partner_id ? order.partner_id[1] : 'N/A';
        DOM.modalDate.textContent = formatDate(order.date_order);
        DOM.modalStatus.textContent = getStatusLabel(order.state);
        DOM.modalTotal.textContent = `${order.amount_total.toFixed(2)} €`;

        // Charger les lignes de commande
        const lines = await odooAPI.getOrderLines(order.id);
        displayOrderLines(lines);

        // Afficher le modal
        DOM.modal.classList.remove('hidden');

    } catch (error) {
        console.error('❌ Erreur chargement détails:', error);
        alert(`Erreur lors du chargement des détails: ${error.message}`);
    }
}

/**
 * Afficher les lignes de commande
 */
function displayOrderLines(lines) {
    DOM.modalLines.innerHTML = '';

    if (lines.length === 0) {
        DOM.modalLines.innerHTML = '<p class="text-secondary">Aucune ligne de commande</p>';
        return;
    }

    lines.forEach(line => {
        const lineEl = document.createElement('div');
        lineEl.className = 'order-line';

        const product = document.createElement('div');
        product.className = 'line-product';
        product.textContent = line.name || line.product_id[1];

        const quantity = document.createElement('div');
        quantity.className = 'line-quantity';
        quantity.textContent = `Qté: ${line.product_uom_qty}`;

        const price = document.createElement('div');
        price.className = 'line-price';
        price.textContent = `${line.price_subtotal.toFixed(2)} €`;

        lineEl.appendChild(product);
        lineEl.appendChild(quantity);
        lineEl.appendChild(price);

        DOM.modalLines.appendChild(lineEl);
    });
}

/**
 * Fermer le modal
 */
function closeModal() {
    DOM.modal.classList.add('hidden');
}

/**
 * Filtrer les commandes
 */
function filterOrders(filter) {
    currentFilter = filter;

    // Mettre à jour les boutons
    DOM.filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Filtrer
    let filtered = allOrders;
    if (filter !== 'all') {
        filtered = allOrders.filter(order => order.state === filter);
    }

    displayOrders(filtered);
}

/**
 * Obtenir le libellé du statut
 */
function getStatusLabel(state) {
    const labels = {
        'draft': 'Brouillon',
        'sent': 'Envoyée',
        'sale': 'Confirmée',
        'done': 'Terminée',
        'cancel': 'Annulée'
    };
    return labels[state] || state;
}

/**
 * Formater une date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Déconnexion
 */
function logout() {
    odooAuth.logout();
    window.location.href = './login.html';
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', async function () {
    console.log('📋 Page commandes chargée');

    // Vérifier l'authentification
    if (!checkAuthentication()) {
        return;
    }

    // Afficher les infos utilisateur
    displayUserInfo();

    // Charger les commandes
    await loadOrders();

    // Événements
    DOM.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => filterOrders(btn.dataset.filter));
    });
    DOM.logoutBtn.addEventListener('click', logout);
    DOM.closeModalBtn.addEventListener('click', closeModal);
});
