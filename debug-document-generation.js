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
                    resolve({ 
                        success: false, 
                        error: 'Invalid JSON response', 
                        rawData: data,
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage
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

async function debugDocumentGeneration() {
    console.log('🔍 DIAGNOSTIC DE GÉNÉRATION DE DOCUMENTS\n');
    
    try {
        // Test avec données minimales pour identifier le problème
        console.log('📋 Test 1: Génération avec données minimales...');
        
        const minimalData = {
            clientName: 'Test Client',
            advisorName: 'Test Advisor'
        };
        
        const response1 = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'opsio-info-sheet',
                data: minimalData
            })
        });
        
        console.log('Réponse test 1:', {
            success: response1.success,
            error: response1.error,
            statusCode: response1.statusCode,
            statusMessage: response1.statusMessage
        });
        
        if (response1.rawData && !response1.success) {
            console.log('Données brutes (premiers 1000 caractères):', response1.rawData.substring(0, 1000));
        }
        
        console.log('');
        
        // Test avec caseId spécifique
        console.log('📋 Test 2: Génération avec caseId...');
        
        const response2 = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'opsio-info-sheet',
                caseId: 'test-case-123',
                data: minimalData
            })
        });
        
        console.log('Réponse test 2:', {
            success: response2.success,
            error: response2.error,
            statusCode: response2.statusCode,
            statusMessage: response2.statusMessage
        });
        
        console.log('');
        
        // Test avec clientId spécifique
        console.log('📋 Test 3: Génération avec clientId...');
        
        const response3 = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'opsio-info-sheet',
                clientId: 'test-client-123',
                data: minimalData
            })
        });
        
        console.log('Réponse test 3:', {
            success: response3.success,
            error: response3.error,
            statusCode: response3.statusCode,
            statusMessage: response3.statusMessage
        });
        
        console.log('');
        
        // Test de récupération des clients existants
        console.log('📋 Test 4: Vérification des clients existants...');
        
        const clientsResponse = await makeRequest('http://localhost:3000/api/admin/clients');
        
        console.log('Clients disponibles:', {
            success: clientsResponse.success,
            count: clientsResponse.clients?.length || 0,
            error: clientsResponse.error
        });
        
        if (clientsResponse.success && clientsResponse.clients?.length > 0) {
            const firstClient = clientsResponse.clients[0];
            console.log('Premier client trouvé:', {
                id: firstClient.id,
                user_id: firstClient.user_id,
                client_code: firstClient.client_code
            });
            
            // Test avec un vrai client
            console.log('📋 Test 5: Génération avec client réel...');
            
            const response5 = await makeRequest('http://localhost:3000/api/documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentType: 'opsio-info-sheet',
                    clientId: firstClient.id,
                    data: {
                        clientName: firstClient.users?.first_name + ' ' + firstClient.users?.last_name || 'Client Test',
                        advisorName: 'Test Advisor'
                    }
                })
            });
            
            console.log('Réponse test 5 (client réel):', {
                success: response5.success,
                error: response5.error,
                documentId: response5.document?.id
            });
        }
        
        console.log('\n🔍 DIAGNOSTIC TERMINÉ');
        
    } catch (error) {
        console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
    }
}

debugDocumentGeneration();
