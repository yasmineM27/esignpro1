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

async function createAdminUser() {
    console.log('👑 CRÉATION D\'UN UTILISATEUR ADMINISTRATEUR\n');
    
    try {
        // 1. Créer l'utilisateur admin
        console.log('📝 Création de l\'utilisateur admin...');
        const adminData = await makeRequest('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Admin',
                last_name: 'Principal',
                email: 'admin@esignpro.ch',
                phone: '+41 79 999 99 99',
                role: 'admin',
                password: 'admin123'
            })
        });
        
        if (adminData.success) {
            console.log('✅ Utilisateur admin créé avec succès');
            console.log(`   ID: ${adminData.user.id}`);
            console.log(`   Email: ${adminData.user.email}`);
            console.log(`   Nom: ${adminData.user.first_name} ${adminData.user.last_name}`);
            console.log(`   Rôle: ${adminData.user.role}`);
        } else {
            if (adminData.error && adminData.error.includes('already exists')) {
                console.log('ℹ️ Utilisateur admin existe déjà, mise à jour du mot de passe...');
                
                // Récupérer l'utilisateur existant
                const users = await makeRequest('http://localhost:3000/api/admin/users');
                const existingAdmin = users.users.find(u => u.email === 'admin@esignpro.ch');
                
                if (existingAdmin) {
                    // Mettre à jour le mot de passe
                    const updateResult = await makeRequest('http://localhost:3000/api/admin/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: existingAdmin.id,
                            new_password: 'admin123'
                        })
                    });
                    
                    if (updateResult.success) {
                        console.log('✅ Mot de passe admin mis à jour');
                    } else {
                        console.log('❌ Erreur mise à jour mot de passe:', updateResult.error);
                    }
                }
            } else {
                console.log('❌ Erreur création admin:', adminData.error);
                return;
            }
        }
        
        // 2. Tester la connexion admin
        console.log('\n🚪 Test de connexion admin...');
        const loginData = await makeRequest('http://localhost:3000/api/auth/user-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@esignpro.ch',
                password: 'admin123'
            })
        });
        
        if (loginData.success) {
            console.log('✅ Connexion admin réussie');
            console.log(`   Utilisateur: ${loginData.user.first_name} ${loginData.user.last_name}`);
            console.log(`   Rôle: ${loginData.user.role}`);
            console.log(`   Email: ${loginData.user.email}`);
        } else {
            console.log('❌ Connexion admin échouée:', loginData.error);
        }
        
        // 3. Résumé final
        console.log('\n🎉 CONFIGURATION TERMINÉE !');
        console.log('📋 Comptes disponibles :');
        console.log('   👑 ADMIN: admin@esignpro.ch / admin123 → /admin');
        console.log('   🔧 Agent Principal: waelha@gmail.com / temp466265 → /agent');
        console.log('   🔧 Agent Test: agent.test@esignpro.ch / test123 → /agent');
        console.log('   👤 Client: client.test@esignpro.ch / client123 → /client-dashboard');
        console.log('\n🌐 Testez sur: http://localhost:3000/login');
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
    }
}

createAdminUser();
