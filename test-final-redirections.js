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

async function testFinalRedirections() {
    console.log('🎯 TEST FINAL DES CONNEXIONS ET REDIRECTIONS\n');
    
    const testAccounts = [
        {
            name: 'ADMINISTRATEUR',
            email: 'waelha@gmail.com',
            password: 'admin123',
            expectedRole: 'admin',
            expectedRedirect: '/admin',
            icon: '👑'
        },
        {
            name: 'AGENT',
            email: 'agent.test@esignpro.ch',
            password: 'test123',
            expectedRole: 'agent',
            expectedRedirect: '/agent',
            icon: '🔧'
        },
        {
            name: 'CLIENT',
            email: 'client.test@esignpro.ch',
            password: 'client123',
            expectedRole: 'client',
            expectedRedirect: '/client-dashboard',
            icon: '👤'
        }
    ];

    let successCount = 0;
    let totalTests = testAccounts.length;

    console.log('📋 COMPTES À TESTER:');
    testAccounts.forEach(account => {
        console.log(`   ${account.icon} ${account.name}: ${account.email} → ${account.expectedRedirect}`);
    });
    console.log('');

    for (const account of testAccounts) {
        console.log(`${account.icon} TEST ${account.name}:`);
        console.log(`   📧 Email: ${account.email}`);
        console.log(`   🔑 Mot de passe: ${account.password}`);
        
        try {
            // Test de connexion avec l'API user-login
            const response = await makeRequest('http://localhost:3000/api/auth/user-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: account.email,
                    password: account.password
                })
            });

            if (response.success) {
                console.log(`   ✅ Connexion réussie`);
                console.log(`   👤 Utilisateur: ${response.user.first_name} ${response.user.last_name}`);
                console.log(`   🎭 Rôle: ${response.user.role}`);
                
                // Vérifier le rôle
                if (response.user.role === account.expectedRole) {
                    console.log(`   ✅ Rôle correct: ${response.user.role}`);
                    console.log(`   🎯 Redirection attendue: ${account.expectedRedirect}`);
                    successCount++;
                } else {
                    console.log(`   ❌ Rôle incorrect: attendu ${account.expectedRole}, reçu ${response.user.role}`);
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
    
    console.log('🏆 RÉSUMÉ FINAL:');
    console.log(`   📊 Total: ${totalTests} comptes testés`);
    console.log(`   ✅ Réussis: ${successCount}`);
    console.log(`   ❌ Échoués: ${totalTests - successCount}`);
    console.log(`   📈 Taux de réussite: ${successRate}%`);
    
    if (successRate === 100) {
        console.log('\n🎉 PARFAIT ! TOUS LES TESTS SONT PASSÉS !');
        console.log('');
        console.log('✅ CONFIGURATION FINALE:');
        console.log('   👑 Admin: waelha@gmail.com / admin123 → /admin');
        console.log('   🔧 Agent: agent.test@esignpro.ch / test123 → /agent');
        console.log('   👤 Client: client.test@esignpro.ch / client123 → /client-dashboard');
        console.log('');
        console.log('🌐 PAGES DE CONNEXION:');
        console.log('   🚪 http://localhost:3000/login (Page principale)');
        console.log('   🔧 http://localhost:3000/agent-login (Spécialisée agents/admin)');
        console.log('');
        console.log('🎯 PAGES DE DESTINATION:');
        console.log('   👑 http://localhost:3000/admin (Interface administrateur)');
        console.log('   🔧 http://localhost:3000/agent (Espace agent)');
        console.log('   👤 http://localhost:3000/client-dashboard (Espace client)');
        console.log('');
        console.log('🚀 TOUT EST PRÊT ! Testez maintenant sur http://localhost:3000/login');
    } else {
        console.log('\n⚠️ Certains tests ont échoué.');
        console.log('💡 Vérifiez les mots de passe et les rôles des utilisateurs.');
    }
}

testFinalRedirections();
