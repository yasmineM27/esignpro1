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

async function promoteToAdmin() {
    console.log('👑 PROMOTION EN ADMINISTRATEUR\n');
    
    try {
        // 1. Récupérer l'utilisateur waelha
        console.log('🔍 Recherche de l\'utilisateur waelha@gmail.com...');
        const users = await makeRequest('http://localhost:3000/api/admin/users');
        const user = users.users.find(u => u.email === 'waelha@gmail.com');
        
        if (!user) {
            console.log('❌ Utilisateur waelha@gmail.com non trouvé');
            return;
        }
        
        console.log('✅ Utilisateur trouvé:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Nom: ${user.first_name} ${user.last_name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Rôle actuel: ${user.role}`);
        
        // 2. Changer le mot de passe d'abord
        console.log('\n🔑 Changement du mot de passe...');
        const passwordResult = await makeRequest('http://localhost:3000/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                new_password: 'admin123'
            })
        });
        
        if (passwordResult.success) {
            console.log('✅ Mot de passe changé avec succès');
        } else {
            console.log('❌ Erreur changement mot de passe:', passwordResult.error);
        }
        
        // 3. Promouvoir en admin si ce n'est pas déjà fait
        if (user.role !== 'admin') {
            console.log('\n🚀 Promotion en administrateur...');
            const updateResult = await makeRequest(`http://localhost:3000/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: 'admin'
                })
            });
            
            if (updateResult.success) {
                console.log('✅ Utilisateur promu administrateur avec succès');
            } else {
                console.log('❌ Erreur promotion:', updateResult.error);
            }
        } else {
            console.log('ℹ️ Utilisateur déjà administrateur');
        }
        
        // 4. Test de connexion
        console.log('\n🚪 Test de connexion administrateur...');
        const loginResult = await makeRequest('http://localhost:3000/api/auth/user-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'waelha@gmail.com',
                password: 'admin123'
            })
        });
        
        if (loginResult.success) {
            console.log('✅ Connexion administrateur réussie !');
            console.log(`   Utilisateur: ${loginResult.user.first_name} ${loginResult.user.last_name}`);
            console.log(`   Rôle: ${loginResult.user.role}`);
            console.log(`   Email: ${loginResult.user.email}`);
        } else {
            console.log('❌ Connexion échouée:', loginResult.error);
        }
        
        // 5. Résumé final
        console.log('\n🎉 CONFIGURATION TERMINÉE !');
        console.log('📋 Comptes de connexion :');
        console.log('   👑 ADMIN: waelha@gmail.com / admin123 → /admin');
        console.log('   🔧 Agent: agent.test@esignpro.ch / test123 → /agent');
        console.log('   👤 Client: client.test@esignpro.ch / client123 → /client-dashboard');
        console.log('\n🌐 Testez la connexion admin sur: http://localhost:3000/login');
        console.log('🎯 Après connexion, vous serez redirigé vers: http://localhost:3000/admin');
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
    }
}

promoteToAdmin();
