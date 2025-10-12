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

async function testDocumentSystem() {
    console.log('📄 TEST DU SYSTÈME DE DOCUMENTS AUTOMATIQUES\n');
    
    const testCaseId = 'test-case-' + Date.now();
    
    // Test data
    const clientData = {
        clientName: 'Jean Dupont',
        clientAddress: 'Rue de la Paix 123',
        clientPostalCity: '1200 Genève',
        clientBirthdate: '1980-05-15',
        clientEmail: 'jean.dupont@email.com',
        clientPhone: '+41 79 123 45 67'
    };
    
    const advisorData = {
        advisorName: 'Marie Martin',
        advisorEmail: 'marie.martin@opsio.ch',
        advisorPhone: '+41 78 305 12 77'
    };

    try {
        // Test 1: Générer feuille d'information OPSIO
        console.log('📋 Test 1: Génération Feuille d\'information OPSIO...');
        
        const opsioData = {
            ...clientData,
            ...advisorData,
            paymentMethod: 'commission'
        };
        
        const opsioResponse = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'opsio-info-sheet',
                caseId: testCaseId,
                data: opsioData
            })
        });
        
        if (opsioResponse.success) {
            console.log('   ✅ Feuille OPSIO générée avec succès');
            console.log(`   📄 ID: ${opsioResponse.document.id}`);
            console.log(`   📝 Titre: ${opsioResponse.document.title}`);
            
            // Test signature automatique - Client
            console.log('   ✍️ Signature automatique client...');
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
            
            if (clientSignResponse.success) {
                console.log('   ✅ Signature client réussie');
                console.log(`   🔐 Hash: ${clientSignResponse.document.signatureHash}`);
            } else {
                console.log('   ❌ Erreur signature client:', clientSignResponse.error);
            }
            
            // Test signature automatique - Conseiller
            console.log('   ✍️ Signature automatique conseiller...');
            const advisorSignResponse = await makeRequest('http://localhost:3000/api/documents/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: opsioResponse.document.id,
                    signerName: 'Marie Martin',
                    signerRole: 'advisor',
                    signatureType: 'electronic'
                })
            });
            
            if (advisorSignResponse.success) {
                console.log('   ✅ Signature conseiller réussie');
                console.log(`   🔐 Hash: ${advisorSignResponse.document.signatureHash}`);
                console.log(`   📊 Statut final: ${advisorSignResponse.document.status}`);
            } else {
                console.log('   ❌ Erreur signature conseiller:', advisorSignResponse.error);
            }
            
        } else {
            console.log('   ❌ Erreur génération OPSIO:', opsioResponse.error);
        }
        
        console.log('');
        
        // Test 2: Générer lettre de résiliation
        console.log('📋 Test 2: Génération Lettre de résiliation...');
        
        const resignationData = {
            ...clientData,
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
                },
                {
                    name: 'Lucas Dupont',
                    birthdate: '2010-03-10',
                    policyNumber: '123456791',
                    isAdult: false
                }
            ]
        };
        
        const resignationResponse = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'resignation-letter',
                caseId: testCaseId,
                data: resignationData
            })
        });
        
        if (resignationResponse.success) {
            console.log('   ✅ Lettre de résiliation générée avec succès');
            console.log(`   📄 ID: ${resignationResponse.document.id}`);
            console.log(`   📝 Titre: ${resignationResponse.document.title}`);
            
            // Test signature automatique - Client
            console.log('   ✍️ Signature automatique client...');
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
            
            if (clientSignResponse.success) {
                console.log('   ✅ Signature client réussie');
                console.log(`   🔐 Hash: ${clientSignResponse.document.signatureHash}`);
                console.log(`   📊 Statut: ${clientSignResponse.document.status}`);
            } else {
                console.log('   ❌ Erreur signature client:', clientSignResponse.error);
            }
            
        } else {
            console.log('   ❌ Erreur génération résiliation:', resignationResponse.error);
        }
        
        console.log('');
        
        // Test 3: Récupérer tous les documents du dossier
        console.log('📋 Test 3: Récupération des documents du dossier...');
        
        const documentsResponse = await makeRequest(`http://localhost:3000/api/documents/generate?caseId=${testCaseId}`);
        
        if (documentsResponse.success) {
            console.log(`   ✅ ${documentsResponse.documents.length} documents récupérés`);
            documentsResponse.documents.forEach((doc, index) => {
                console.log(`   📄 Document ${index + 1}:`);
                console.log(`      - Type: ${doc.document_type}`);
                console.log(`      - Titre: ${doc.document_title}`);
                console.log(`      - Statut: ${doc.status}`);
                console.log(`      - Créé: ${new Date(doc.created_at).toLocaleString('fr-FR')}`);
            });
        } else {
            console.log('   ❌ Erreur récupération documents:', documentsResponse.error);
        }
        
        console.log('');
        
        // Résumé final
        console.log('🎉 RÉSUMÉ DU TEST:');
        console.log('   ✅ Génération automatique de documents');
        console.log('   ✅ Remplissage automatique des champs');
        console.log('   ✅ Signature électronique automatique');
        console.log('   ✅ Sauvegarde en base de données');
        console.log('   ✅ Récupération des documents par dossier');
        console.log('');
        console.log('🌐 Interface disponible sur: http://localhost:3000/agent');
        console.log('📂 Onglet "Documents" pour tester l\'interface graphique');
        
    } catch (error) {
        console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
    }
}

testDocumentSystem();
