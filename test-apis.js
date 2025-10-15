// Script de test simple pour vérifier les APIs
const testAPIs = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Test des APIs...\n');
  
  // Test 1: API completed-cases
  try {
    console.log('1️⃣ Test API completed-cases...');
    const response1 = await fetch(`${baseUrl}/api/agent/completed-cases?limit=5`);
    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ API completed-cases OK');
      console.log(`   - ${data1.cases?.length || 0} dossiers terminés`);
      console.log(`   - Stats: ${JSON.stringify(data1.stats)}`);
    } else {
      console.log('❌ API completed-cases ERROR:', data1.error);
    }
  } catch (error) {
    console.log('❌ API completed-cases FETCH ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 2: API all-cases
  try {
    console.log('2️⃣ Test API all-cases...');
    const response2 = await fetch(`${baseUrl}/api/agent/all-cases?status=all&limit=5`);
    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log('✅ API all-cases OK');
      console.log(`   - ${data2.cases?.length || 0} dossiers`);
      console.log(`   - Stats: ${JSON.stringify(data2.stats)}`);
    } else {
      console.log('❌ API all-cases ERROR:', data2.error);
    }
  } catch (error) {
    console.log('❌ API all-cases FETCH ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 3: API navigation-stats
  try {
    console.log('3️⃣ Test API navigation-stats...');
    const response3 = await fetch(`${baseUrl}/api/agent/navigation-stats`);
    const data3 = await response3.json();
    
    if (response3.ok) {
      console.log('✅ API navigation-stats OK');
      console.log(`   - Stats: ${JSON.stringify(data3)}`);
    } else {
      console.log('❌ API navigation-stats ERROR:', data3.error);
    }
  } catch (error) {
    console.log('❌ API navigation-stats FETCH ERROR:', error.message);
  }
  
  console.log('\n🏁 Tests terminés');
};

// Exécuter les tests si ce script est lancé directement
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testAPIs();
} else {
  // Browser environment
  testAPIs();
}

module.exports = { testAPIs };
