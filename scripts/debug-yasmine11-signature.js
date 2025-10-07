const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugYasmine11Signature() {
  console.log('🔍 DEBUG: Recherche des signatures de Yasmine11...\n');

  try {
    // 1. Rechercher Yasmine11 dans la table clients
    console.log('1️⃣ Recherche de Yasmine11 dans la table clients...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        client_code,
        users!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .ilike('users.first_name', '%yasmine11%');

    if (clientsError) {
      console.error('❌ Erreur recherche clients:', clientsError);
      return;
    }

    if (!clients || clients.length === 0) {
      console.log('❌ Aucun client trouvé avec le nom "Yasmine11"');
      
      // Essayer une recherche plus large
      console.log('\n🔍 Recherche élargie avec "yasmine"...');
      const { data: broadClients, error: broadError } = await supabase
        .from('clients')
        .select(`
          id,
          client_code,
          users!inner(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .ilike('users.first_name', '%yasmine%');

      if (broadClients && broadClients.length > 0) {
        console.log(`✅ ${broadClients.length} client(s) trouvé(s) avec "yasmine":`);
        broadClients.forEach(client => {
          console.log(`   - ${client.users.first_name} ${client.users.last_name} (${client.users.email})`);
          console.log(`     ID: ${client.id}`);
          console.log(`     Code: ${client.client_code}\n`);
        });
        
        // Utiliser le premier client trouvé pour la suite
        clients.push(broadClients[0]);
      } else {
        return;
      }
    }

    const client = clients[0];
    console.log(`✅ Client trouvé: ${client.users.first_name} ${client.users.last_name}`);
    console.log(`   Email: ${client.users.email}`);
    console.log(`   ID: ${client.id}`);
    console.log(`   Code: ${client.client_code}\n`);

    // 2. Vérifier les signatures dans client_signatures
    console.log('2️⃣ Recherche des signatures dans client_signatures...');
    const { data: clientSignatures, error: sigError } = await supabase
      .from('client_signatures')
      .select('*')
      .eq('client_id', client.id);

    if (sigError) {
      console.error('❌ Erreur recherche signatures client:', sigError);
    } else if (!clientSignatures || clientSignatures.length === 0) {
      console.log('❌ Aucune signature trouvée dans client_signatures');
    } else {
      console.log(`✅ ${clientSignatures.length} signature(s) trouvée(s) dans client_signatures:`);
      clientSignatures.forEach(sig => {
        console.log(`   - ID: ${sig.id}`);
        console.log(`     Nom: ${sig.signature_name}`);
        console.log(`     Active: ${sig.is_active}`);
        console.log(`     Par défaut: ${sig.is_default}`);
        console.log(`     Créée le: ${sig.created_at}`);
        console.log(`     Taille signature: ${sig.signature_data?.length || 0} caractères\n`);
      });
    }

    // 3. Vérifier les signatures dans l'ancienne table signatures
    console.log('3️⃣ Recherche des signatures dans l\'ancienne table signatures...');
    const { data: cases, error: casesError } = await supabase
      .from('insurance_cases')
      .select('id, case_number, status')
      .eq('client_id', client.id);

    if (casesError) {
      console.error('❌ Erreur recherche dossiers:', casesError);
    } else if (cases && cases.length > 0) {
      console.log(`✅ ${cases.length} dossier(s) trouvé(s):`);
      
      for (const caseItem of cases) {
        console.log(`   - Dossier: ${caseItem.case_number} (${caseItem.status})`);
        
        const { data: oldSignatures, error: oldSigError } = await supabase
          .from('signatures')
          .select('*')
          .eq('case_id', caseItem.id);

        if (!oldSigError && oldSignatures && oldSignatures.length > 0) {
          console.log(`     ✅ ${oldSignatures.length} signature(s) dans l'ancienne table:`);
          oldSignatures.forEach(sig => {
            console.log(`       - ID: ${sig.id}`);
            console.log(`         Signée le: ${sig.signed_at}`);
            console.log(`         Valide: ${sig.is_valid}`);
            console.log(`         Taille: ${sig.signature_data?.length || 0} caractères`);
          });
        } else {
          console.log(`     ❌ Aucune signature dans l'ancienne table`);
        }
      }
    } else {
      console.log('❌ Aucun dossier trouvé pour ce client');
    }

    // 4. Tester l'API client-selection
    console.log('\n4️⃣ Test de l\'API client-selection...');
    const response = await fetch('http://localhost:3002/api/agent/client-selection?search=yasmine&includeSignatureStatus=true');
    
    if (response.ok) {
      const apiData = await response.json();
      console.log('✅ Réponse API client-selection:');
      console.log(`   Success: ${apiData.success}`);
      console.log(`   Clients trouvés: ${apiData.clients?.length || 0}`);
      
      if (apiData.clients && apiData.clients.length > 0) {
        const yasmine = apiData.clients.find(c => 
          c.firstName.toLowerCase().includes('yasmine') || 
          c.fullName.toLowerCase().includes('yasmine')
        );
        
        if (yasmine) {
          console.log('\n   📋 Données Yasmine depuis l\'API:');
          console.log(`     Nom: ${yasmine.fullName}`);
          console.log(`     Email: ${yasmine.email}`);
          console.log(`     Has Signature: ${yasmine.hasSignature}`);
          console.log(`     Signature Count: ${yasmine.signatureCount}`);
          console.log(`     Signature Status: ${yasmine.signatureStatus}`);
        }
      }
      
      if (apiData.stats) {
        console.log('\n   📊 Statistiques:');
        console.log(`     Total: ${apiData.stats.total}`);
        console.log(`     Avec signature: ${apiData.stats.withSignature}`);
        console.log(`     Sans signature: ${apiData.stats.withoutSignature}`);
      }
    } else {
      console.error('❌ Erreur API client-selection:', response.status);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugYasmine11Signature();
