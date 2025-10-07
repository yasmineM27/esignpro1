// Script de débogage pour l'erreur de sauvegarde avec signature
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3007'; // Ajustez le port selon votre serveur

async function debugSaveSignatureError() {
  console.log('🔍 DÉBOGAGE - Erreur Sauvegarde avec Signature\n');
  
  const clientId = '9d51e6fd-c8e4-4898-844c-0dec5efd2900'; // Yasmine11
  
  try {
    // 1. Vérifier les prérequis
    console.log('1️⃣ Vérification des prérequis...');
    const prereqResponse = await fetch(`${API_BASE}/api/agent/create-case-with-signature?clientId=${clientId}`);
    const prereqData = await prereqResponse.json();
    
    console.log('📋 Prérequis:', {
      status: prereqResponse.status,
      success: prereqData.success,
      error: prereqData.error,
      hasSignature: prereqData.hasSignature,
      clientName: prereqData.clientName
    });
    
    if (!prereqData.success) {
      console.log('❌ PROBLÈME IDENTIFIÉ - Prérequis non satisfaits:', prereqData.error);
      return;
    }
    
    // 2. Tester la création du dossier
    console.log('\n2️⃣ Test de création du dossier...');
    const createData = {
      clientId: clientId,
      clientData: {
        nomPrenom: "Yasmine11 Massaoudi",
        email: "yayaaaaa27@gmail.com",
        telephone: "+21653330971",
        adresse: "Sahline",
        npaVille: "2000 Monastir",
        dateNaissance: "2025-10-01"
      },
      autoApplySignature: true,
      agentId: "550e8400-e29b-41d4-a716-446655440001"
    };
    
    console.log('📤 Données envoyées:', JSON.stringify(createData, null, 2));
    
    const createResponse = await fetch(`${API_BASE}/api/agent/create-case-with-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createData)
    });
    
    const createResult = await createResponse.json();
    
    console.log('📥 Réponse création:', {
      status: createResponse.status,
      success: createResult.success,
      error: createResult.error,
      caseNumber: createResult.caseNumber,
      caseId: createResult.caseId
    });
    
    if (createResult.success) {
      console.log('✅ SUCCÈS - Dossier créé avec signature !');
      console.log('📄 Détails:', {
        caseNumber: createResult.caseNumber,
        caseId: createResult.caseId,
        clientName: createResult.clientName,
        hasSignature: createResult.hasSignature
      });
    } else {
      console.log('❌ ÉCHEC - Erreur lors de la création:', createResult.error);
      console.log('🔍 Réponse complète:', JSON.stringify(createResult, null, 2));
    }
    
  } catch (error) {
    console.error('💥 ERREUR CRITIQUE:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Fonction pour vérifier la signature directement en base
async function checkSignatureInDB() {
  console.log('\n🔍 VÉRIFICATION DIRECTE - Signature en base de données');
  
  try {
    // Simuler une requête à l'API de test des signatures
    const response = await fetch(`${API_BASE}/api/test/signatures-status`);
    const data = await response.json();
    
    console.log('📊 Statut des signatures:', {
      status: response.status,
      totalSignatures: data.signatures?.length || 0,
      yasmine11: data.signatures?.find(s => s.client_name?.includes('Yasmine11'))
    });
    
    const yasmine11Sig = data.signatures?.find(s => s.client_name?.includes('Yasmine11'));
    if (yasmine11Sig) {
      console.log('✅ Signature Yasmine11 trouvée:', {
        id: yasmine11Sig.id,
        client_id: yasmine11Sig.client_id,
        is_active: yasmine11Sig.is_active,
        is_default: yasmine11Sig.is_default,
        signature_name: yasmine11Sig.signature_name
      });
    } else {
      console.log('❌ Signature Yasmine11 NON trouvée dans la liste');
    }
    
  } catch (error) {
    console.error('💥 Erreur vérification signature:', error.message);
  }
}

// Exécuter les tests
async function runAllTests() {
  await debugSaveSignatureError();
  await checkSignatureInDB();
  
  console.log('\n🎯 RÉSUMÉ DU DÉBOGAGE:');
  console.log('1. Vérifiez les logs ci-dessus pour identifier le problème exact');
  console.log('2. Si "Prérequis non satisfaits", le problème est dans la vérification de signature');
  console.log('3. Si "Échec création", le problème est dans la création du dossier');
  console.log('4. Comparez avec les logs du serveur Next.js pour plus de détails');
}

runAllTests().catch(console.error);
