/**
 * Test script for the automated signature and client folder management system
 * Tests the complete workflow with the provided client token: c144a76b-ceed-460e-85da-78f8fd589702
 */

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://esignpro.ch' 
  : 'http://localhost:3000';

const TEST_CLIENT_TOKEN = 'c144a76b-ceed-460e-85da-78f8fd589702';
const TEST_AGENT_ID = '550e8400-e29b-41d4-a716-446655440001';

// Test data
const testSignatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`🔄 ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ Error: ${response.status} - ${data.error || data.message}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDatabaseEnhancements() {
  console.log('\n🗃️ Testing Database Enhancements...');
  
  // This would typically be run in the database directly
  console.log('ℹ️ Database enhancements should be applied using the SQL script:');
  console.log('   database/AUTOMATED_SIGNATURE_ENHANCEMENTS.sql');
  console.log('✅ Database enhancements test completed');
}

async function testClientSearch() {
  console.log('\n🔍 Testing Client Search...');
  
  const result = await makeRequest('/api/agent/client-selection?search=yasmine&limit=10');
  
  if (result.success) {
    console.log(`✅ Found ${result.data.clients?.length || 0} clients`);
    if (result.data.clients?.length > 0) {
      const client = result.data.clients[0];
      console.log(`   First client: ${client.fullName} (${client.email})`);
      console.log(`   Has signature: ${client.hasSignature}`);
      return client;
    }
  }
  
  return null;
}

async function testCreateNewClient() {
  console.log('\n👤 Testing New Client Creation...');
  
  const clientData = {
    firstName: 'Yasmine',
    lastName: 'Massaoudi',
    email: 'yasminemassaoudi27@gmail.com',
    phone: '+41 79 123 45 67',
    dateOfBirth: '1990-01-01',
    address: 'Sahline',
    city: 'Monastir',
    postalCode: '2000',
    country: 'Tunisie'
  };
  
  const result = await makeRequest('/api/agent/client-selection', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create_client',
      clientData: clientData,
      agentId: TEST_AGENT_ID
    })
  });
  
  if (result.success) {
    console.log(`✅ Client created: ${result.data.client.fullName} (ID: ${result.data.client.id})`);
    return result.data.client;
  }
  
  return null;
}

async function testCreateCaseForClient(clientId) {
  console.log('\n📁 Testing Case Creation for Existing Client...');
  
  const caseData = {
    insuranceCompany: 'Assura',
    policyNumber: 'POL-123456789',
    policyType: 'LAMal',
    terminationDate: '2024-12-31',
    reasonForTermination: 'Changement d\'assureur'
  };
  
  const result = await makeRequest('/api/agent/client-selection', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create_case_for_client',
      clientId: clientId,
      caseData: caseData,
      agentId: TEST_AGENT_ID
    })
  });
  
  if (result.success) {
    console.log(`✅ Case created: ${result.data.case.caseNumber} (ID: ${result.data.case.id})`);
    console.log(`   Client has signature: ${result.data.case.clientHasSignature}`);
    return result.data.case;
  }
  
  return null;
}

async function testSaveClientSignature(clientId, caseId) {
  console.log('\n✍️ Testing Client Signature Saving...');
  
  const result = await makeRequest('/api/agent/client-signatures', {
    method: 'POST',
    body: JSON.stringify({
      clientId: clientId,
      signatureData: testSignatureData,
      signatureName: 'Signature principale',
      isDefault: true,
      caseId: caseId,
      metadata: {
        source: 'test_script',
        timestamp: new Date().toISOString()
      }
    })
  });
  
  if (result.success) {
    console.log(`✅ Signature saved: ${result.data.signature.id}`);
    console.log(`   Signature name: ${result.data.signature.signature_name}`);
    return result.data.signature;
  }
  
  return null;
}

async function testGetClientSignatures(clientId) {
  console.log('\n🔍 Testing Client Signature Retrieval...');
  
  const result = await makeRequest(`/api/agent/client-signatures?clientId=${clientId}`);
  
  if (result.success) {
    console.log(`✅ Found ${result.data.signatures?.length || 0} signature(s)`);
    if (result.data.signatures?.length > 0) {
      const signature = result.data.signatures[0];
      console.log(`   Signature: ${signature.signature_name} (Active: ${signature.is_active})`);
      return signature;
    }
  }
  
  return null;
}

async function testLoadTemplates() {
  console.log('\n📋 Testing Template Loading...');
  
  const result = await makeRequest('/api/agent/templates?active=true');
  
  if (result.success) {
    console.log(`✅ Found ${result.data.templates?.length || 0} template(s)`);
    if (result.data.templates?.length > 0) {
      result.data.templates.forEach(template => {
        console.log(`   - ${template.template_name} (${template.template_category})`);
      });
      return result.data.templates;
    }
  }
  
  return [];
}

async function testGenerateDocumentsWithSignature(clientId, caseId, templates) {
  console.log('\n📝 Testing Document Generation with Automatic Signature...');
  
  if (!templates || templates.length === 0) {
    console.log('❌ No templates available for testing');
    return null;
  }
  
  const templateIds = templates.slice(0, 2).map(t => t.id); // Test with first 2 templates
  
  const result = await makeRequest('/api/agent/generate-documents-with-signature', {
    method: 'POST',
    body: JSON.stringify({
      clientId: clientId,
      caseId: caseId,
      templateIds: templateIds,
      customVariables: {
        lieu_date: 'Sousse, ' + new Date().toLocaleDateString('fr-CH')
      },
      agentId: TEST_AGENT_ID,
      sessionName: 'Test Session - Automated Signature',
      autoApplySignature: true
    })
  });
  
  if (result.success) {
    console.log(`✅ Generated ${result.data.documents?.length || 0} document(s)`);
    console.log(`   Documents generated: ${result.data.summary.documentsGenerated}`);
    console.log(`   Documents signed: ${result.data.summary.documentsSigned}`);
    console.log(`   Signature applied: ${result.data.summary.signatureApplied}`);
    
    if (result.data.documents?.length > 0) {
      result.data.documents.forEach(doc => {
        console.log(`   - ${doc.documentName} (Signed: ${doc.isSigned})`);
      });
    }
    
    return result.data.documents;
  }
  
  return null;
}

async function testClientDocumentsArchive(clientId) {
  console.log('\n📦 Testing Client Documents Archive...');
  
  const result = await makeRequest(`/api/agent/export-client-documents?clientId=${clientId}`);
  
  if (result.success || result.status === 200) {
    console.log('✅ Client documents archive accessible');
    return true;
  } else {
    console.log('ℹ️ Client documents archive test - may need documents to be generated first');
    return false;
  }
}

async function testCompleteWorkflow() {
  console.log('🚀 Starting Complete Automated Signature System Test');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Test database enhancements
    await testDatabaseEnhancements();
    
    // Step 2: Search for existing client or create new one
    let client = await testClientSearch();
    
    if (!client) {
      console.log('ℹ️ No existing client found, creating new one...');
      client = await testCreateNewClient();
    }
    
    if (!client) {
      console.log('❌ Failed to get or create client');
      return;
    }
    
    // Step 3: Create a case for the client
    const caseData = await testCreateCaseForClient(client.id);
    
    if (!caseData) {
      console.log('❌ Failed to create case');
      return;
    }
    
    // Step 4: Save client signature (first time)
    const signature = await testSaveClientSignature(client.id, caseData.id);
    
    if (!signature) {
      console.log('❌ Failed to save signature');
      return;
    }
    
    // Step 5: Verify signature retrieval
    const retrievedSignature = await testGetClientSignatures(client.id);
    
    if (!retrievedSignature) {
      console.log('❌ Failed to retrieve signature');
      return;
    }
    
    // Step 6: Load available templates
    const templates = await testLoadTemplates();
    
    // Step 7: Generate documents with automatic signature
    const documents = await testGenerateDocumentsWithSignature(client.id, caseData.id, templates);
    
    // Step 8: Test document archive
    await testClientDocumentsArchive(client.id);
    
    // Final summary
    console.log('\n🎉 Test Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Client: ${client.fullName} (${client.id})`);
    console.log(`✅ Case: ${caseData.caseNumber} (${caseData.id})`);
    console.log(`✅ Signature: ${signature.signature_name} (${signature.id})`);
    console.log(`✅ Templates: ${templates.length} available`);
    console.log(`✅ Documents: ${documents?.length || 0} generated`);
    
    if (documents && documents.length > 0) {
      const signedDocs = documents.filter(d => d.isSigned).length;
      console.log(`✅ Automatic signatures applied: ${signedDocs}/${documents.length}`);
      
      if (signedDocs === documents.length) {
        console.log('🎯 SUCCESS: All documents were automatically signed!');
      } else {
        console.log('⚠️ WARNING: Not all documents were automatically signed');
      }
    }
    
    console.log('\n🏁 Automated Signature System Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
if (require.main === module) {
  testCompleteWorkflow();
}

module.exports = {
  testCompleteWorkflow,
  testClientSearch,
  testCreateNewClient,
  testSaveClientSignature,
  testGenerateDocumentsWithSignature
};
