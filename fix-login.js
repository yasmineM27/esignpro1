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

async function fixLogin() {
    console.log('🔧 Début de la correction du problème de connexion...\n');
    
    try {
        // Étape 1: Récupérer l'utilisateur
        console.log('🔍 Étape 1: Vérification de l\'utilisateur agent.test@esignpro.ch');
        const usersData = await makeRequest('http://localhost:3000/api/admin/users');
        
        if (!usersData.success) {
            throw new Error('Impossible de récupérer les utilisateurs');
        }
        
        const user = usersData.users.find(u => u.email === 'agent.test@esignpro.ch');
        if (!user) {
            throw new Error('Utilisateur agent.test@esignpro.ch non trouvé');
        }
        
        console.log(`✅ Utilisateur trouvé: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
        
        // Étape 2: Réinitialiser le mot de passe
        console.log('\n🔑 Étape 2: Réinitialisation du mot de passe à "test123"');
        const passwordData = await makeRequest('http://localhost:3000/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                new_password: 'test123'
            })
        });
        
        if (!passwordData.success) {
            throw new Error(`Erreur changement mot de passe: ${passwordData.error}`);
        }
        
        console.log('✅ Mot de passe réinitialisé avec succès');
        
        // Étape 3: Tester la connexion
        console.log('\n🚪 Étape 3: Test de connexion avec le nouveau mot de passe');
        
        // Test avec agent-login
        const agentLoginData = await makeRequest('http://localhost:3000/api/auth/agent-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'agent.test@esignpro.ch',
                password: 'test123'
            })
        });
        
        if (agentLoginData.success) {
            console.log('✅ Connexion agent-login réussie');
        } else {
            console.log(`⚠️ agent-login échoué: ${agentLoginData.error}`);
            
            // Test avec user-login
            console.log('🔄 Test avec user-login...');
            const userLoginData = await makeRequest('http://localhost:3000/api/auth/user-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'agent.test@esignpro.ch',
                    password: 'test123'
                })
            });
            
            if (userLoginData.success) {
                console.log('✅ Connexion user-login réussie');
            } else {
                throw new Error(`Toutes les connexions ont échoué: ${userLoginData.error}`);
            }
        }
        
        console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS !');
        console.log('📋 Résumé:');
        console.log('   ✅ Utilisateur: agent.test@esignpro.ch');
        console.log('   ✅ Mot de passe: test123');
        console.log('   ✅ Connexion: Fonctionnelle');
        console.log('\n🚀 Vous pouvez maintenant vous connecter sur http://localhost:3000/agent-login');
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.log('\n🔧 Suggestions:');
        console.log('   1. Vérifiez que le serveur Next.js fonctionne sur le port 3000');
        console.log('   2. Vérifiez la connexion à la base de données');
        console.log('   3. Utilisez l\'interface web: http://localhost:3000/auto-fix-login.html');
        process.exit(1);
    }
}

// Démarrer la correction
fixLogin();
