/**
 * Logique de la page de connexion
 * Gère l'authentification et la redirection
 */

// Éléments du DOM
const loginForm = document.getElementById('login-form');
const errorZone = document.getElementById('error-zone');
const errorMessage = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');
const loginBtnText = document.getElementById('login-btn-text');
const loginSpinner = document.getElementById('login-spinner');

/**
 * Vérifier si l'utilisateur est déjà connecté
 */
function checkExistingSession() {
    if (odooAuth.loadSession() && odooAuth.isAuthenticated()) {
        console.log('✅ Session existante détectée, redirection...');
        redirectToProducts();
    }
}

/**
 * Afficher un message d'erreur
 */
function showError(message) {
    errorMessage.textContent = message;
    errorZone.classList.remove('hidden');
}

/**
 * Masquer le message d'erreur
 */
function hideError() {
    errorZone.classList.add('hidden');
}

/**
 * Activer l'état de chargement
 */
function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtnText.classList.add('hidden');
        loginSpinner.classList.remove('hidden');
    } else {
        loginBtn.disabled = false;
        loginBtnText.classList.remove('hidden');
        loginSpinner.classList.add('hidden');
    }
}

/**
 * Rediriger vers la page produits
 */
function redirectToProducts() {
    window.location.href = './products.html';
}

/**
 * Gérer la soumission du formulaire
 */
async function handleLogin(event) {
    event.preventDefault();
    hideError();
    setLoading(true);

    // Récupérer les valeurs du formulaire
    const url = document.getElementById('odoo-url').value.trim();
    const database = document.getElementById('database').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Validation basique
    if (!url || !database || !username || !password) {
        showError('Veuillez remplir tous les champs');
        setLoading(false);
        return;
    }

    try {
        // Tentative d'authentification
        const result = await odooAuth.authenticate(url, database, username, password);

        if (result.success) {
            console.log('✅ Connexion réussie !');
            // Petite pause pour l'UX
            setTimeout(() => {
                redirectToProducts();
            }, 500);
        } else {
            showError(result.message || 'Échec de la connexion. Vérifiez vos identifiants.');
            setLoading(false);
        }
    } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        showError('Une erreur est survenue. Veuillez réessayer.');
        setLoading(false);
    }
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔐 Page de connexion chargée');

    // Vérifier si déjà connecté
    checkExistingSession();

    // Attacher l'événement de soumission
    loginForm.addEventListener('submit', handleLogin);
});
