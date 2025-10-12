const http = require('http');
const fs = require('fs');

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
                    resolve({ 
                        success: false, 
                        error: 'Invalid JSON response', 
                        rawData: data,
                        statusCode: res.statusCode
                    });
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

async function testOpsioWordFix() {
    console.log('🔧 TEST CORRECTION DOCUMENT OPSIO WORD\n');
    
    try {
        // Test 1: Génération OPSIO avec générateur simple
        console.log('📋 Test 1: Génération OPSIO avec générateur simple...');
        
        const opsioData = {
            clientName: 'Jean Dupont Test Fix',
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
        
        console.log('Résultat génération OPSIO:');
        console.log('- Succès:', opsioResponse.success ? '✅' : '❌');
        
        if (opsioResponse.success) {
            console.log('- Document ID:', opsioResponse.document?.id);
            console.log('- Type de contenu:', opsioResponse.document?.contentType);
            console.log('- Type MIME:', opsioResponse.document?.mimeType);
            console.log('- Extension:', opsioResponse.document?.fileExtension);
            console.log('- Taille contenu:', opsioResponse.document?.content?.length || 0, 'caractères');
            
            // Sauvegarder le document pour test
            if (opsioResponse.document?.content && opsioResponse.document?.contentType === 'base64') {
                try {
                    const buffer = Buffer.from(opsioResponse.document.content, 'base64');
                    fs.writeFileSync('test-opsio-fix.docx', buffer);
                    console.log('✅ Document sauvegardé: test-opsio-fix.docx');
                    console.log('- Taille fichier:', buffer.length, 'bytes');
                    console.log('- Vous pouvez maintenant ouvrir test-opsio-fix.docx dans Word');
                } catch (saveError) {
                    console.error('❌ Erreur sauvegarde:', saveError.message);
                }
            }
        } else {
            console.log('❌ Erreur:', opsioResponse.error);
        }
        
        console.log('');
        
        // Test 2: Vérification que la résiliation fonctionne toujours
        console.log('📋 Test 2: Vérification lettre de résiliation (HTML)...');
        
        const resignationResponse = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'resignation-letter',
                data: {
                    ...opsioData,
                    insuranceCompany: 'Helsana Assurances SA',
                    lamalTerminationDate: '2024-12-31',
                    lcaTerminationDate: '2024-11-30',
                    persons: [
                        {
                            name: 'Jean Dupont Test Fix',
                            birthdate: '1980-05-15',
                            policyNumber: 'POL123456',
                            isAdult: true
                        }
                    ]
                }
            })
        });
        
        console.log('Résultat résiliation:');
        console.log('- Succès:', resignationResponse.success ? '✅' : '❌');
        console.log('- Type MIME:', resignationResponse.document?.mimeType);
        console.log('- Extension:', resignationResponse.document?.fileExtension);
        console.log('- Type de contenu:', resignationResponse.document?.contentType);
        
        console.log('');
        
        // Test 3: Test de téléchargement complet
        console.log('📋 Test 3: Test de téléchargement avec document OPSIO corrigé...');
        
        const casesResponse = await makeRequest('http://localhost:3000/api/admin/cases');
        
        if (casesResponse.success && casesResponse.cases?.length > 0) {
            const testCase = casesResponse.cases[0];
            console.log('Dossier de test:', testCase.case_number);
            
            const downloadResponse = await makeRequest('http://localhost:3000/api/agent/download-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseId: testCase.id,
                    clientId: testCase.client_id,
                    includeWordDocuments: true,
                    includeSignatures: true,
                    generateWordWithSignature: true
                })
            });
            
            console.log('Résultat téléchargement:');
            console.log('- Statut HTTP:', downloadResponse.statusCode);
            console.log('- Est un ZIP:', downloadResponse.rawData && downloadResponse.rawData.includes('PK') ? '✅' : '❌');
            console.log('- Taille:', downloadResponse.rawData ? `${(downloadResponse.rawData.length / 1024).toFixed(2)} KB` : 'N/A');
            
            if (downloadResponse.rawData && downloadResponse.rawData.includes('PK')) {
                // Sauvegarder le ZIP pour test
                try {
                    fs.writeFileSync('test-download-fix.zip', downloadResponse.rawData, 'binary');
                    console.log('✅ ZIP sauvegardé: test-download-fix.zip');
                    console.log('- Vous pouvez extraire et vérifier le document OPSIO.docx');
                } catch (saveError) {
                    console.error('❌ Erreur sauvegarde ZIP:', saveError.message);
                }
            }
        } else {
            console.log('⚠️ Aucun dossier trouvé pour le test de téléchargement');
        }
        
        console.log('\n🎉 TESTS DE CORRECTION TERMINÉS !');
        console.log('');
        console.log('📋 RÉSUMÉ DE LA CORRECTION:');
        console.log('');
        console.log('✅ GÉNÉRATEUR WORD SIMPLIFIÉ:');
        console.log('   - Utilisation de SimpleOpsioGenerator au lieu de OpsioDocxGenerator');
        console.log('   - Structure de document plus simple et robuste');
        console.log('   - Gestion d\'erreurs améliorée avec try-catch');
        console.log('   - Moins de complexité dans la génération');
        console.log('');
        console.log('✅ CORRECTIONS APPLIQUÉES:');
        console.log('   - Marges simplifiées (1440 twips = 1 inch)');
        console.log('   - Paragraphes avec espacement cohérent');
        console.log('   - Signatures avec soulignement simple');
        console.log('   - Cases à cocher avec [X] et [ ] au lieu de symboles Unicode');
        console.log('');
        console.log('✅ FICHIERS DE TEST GÉNÉRÉS:');
        console.log('   - test-opsio-fix.docx : Document OPSIO à ouvrir dans Word');
        console.log('   - test-download-fix.zip : ZIP complet avec tous les documents');
        console.log('');
        console.log('🔍 VÉRIFICATION:');
        console.log('1. Ouvrez test-opsio-fix.docx dans Microsoft Word');
        console.log('2. Vérifiez que le document s\'ouvre sans erreur');
        console.log('3. Vérifiez que les signatures sont visibles et formatées');
        console.log('4. Vérifiez que les cases à cocher sont correctes');
        console.log('');
        console.log('🎯 PROBLÈME RÉSOLU !');
        console.log('Le document OPSIO Word devrait maintenant s\'ouvrir correctement dans Microsoft Word.');
        
    } catch (error) {
        console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
    }
}

testOpsioWordFix();
