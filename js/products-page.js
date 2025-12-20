/**
 * Logique de la page produits et commandes
 * Gère l'affichage des produits, le panier et la création de commandes
 */

// Éléments du DOM
const DOM = {
    username: document.getElementById('username'),
    cartCount: document.getElementById('cart-count'),
    logoutBtn: document.getElementById('logout-btn'),
    loadingZone: document.getElementById('loading-zone'),
    errorZone: document.getElementById('error-zone'),
    errorMessage: document.getElementById('error-message'),
    productsGrid: document.getElementById('products-grid'),
    cartEmpty: document.getElementById('cart-empty'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    cartActions: document.getElementById('cart-actions'),
    totalAmount: document.getElementById('total-amount'),
    createOrderBtn: document.getElementById('create-order-btn'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    orderModal: document.getElementById('order-modal'),
    orderNumber: document.getElementById('order-number'),
    closeModalBtn: document.getElementById('close-modal-btn')
};

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
        DOM.username.textContent = sessionInfo.userName || `User #${sessionInfo.userId}`;
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
    DOM.productsGrid.innerHTML = '';
}

/**
 * Masquer le chargement
 */
function hideLoading() {
    DOM.loadingZone.classList.add('hidden');
}

/**
 * Charger les produits
 */
async function loadProducts() {
    try {
        showLoading();
        hideError();

        const products = await odooAPI.getProducts(50);
        console.log(`📦 ${products.length} produits chargés`);

        displayProducts(products);
        hideLoading();

    } catch (error) {
        console.error('❌ Erreur chargement produits:', error);
        showError(`Erreur lors du chargement des produits: ${error.message}`);
        hideLoading();
    }
}

/**
 * Afficher les produits
 */
function displayProducts(products) {
    DOM.productsGrid.innerHTML = '';

    products.forEach(product => {
        const card = createProductCard(product);
        DOM.productsGrid.appendChild(card);
    });
}

/**
 * Créer une carte produit
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Image
    const img = document.createElement('img');
    if (product.image_128) {
        img.src = `data:image/png;base64,${product.image_128}`;
    } else {
        img.src = 'https://via.placeholder.com/250x180?text=Pas+d\'image';
    }
    img.alt = product.name;

    // Nom
    const name = document.createElement('h3');
    name.textContent = product.name;

    // Prix
    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = `${product.list_price.toFixed(2)} €`;

    // Stock
    const stock = document.createElement('div');
    stock.className = `product-stock ${product.qty_available > 0 ? 'in-stock' : 'out-of-stock'}`;
    stock.textContent = product.qty_available > 0
        ? `✅ En stock: ${product.qty_available}`
        : '❌ Rupture de stock';

    // Bouton ajouter au panier
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = '➕ Ajouter au panier';
    addBtn.disabled = product.qty_available <= 0;
    addBtn.onclick = () => addToCart(product);

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(price);
    card.appendChild(stock);
    card.appendChild(addBtn);

    return card;
}

/**
 * Ajouter un produit au panier
 */
function addToCart(product) {
    cart.addProduct(product, 1);
    updateCartDisplay();
    console.log(`✅ ${product.name} ajouté au panier`);
}

/**
 * Mettre à jour l'affichage du panier
 */
function updateCartDisplay() {
    const items = cart.getItems();
    const itemCount = cart.getItemCount();

    // Mettre à jour le badge
    DOM.cartCount.textContent = itemCount;

    if (items.length === 0) {
        // Panier vide
        DOM.cartEmpty.classList.remove('hidden');
        DOM.cartItems.classList.add('hidden');
        DOM.cartTotal.classList.add('hidden');
        DOM.cartActions.classList.add('hidden');
    } else {
        // Panier avec articles
        DOM.cartEmpty.classList.add('hidden');
        DOM.cartItems.classList.remove('hidden');
        DOM.cartTotal.classList.remove('hidden');
        DOM.cartActions.classList.remove('hidden');

        // Afficher les articles
        displayCartItems(items);

        // Afficher le total
        const total = cart.getTotal();
        DOM.totalAmount.textContent = `${total.toFixed(2)} €`;
    }
}

/**
 * Afficher les articles du panier
 */
function displayCartItems(items) {
    DOM.cartItems.innerHTML = '';

    items.forEach(item => {
        const itemElement = createCartItem(item);
        DOM.cartItems.appendChild(itemElement);
    });
}

/**
 * Créer un élément de panier
 */
function createCartItem(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';

    // Image
    const img = document.createElement('img');
    img.className = 'cart-item-image';
    if (item.product.image_128) {
        img.src = `data:image/png;base64,${item.product.image_128}`;
    } else {
        img.src = 'https://via.placeholder.com/60?text=?';
    }

    // Détails
    const details = document.createElement('div');
    details.className = 'cart-item-details';

    const name = document.createElement('div');
    name.className = 'cart-item-name';
    name.textContent = item.product.name;

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = `${item.product.list_price.toFixed(2)} € × ${item.quantity}`;

    // Contrôles de quantité
    const qtyControls = document.createElement('div');
    qtyControls.className = 'cart-item-quantity';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'qty-btn';
    minusBtn.textContent = '−';
    minusBtn.onclick = () => {
        cart.updateQuantity(item.product.id, item.quantity - 1);
        updateCartDisplay();
    };

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'qty-input';
    qtyInput.value = item.quantity;
    qtyInput.min = 1;
    qtyInput.onchange = (e) => {
        const newQty = parseInt(e.target.value) || 1;
        cart.updateQuantity(item.product.id, newQty);
        updateCartDisplay();
    };

    const plusBtn = document.createElement('button');
    plusBtn.className = 'qty-btn';
    plusBtn.textContent = '+';
    plusBtn.onclick = () => {
        cart.updateQuantity(item.product.id, item.quantity + 1);
        updateCartDisplay();
    };

    qtyControls.appendChild(minusBtn);
    qtyControls.appendChild(qtyInput);
    qtyControls.appendChild(plusBtn);

    details.appendChild(name);
    details.appendChild(price);
    details.appendChild(qtyControls);

    // Bouton supprimer
    const removeBtn = document.createElement('button');
    removeBtn.className = 'cart-item-remove';
    removeBtn.textContent = '🗑️';
    removeBtn.title = 'Supprimer';
    removeBtn.onclick = () => {
        cart.removeProduct(item.product.id);
        updateCartDisplay();
    };

    div.appendChild(img);
    div.appendChild(details);
    div.appendChild(removeBtn);

    return div;
}

/**
 * Créer une commande dans Odoo
 */
async function createOrder() {
    if (cart.isEmpty()) {
        alert('Le panier est vide !');
        return;
    }

    try {
        DOM.createOrderBtn.disabled = true;
        DOM.createOrderBtn.textContent = '⏳ Création en cours...';

        // Récupérer le premier partenaire (client) ou utiliser l'utilisateur connecté
        const sessionInfo = odooAuth.getSessionInfo();
        const partnerId = sessionInfo.userId; // Utiliser l'ID utilisateur comme partenaire

        // Obtenir les lignes de commande
        const orderLines = cart.getOrderLines();

        // Créer la commande
        const orderId = await odooAPI.createSaleOrder(partnerId, orderLines);

        // Récupérer les détails de la commande
        const order = await odooAPI.getSaleOrder(orderId);

        // Afficher la confirmation
        showOrderConfirmation(order);

        // Vider le panier
        cart.clear();
        updateCartDisplay();

    } catch (error) {
        console.error('❌ Erreur création commande:', error);
        alert(`Erreur lors de la création de la commande: ${error.message}`);
    } finally {
        DOM.createOrderBtn.disabled = false;
        DOM.createOrderBtn.textContent = '✅ Créer la Commande';
    }
}

/**
 * Afficher la confirmation de commande
 */
function showOrderConfirmation(order) {
    DOM.orderNumber.textContent = order.name || `#${order.id}`;
    DOM.orderModal.classList.remove('hidden');
}

/**
 * Fermer le modal
 */
function closeModal() {
    DOM.orderModal.classList.add('hidden');
}

/**
 * Déconnexion
 */
function logout() {
    odooAuth.logout();
    cart.clear();
    window.location.href = './login.html';
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', async function () {
    console.log('📦 Page produits chargée');

    // Vérifier l'authentification
    if (!checkAuthentication()) {
        return;
    }

    // Afficher les infos utilisateur
    displayUserInfo();

    // Charger le panier
    updateCartDisplay();

    // Charger les produits
    await loadProducts();

    // Événements
    DOM.createOrderBtn.addEventListener('click', createOrder);
    DOM.clearCartBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment vider le panier ?')) {
            cart.clear();
            updateCartDisplay();
        }
    });
    DOM.logoutBtn.addEventListener('click', logout);
    DOM.closeModalBtn.addEventListener('click', closeModal);
});
