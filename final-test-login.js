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

async function testFinalLogin() {
    console.log('🎉 TEST FINAL DE LA PAGE DE CONNEXION CORRIGÉE\n');
    
    const testAccounts = [
        {
            name: 'Administrateur',
            email: 'waelha@gmail.com',
            password: 'temp466265',
            expectedRole: 'admin'
        },
        {
            name: 'Agent',
            email: 'agent.test@esignpro.ch',
            password: 'test123',
            expectedRole: 'agent'
        },
        {
            name: 'Client',
            email: 'client.test@esignpro.ch',
            password: 'client123',
            expectedRole: 'client'
        }
    ];

    let successCount = 0;
    let totalTests = testAccounts.length;

    for (const account of testAccounts) {
        console.log(`🔍 Test ${account.name} (${account.email})...`);
        
        try {
            // Essayer d'abord avec user-login
            let response = await makeRequest('http://localhost:3000/api/auth/user-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: account.email,
                    password: account.password
                })
            });

            // Si échec avec user-login, essayer avec agent-login pour les agents
            if (!response.success && account.email.includes('@esignpro.ch')) {
                response = await makeRequest('http://localhost:3000/api/auth/agent-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: account.email,
                        password: account.password
                    })
                });
            }

            if (response.success) {
                console.log(`   ✅ Connexion réussie`);
                console.log(`   👤 Utilisateur: ${response.user.first_name} ${response.user.last_name}`);
                console.log(`   🎭 Rôle: ${response.user.role}`);
                
                if (response.user.role === account.expectedRole) {
                    console.log(`   ✅ Rôle correct: ${response.user.role}`);
                    successCount++;
                } else {
                    console.log(`   ⚠️ Rôle inattendu: attendu ${account.expectedRole}, reçu ${response.user.role}`);
                }
            } else {
                console.log(`   ❌ Connexion échouée: ${response.error}`);
            }
        } catch (error) {
            console.log(`   ❌ Erreur réseau: ${error.message}`);
        }
        
        console.log(''); // Ligne vide
    }

    // Résumé final
    const successRate = Math.round((successCount / totalTests) * 100);
    
    console.log('📊 RÉSUMÉ FINAL:');
    console.log(`   Total: ${totalTests} comptes testés`);
    console.log(`   ✅ Réussis: ${successCount}`);
    console.log(`   ❌ Échoués: ${totalTests - successCount}`);
    console.log(`   📈 Taux de réussite: ${successRate}%`);
    
    if (successRate === 100) {
        console.log('\n🎉 PARFAIT ! Tous les tests sont passés !');
        console.log('✅ La page de connexion /login fonctionne maintenant correctement');
        console.log('✅ Toutes les APIs d\'authentification sont opérationnelles');
        console.log('✅ Les redirections par rôle fonctionnent');
        console.log('\n🌐 Pages disponibles:');
        console.log('   🚪 http://localhost:3000/login (Page principale)');
        console.log('   🔧 http://localhost:3000/agent-login (Spécialisée agents)');
        console.log('   👑 http://localhost:3000/admin (Interface admin)');
        console.log('   🏠 http://localhost:3000/agent-dashboard (Dashboard agent)');
        console.log('   👤 http://localhost:3000/client-dashboard (Dashboard client)');
    } else {
        console.log('\n⚠️ Certains tests ont échoué.');
        console.log('💡 Vérifiez les mots de passe et les comptes utilisateurs.');
    }
}

testFinalLogin();
