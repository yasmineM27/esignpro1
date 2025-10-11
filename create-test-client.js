const http = require('http');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (e) {
                    resolve({ success: false, error: 'Invalid JSON response' });
                }
            });
        });

        req.on('error', (err) => reject(err));
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function createTestClient() {
    console.log('🔧 Création d\'un utilisateur client de test...\n');
    
    try {
        // Créer l'utilisateur client
        console.log('👤 Création de l\'utilisateur client.test@esignpro.ch');
        const userData = await makeRequest('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Client',
                last_name: 'Test',
                email: 'client.test@esignpro.ch',
                phone: '+41 79 123 45 67',
                role: 'client',
                password: 'client123'
            })
        });
        
        if (userData.success) {
            console.log('✅ Utilisateur client créé avec succès');
            console.log(`   ID: ${userData.user.id}`);
            console.log(`   Email: ${userData.user.email}`);
            console.log(`   Nom: ${userData.user.first_name} ${userData.user.last_name}`);
        } else {
            if (userData.error && userData.error.includes('already exists')) {
                console.log('ℹ️ Utilisateur client existe déjà');
            } else {
                console.log('⚠️ Erreur création utilisateur:', userData.error);
            }
        }
        
        // Tester la connexion
        console.log('\n🚪 Test de connexion du client...');
        const loginData = await makeRequest('http://localhost:3000/api/auth/user-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'client.test@esignpro.ch',
                password: 'client123'
            })
        });
        
        if (loginData.success) {
            console.log('✅ Connexion client réussie');
            console.log(`   Utilisateur: ${loginData.user.first_name} ${loginData.user.last_name}`);
            console.log(`   Rôle: ${loginData.user.role}`);
        } else {
            console.log('❌ Connexion client échouée:', loginData.error);
        }
        
        console.log('\n🎉 Configuration terminée !');
        console.log('📋 Comptes de test disponibles :');
        console.log('   👑 Admin: waelha@gmail.com / temp466265');
        console.log('   🔧 Agent: agent.test@esignpro.ch / test123');
        console.log('   👤 Client: client.test@esignpro.ch / client123');
        console.log('\n🌐 Testez sur: http://localhost:3000/login');
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
    }
}

createTestClient();
