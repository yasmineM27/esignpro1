const fetch = require('node-fetch');

async function testYasmineAPI() {
  console.log('🔍 Test API pour Yasmine11...\n');

  try {
    // 1. Test de l'API client-selection avec recherche "yasmine"
    console.log('1️⃣ Test API client-selection avec recherche "yasmine"...');
    const response = await fetch('http://localhost:3002/api/agent/client-selection?search=yasmine&includeSignatureStatus=true');
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log('✅ Réponse API reçue');
    console.log(`   Success: ${data.success}`);
    console.log(`   Clients trouvés: ${data.clients?.length || 0}`);
    console.log(`   Fallback Mode: ${data.fallbackMode}`);
    
    if (data.warning) {
      console.log(`   ⚠️ Warning: ${data.warning}`);
    }

    if (data.clients && data.clients.length > 0) {
      console.log('\n📋 Détails des clients trouvés:');
      data.clients.forEach((client, index) => {
        console.log(`\n   Client ${index + 1}:`);
        console.log(`     Nom: ${client.fullName}`);
        console.log(`     Email: ${client.email}`);
        console.log(`     ID: ${client.id}`);
        console.log(`     Code: ${client.clientCode}`);
        console.log(`     Has Signature: ${client.hasSignature}`);
        console.log(`     Signature Count: ${client.signatureCount}`);
        console.log(`     Signature Status: ${client.signatureStatus}`);
      });
    }

    if (data.stats) {
      console.log('\n📊 Statistiques:');
      console.log(`   Total: ${data.stats.total}`);
      console.log(`   Avec signature: ${data.stats.withSignature}`);
      console.log(`   Sans signature: ${data.stats.withoutSignature}`);
    }

    // 2. Test avec le filtre "onlyWithSignature"
    console.log('\n\n2️⃣ Test avec filtre "Clients avec signature uniquement"...');
    const responseFiltered = await fetch('http://localhost:3002/api/agent/client-selection?search=yasmine&onlyWithSignature=true&includeSignatureStatus=true');
    
    if (responseFiltered.ok) {
      const filteredData = await responseFiltered.json();
      console.log('✅ Réponse API filtrée reçue');
      console.log(`   Clients avec signature: ${filteredData.clients?.length || 0}`);
      
      if (filteredData.clients && filteredData.clients.length > 0) {
        console.log('\n📋 Clients avec signature:');
        filteredData.clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.fullName} - ${client.signatureStatus}`);
        });
      } else {
        console.log('   ❌ Aucun client avec signature trouvé avec le filtre');
      }
    }

    // 3. Test de l'API de test des signatures
    console.log('\n\n3️⃣ Test API signatures-status...');
    const signaturesResponse = await fetch('http://localhost:3002/api/test/signatures-status');
    
    if (signaturesResponse.ok) {
      const signaturesData = await signaturesResponse.json();
      console.log('✅ Réponse API signatures-status reçue');
      console.log(`   Success: ${signaturesData.success}`);
      console.log(`   Message: ${signaturesData.message}`);
      
      if (signaturesData.signatures) {
        const yasmineSignatures = signaturesData.signatures.filter(s => 
          s.clientName.toLowerCase().includes('yasmine')
        );
        
        if (yasmineSignatures.length > 0) {
          console.log('\n📋 Signatures de Yasmine trouvées:');
          yasmineSignatures.forEach(client => {
            console.log(`   Client: ${client.clientName} (${client.clientEmail})`);
            console.log(`   ID: ${client.clientId}`);
            console.log(`   Signatures: ${client.signatures.length}`);
            
            if (client.signatures.length > 0) {
              client.signatures.forEach(sig => {
                console.log(`     - ${sig.signature_name} (Active: ${sig.is_active}, Défaut: ${sig.is_default})`);
              });
            }
          });
        } else {
          console.log('   ❌ Aucune signature de Yasmine trouvée dans l\'API signatures-status');
        }
      }
      
      if (signaturesData.stats) {
        console.log('\n📊 Statistiques globales:');
        console.log(`   Total clients: ${signaturesData.stats.totalClients}`);
        console.log(`   Clients avec signatures: ${signaturesData.stats.clientsWithSignatures}`);
        console.log(`   Total signatures: ${signaturesData.stats.totalSignatures}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter le test
testYasmineAPI();
