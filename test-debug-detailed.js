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

async function testDebugDetailed() {
    console.log('🔍 TEST DEBUG DÉTAILLÉ\n');
    
    try {
        // Test avec données très simples
        console.log('📋 Test génération avec données minimales...');
        
        const response = await makeRequest('http://localhost:3000/api/documents/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentType: 'opsio-info-sheet',
                caseId: 'demo-case-001', // Devrait être ignoré
                data: {
                    clientName: 'Test Client'
                }
            })
        });
        
        console.log('Réponse complète:', JSON.stringify(response, null, 2));
        
        if (response.rawData && !response.success) {
            console.log('\n📄 Données brutes de la réponse:');
            console.log(response.rawData);
        }
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
    }
}

testDebugDetailed();
