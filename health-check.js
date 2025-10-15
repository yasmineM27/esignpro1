// Script de vérification de santé de l'application
const healthCheck = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🏥 Vérification de santé de l\'application...\n');
  
  const checks = [
    {
      name: 'Page d\'accueil',
      url: `${baseUrl}/`,
      method: 'GET'
    },
    {
      name: 'API Agent Login',
      url: `${baseUrl}/api/auth/agent-login`,
      method: 'GET'
    },
    {
      name: 'API User Login',
      url: `${baseUrl}/api/auth/user-login`,
      method: 'GET'
    },
    {
      name: 'API Navigation Stats',
      url: `${baseUrl}/api/agent/navigation-stats`,
      method: 'GET'
    },
    {
      name: 'API Completed Cases',
      url: `${baseUrl}/api/agent/completed-cases?limit=1`,
      method: 'GET'
    },
    {
      name: 'API All Cases',
      url: `${baseUrl}/api/agent/all-cases?limit=1`,
      method: 'GET'
    },
    {
      name: 'Page Test APIs',
      url: `${baseUrl}/api-test`,
      method: 'GET'
    },
    {
      name: 'Page Test Auth',
      url: `${baseUrl}/auth-test`,
      method: 'GET'
    }
  ];

  let passedChecks = 0;
  let totalChecks = checks.length;

  for (const check of checks) {
    try {
      console.log(`🔍 Test: ${check.name}...`);
      
      const startTime = Date.now();
      const response = await fetch(check.url, {
        method: check.method,
        credentials: 'include'
      });
      const duration = Date.now() - startTime;

      if (response.ok || response.status === 401) {
        // 401 est acceptable pour les APIs d'auth sans token
        console.log(`✅ ${check.name} - OK (${response.status}) - ${duration}ms`);
        passedChecks++;
      } else {
        console.log(`⚠️  ${check.name} - ${response.status} ${response.statusText} - ${duration}ms`);
        
        // Essayer de lire la réponse pour plus d'infos
        try {
          const text = await response.text();
          if (text.length < 200) {
            console.log(`   Réponse: ${text}`);
          }
        } catch (e) {
          // Ignore
        }
      }
    } catch (error) {
      console.log(`❌ ${check.name} - ERREUR: ${error.message}`);
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  }

  console.log('📊 RÉSUMÉ:');
  console.log(`✅ Tests réussis: ${passedChecks}/${totalChecks}`);
  console.log(`❌ Tests échoués: ${totalChecks - passedChecks}/${totalChecks}`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 Tous les tests sont passés ! L\'application fonctionne correctement.');
  } else if (passedChecks >= totalChecks * 0.8) {
    console.log('⚠️  La plupart des tests sont passés. Quelques problèmes mineurs détectés.');
  } else {
    console.log('🚨 Plusieurs tests ont échoué. L\'application a des problèmes.');
  }

  console.log('\n🔗 Pages utiles:');
  console.log(`   - Test APIs: ${baseUrl}/api-test`);
  console.log(`   - Test Auth: ${baseUrl}/auth-test`);
  console.log(`   - Admin: ${baseUrl}/admin`);
  console.log(`   - Agent: ${baseUrl}/agent`);
  console.log(`   - Client: ${baseUrl}/client-dashboard`);
};

// Fonction pour tester une API spécifique
const testAPI = async (endpoint) => {
  const baseUrl = 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`🧪 Test spécifique: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.log(`Erreur: ${error.message}`);
  }
};

// Exécuter selon l'environnement
if (typeof window === 'undefined') {
  // Node.js environment
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Test d'une API spécifique
    testAPI(args[0]);
  } else {
    // Test complet
    healthCheck();
  }
} else {
  // Browser environment
  window.healthCheck = healthCheck;
  window.testAPI = testAPI;
  console.log('Health check functions available: healthCheck(), testAPI(endpoint)');
}

module.exports = { healthCheck, testAPI };
