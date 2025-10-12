// Test simple de connexion agent via l'API
const fetch = require('node-fetch');

async function testAgentLogin() {
  console.log('🔍 Test de connexion agent...\n');

  try {
    // Test de connexion avec l'API agent-login
    console.log('1. Test connexion agent.test@esignpro.ch...');
    
    const response = await fetch('http://localhost:3000/api/auth/agent-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'agent.test@esignpro.ch',
        password: 'test123'
      }),
    });

    const data = await response.json();
    
    console.log('📊 Réponse API:');
    console.log('   - Status:', response.status);
    console.log('   - Success:', data.success);
    
    if (data.success) {
      console.log('✅ Connexion réussie !');
      console.log('   - User ID:', data.user.id);
      console.log('   - Email:', data.user.email);
      console.log('   - Nom:', data.user.first_name, data.user.last_name);
      console.log('   - Rôle:', data.user.role);
      console.log('   - Agent Code:', data.user.agent?.agent_code);
      console.log('   - Département:', data.user.agent?.department);
      
      // Vérifier le rôle pour la redirection
      if (data.user.role === 'agent') {
        console.log('✅ Rôle correct: "agent" → Redirection vers /agent');
      } else {
        console.log('⚠️  Rôle inattendu:', data.user.role);
        console.log('   → Redirection vers:', getRedirectPath(data.user.role));
      }
    } else {
      console.log('❌ Échec connexion:', data.error);
    }

    // Test avec l'API user-login aussi
    console.log('\n2. Test avec API user-login...');
    
    const userResponse = await fetch('http://localhost:3000/api/auth/user-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'agent.test@esignpro.ch',
        password: 'test123'
      }),
    });

    const userData = await userResponse.json();
    
    console.log('📊 Réponse API user-login:');
    console.log('   - Status:', userResponse.status);
    console.log('   - Success:', userData.success);
    
    if (userData.success) {
      console.log('✅ Connexion user-login réussie !');
      console.log('   - Rôle:', userData.user.role);
    } else {
      console.log('❌ Échec user-login:', userData.error);
    }

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

function getRedirectPath(role) {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'agent':
      return '/agent'
    case 'client':
      return '/client-dashboard'
    default:
      return '/dashboard'
  }
}

testAgentLogin();
