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

async function createTestClientForDocs() {
    console.log('👤 CRÉATION CLIENT DE TEST POUR DOCUMENTS\n');
    
    try {
        // 1. Créer l'utilisateur
        console.log('📝 Création de l\'utilisateur...');
        const userData = await makeRequest('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Jean',
                last_name: 'Dupont',
                email: 'jean.dupont.docs.' + Date.now() + '@esignpro.ch',
                phone: '+41 79 123 45 67',
                role: 'client',
                password: 'client123'
            })
        });
        
        if (userData.success) {
            console.log('✅ Utilisateur créé:', userData.user.id);
            
            // 2. Créer le client associé
            console.log('👤 Création du profil client...');
            const clientData = await makeRequest('http://localhost:3000/api/admin/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userData.user.id,
                    client_code: 'DOC_TEST_' + Date.now(),
                    date_of_birth: '1980-05-15',
                    address: 'Rue de la Paix 123',
                    city: 'Genève',
                    postal_code: '1200',
                    country: 'Suisse'
                })
            });
            
            if (clientData.success) {
                console.log('✅ Client créé:', clientData.client.id);
                
                // 3. Créer un dossier d'assurance
                console.log('📋 Création du dossier d\'assurance...');
                const caseData = await makeRequest('http://localhost:3000/api/admin/cases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: clientData.client.id,
                        agent_id: null, // Sera assigné plus tard
                        case_number: 'DOC_CASE_' + Date.now(),
                        insurance_company: 'Helsana Assurances SA',
                        policy_number: 'POL123456789',
                        policy_type: 'Assurance maladie',
                        termination_date: '2024-12-31',
                        reason_for_termination: 'Changement d\'assureur',
                        status: 'draft'
                    })
                });
                
                if (caseData.success) {
                    console.log('✅ Dossier créé:', caseData.case.id);
                    
                    console.log('\n🎉 CONFIGURATION TERMINÉE !');
                    console.log('📋 Données de test créées :');
                    console.log(`   👤 Utilisateur ID: ${userData.user.id}`);
                    console.log(`   🏠 Client ID: ${clientData.client.id}`);
                    console.log(`   📋 Dossier ID: ${caseData.case.id}`);
                    console.log(`   📧 Email: jean.dupont.docs@esignpro.ch`);
                    console.log(`   🔑 Mot de passe: client123`);
                    
                    return {
                        userId: userData.user.id,
                        clientId: clientData.client.id,
                        caseId: caseData.case.id
                    };
                } else {
                    console.log('❌ Erreur création dossier:', caseData.error);
                }
            } else {
                console.log('❌ Erreur création client:', clientData.error);
            }
        } else {
            if (userData.error && userData.error.includes('already exists')) {
                console.log('ℹ️ Utilisateur existe déjà, récupération...');
                
                // Récupérer l'utilisateur existant
                const users = await makeRequest('http://localhost:3000/api/admin/users');
                const existingUser = users.users.find(u => u.email === 'jean.dupont.docs@esignpro.ch');
                
                if (existingUser) {
                    console.log('✅ Utilisateur trouvé:', existingUser.id);
                    
                    // Chercher le client associé
                    const clients = await makeRequest('http://localhost:3000/api/admin/clients');
                    const existingClient = clients.clients?.find(c => c.user_id === existingUser.id);
                    
                    if (existingClient) {
                        console.log('✅ Client trouvé:', existingClient.id);
                        
                        return {
                            userId: existingUser.id,
                            clientId: existingClient.id,
                            caseId: 'existing-case-id' // À adapter selon vos besoins
                        };
                    }
                }
            } else {
                console.log('❌ Erreur création utilisateur:', userData.error);
            }
        }
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
    }
}

// Exporter la fonction pour utilisation dans d'autres scripts
if (require.main === module) {
    createTestClientForDocs();
} else {
    module.exports = createTestClientForDocs;
}
