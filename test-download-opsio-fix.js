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
                        statusCode: res.statusCode,
                        isZip: data.length > 1000 && data.includes('PK')
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

async function testDownloadOpsioFix() {
    console.log('📦 TEST: VÉRIFICATION DOCUMENT OPSIO DANS TÉLÉCHARGEMENT\n');
    
    try {
        // Test 1: Récupérer la liste des dossiers
        console.log('📋 Test 1: Récupération des dossiers...');
        
        const casesResponse = await makeRequest('http://localhost:3001/api/admin/cases');
        
        if (!casesResponse.success || !casesResponse.cases?.length) {
            console.log('❌ Aucun dossier trouvé pour le test');
            return;
        }
        
        const testCase = casesResponse.cases[0];
        console.log('✅ Dossier de test trouvé:', testCase.case_number);
        console.log('- Client ID:', testCase.client_id);
        console.log('- Case ID:', testCase.id);
        
        // Test 2: Test de génération OPSIO directe
        console.log('\n📋 Test 2: Génération OPSIO directe...');
        
        const opsioData = {
            clientName: 'Test Client OPSIO',
            clientAddress: 'Rue de Test 123',
            clientPostalCity: '1200 Genève',
            clientBirthdate: '15.05.1980',
            clientEmail: 'test@email.com',
            clientPhone: '+41 79 123 45 67',
            advisorName: 'Marie Martin',
            advisorEmail: 'marie.martin@opsio.ch',
            advisorPhone: '+41 78 305 12 77',
            paymentMethod: 'commission',
            signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        };
        
        const opsioResponse = await makeRequest('http://localhost:3001/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'opsio-info-sheet',
                data: opsioData
            })
        });
        
        console.log('Résultat génération OPSIO directe:');
        console.log('- Succès:', opsioResponse.success ? '✅' : '❌');
        
        if (opsioResponse.success) {
            console.log('- Document ID:', opsioResponse.document?.id);
            console.log('- Type MIME:', opsioResponse.document?.mimeType);
            console.log('- Taille:', opsioResponse.document?.content?.length || 0, 'caractères');
            
            // Sauvegarder pour vérification
            if (opsioResponse.document?.content) {
                const buffer = Buffer.from(opsioResponse.document.content, 'base64');
                fs.writeFileSync('test-opsio-direct-generation.docx', buffer);
                console.log('✅ Document OPSIO direct sauvegardé: test-opsio-direct-generation.docx');
            }
        } else {
            console.log('❌ Erreur génération OPSIO:', opsioResponse.error);
        }
        
        // Test 3: Test de téléchargement complet
        console.log('\n📋 Test 3: Test de téléchargement complet avec OPSIO...');
        
        const downloadResponse = await makeRequest('http://localhost:3001/api/agent/download-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                caseId: testCase.id,
                clientId: testCase.client_id,
                includeWordDocuments: true,
                includeSignatures: true,
                generateWordWithSignature: true,
                signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            })
        });
        
        console.log('Résultat téléchargement complet:');
        console.log('- Statut HTTP:', downloadResponse.statusCode);
        console.log('- Est un ZIP:', downloadResponse.isZip ? '✅' : '❌');
        console.log('- Taille:', downloadResponse.rawData ? `${(downloadResponse.rawData.length / 1024).toFixed(2)} KB` : 'N/A');
        
        if (downloadResponse.isZip) {
            fs.writeFileSync('test-download-with-opsio.zip', downloadResponse.rawData, 'binary');
            console.log('✅ ZIP téléchargé: test-download-with-opsio.zip');
            
            // Analyser le contenu du ZIP
            const JSZip = require('jszip');
            const zip = new JSZip();
            
            try {
                const zipContent = await zip.loadAsync(downloadResponse.rawData, { binary: true });
                const files = Object.keys(zipContent.files);
                
                console.log('\n📁 CONTENU DU ZIP:');
                files.forEach(filename => {
                    console.log(`- ${filename}`);
                });
                
                // Vérifier si le document OPSIO est présent
                const opsioFiles = files.filter(f => f.toLowerCase().includes('opsio'));
                
                if (opsioFiles.length > 0) {
                    console.log('\n✅ DOCUMENTS OPSIO TROUVÉS:');
                    opsioFiles.forEach(filename => {
                        console.log(`✅ ${filename}`);
                    });
                } else {
                    console.log('\n❌ AUCUN DOCUMENT OPSIO TROUVÉ DANS LE ZIP !');
                    console.log('📋 Fichiers présents:');
                    files.forEach(filename => {
                        console.log(`- ${filename}`);
                    });
                }
                
            } catch (zipError) {
                console.error('❌ Erreur analyse ZIP:', zipError.message);
            }
            
        } else {
            console.log('❌ Réponse n\'est pas un ZIP');
            if (downloadResponse.rawData) {
                console.log('Données reçues:', downloadResponse.rawData.substring(0, 500));
            }
        }
        
        console.log('\n🎉 TEST TÉLÉCHARGEMENT OPSIO TERMINÉ !');
        console.log('');
        console.log('📋 RÉSUMÉ:');
        console.log('');
        console.log('✅ VÉRIFICATIONS EFFECTUÉES:');
        console.log('   - Génération OPSIO directe via API');
        console.log('   - Téléchargement complet avec option OPSIO');
        console.log('   - Analyse du contenu du ZIP');
        console.log('   - Recherche des documents OPSIO');
        console.log('');
        console.log('🔍 DIAGNOSTIC:');
        console.log('   - Si aucun document OPSIO trouvé dans le ZIP:');
        console.log('     → Problème dans la fonction generateOpsioDocuments()');
        console.log('     → Port incorrect (3000 vs 3001)');
        console.log('     → Erreur dans l\'API de génération');
        console.log('');
        console.log('   - Si génération directe fonctionne mais pas le téléchargement:');
        console.log('     → Problème dans l\'intégration du ZIP');
        console.log('     → Erreur dans la fonction de téléchargement');
        console.log('');
        console.log('🔧 SOLUTIONS:');
        console.log('   - Corriger le port dans generateOpsioDocuments()');
        console.log('   - Vérifier l\'intégration dans le ZIP');
        console.log('   - Tester l\'API de génération OPSIO');
        
    } catch (error) {
        console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
    }
}

testDownloadOpsioFix();
