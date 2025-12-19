let sessionId = null;
let userId = null;

async function authenticate() {
    try {
        const url = document.getElementById('odoo-url').value;
        const database = document.getElementById('database').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const requestBody = {
            jsonrpc: "2.0",
            method: "call",
            params: {
                db: database,
                login: username,
                password: password
            },
            id: Math.floor(Math.random() * 1000000)
        };

        const response = await fetch(url + '/web/session/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.result && data.result.uid) {
            sessionId = data.result.session_id;
            userId = data.result.uid;
            console.log('Authentification réussie ! Session ID : ' + sessionId + ' User ID : ' + userId);
            return true;
        } else {
            throw new Error('Authentification échouée !');
        }

    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        alert('Erreur de connexion : ' + error.message);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loadButton = document.getElementById('load-products-btn');
    loadButton.addEventListener('click', async function () {
        console.log('Bouton cliqué !');
        const success = await authenticate();
        if (success) {
            alert('Connexion réussie !');
        }
    });
});