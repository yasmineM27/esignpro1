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
                    resolve({ success: false, error: 'Invalid JSON response', rawData: data });
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

async function testDocumentSystemSimple() {
    console.log('📄 TEST SIMPLIFIÉ DU SYSTÈME DE DOCUMENTS\n');
    
    try {
        // Test 1: Générer feuille d'information OPSIO (sans client_id spécifique)
        console.log('📋 Test 1: Génération Feuille d\'information OPSIO...');
        
        const opsioData = {
            clientName: 'Jean Dupont',
            clientAddress: 'Rue de la Paix 123',
            clientPostalCity: '1200 Genève',
            clientBirthdate: '1980-05-15',
            clientEmail: 'jean.dupont@email.com',
            clientPhone: '+41 79 123 45 67',
            advisorName: 'Marie Martin',
            advisorEmail: 'marie.martin@opsio.ch',
            advisorPhone: '+41 78 305 12 77',
            paymentMethod: 'commission'
        };
        
        const opsioResponse = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'opsio-info-sheet',
                data: opsioData
            })
        });
        
        console.log('Réponse OPSIO:', opsioResponse);
        
        if (opsioResponse.success) {
            console.log('   ✅ Feuille OPSIO générée avec succès');
            console.log(`   📄 ID: ${opsioResponse.document.id}`);
            console.log(`   📝 Titre: ${opsioResponse.document.title}`);
            
            // Test signature automatique - Client
            console.log('   ✍️ Test signature client...');
            const clientSignResponse = await makeRequest('http://localhost:3000/api/documents/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: opsioResponse.document.id,
                    signerName: 'Jean Dupont',
                    signerRole: 'client',
                    signatureType: 'electronic'
                })
            });
            
            console.log('Réponse signature client:', clientSignResponse);
            
            if (clientSignResponse.success) {
                console.log('   ✅ Signature client réussie');
            } else {
                console.log('   ❌ Erreur signature client:', clientSignResponse.error);
            }
            
        } else {
            console.log('   ❌ Erreur génération OPSIO:', opsioResponse.error);
            if (opsioResponse.rawData) {
                console.log('   📄 Données brutes:', opsioResponse.rawData.substring(0, 500));
            }
        }
        
        console.log('');
        
        // Test 2: Générer lettre de résiliation
        console.log('📋 Test 2: Génération Lettre de résiliation...');
        
        const resignationData = {
            clientName: 'Jean Dupont',
            clientAddress: 'Rue de la Paix 123',
            clientPostalCity: '1200 Genève',
            clientBirthdate: '1980-05-15',
            clientEmail: 'jean.dupont@email.com',
            clientPhone: '+41 79 123 45 67',
            insuranceCompany: 'Helsana Assurances SA',
            companyAddress: 'Audenstrasse 2',
            companyPostalCity: '8021 Zurich',
            lamalTerminationDate: '2024-12-31',
            lcaTerminationDate: '2024-11-30',
            persons: [
                {
                    name: 'Jean Dupont',
                    birthdate: '1980-05-15',
                    policyNumber: '123456789',
                    isAdult: true
                },
                {
                    name: 'Marie Dupont',
                    birthdate: '1985-08-22',
                    policyNumber: '123456790',
                    isAdult: true
                }
            ]
        };
        
        const resignationResponse = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'resignation-letter',
                data: resignationData
            })
        });
        
        console.log('Réponse résiliation:', resignationResponse);
        
        if (resignationResponse.success) {
            console.log('   ✅ Lettre de résiliation générée avec succès');
            console.log(`   📄 ID: ${resignationResponse.document.id}`);
            console.log(`   📝 Titre: ${resignationResponse.document.title}`);
            
            // Test signature automatique - Client
            console.log('   ✍️ Test signature client...');
            const clientSignResponse = await makeRequest('http://localhost:3000/api/documents/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: resignationResponse.document.id,
                    signerName: 'Jean Dupont',
                    signerRole: 'client',
                    signatureType: 'electronic'
                })
            });
            
            console.log('Réponse signature client:', clientSignResponse);
            
            if (clientSignResponse.success) {
                console.log('   ✅ Signature client réussie');
            } else {
                console.log('   ❌ Erreur signature client:', clientSignResponse.error);
            }
            
        } else {
            console.log('   ❌ Erreur génération résiliation:', resignationResponse.error);
            if (resignationResponse.rawData) {
                console.log('   📄 Données brutes:', resignationResponse.rawData.substring(0, 500));
            }
        }
        
        console.log('');
        console.log('🎉 TEST TERMINÉ !');
        console.log('🌐 Interface disponible sur: http://localhost:3000/agent');
        console.log('📂 Onglet "Documents" pour tester l\'interface graphique');
        
    } catch (error) {
        console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
    }
}

testDocumentSystemSimple();
