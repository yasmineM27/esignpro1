require('dotenv').config({ path: '.env' });

async function createTestSignature() {
  console.log('🖊️ CRÉATION D\'UNE SIGNATURE DE TEST');
  console.log('===================================');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables d\'environnement Supabase manquantes');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Token de test existant
    const testToken = 'SECURE_1759939239_xl6p98w3hyq';
    console.log(`🔑 Utilisation du token: ${testToken}`);
    
    // Récupérer le client_id à partir du token
    const { data: caseData, error: caseError } = await supabase
      .from('insurance_cases')
      .select('client_id, case_number, clients!inner(users!inner(first_name, last_name))')
      .eq('secure_token', testToken)
      .single();
    
    if (caseError || !caseData) {
      console.error('❌ Erreur récupération dossier:', caseError);
      return false;
    }
    
    const clientId = caseData.client_id;
    const clientName = `${caseData.clients.users.first_name} ${caseData.clients.users.last_name}`;
    
    console.log(`✅ Dossier trouvé: ${caseData.case_number}`);
    console.log(`✅ Client: ${clientName} (${clientId})`);
    
    // Créer une signature de test (image SVG simple)
    const testSignatureSVG = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="white" stroke="#ddd" stroke-width="1"/>
        <text x="200" y="50" text-anchor="middle" font-family="cursive" font-size="24" fill="#333">
          ${clientName}
        </text>
        <path d="M50 120 Q100 80 150 120 T250 120 Q300 100 350 120" 
              stroke="#1f2937" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M60 140 Q110 160 160 140 T260 140" 
              stroke="#1f2937" stroke-width="2" fill="none" stroke-linecap="round"/>
        <text x="200" y="180" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#666">
          Signature électronique - ${new Date().toLocaleDateString('fr-FR')}
        </text>
      </svg>
    `).toString('base64')}`;
    
    console.log('🎨 Signature SVG créée');
    console.log(`   Taille: ${testSignatureSVG.length} caractères`);
    
    // Vérifier s'il existe déjà une signature pour ce client
    const { data: existingSignature } = await supabase
      .from('client_signatures')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();
    
    if (existingSignature) {
      console.log('⚠️ Une signature existe déjà, mise à jour...');
      
      const { error: updateError } = await supabase
        .from('client_signatures')
        .update({
          signature_data: testSignatureSVG,
          signature_name: `Signature de ${clientName}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSignature.id);
      
      if (updateError) {
        console.error('❌ Erreur mise à jour signature:', updateError);
        return false;
      }
      
      console.log('✅ Signature mise à jour avec succès');
    } else {
      console.log('📝 Création nouvelle signature...');
      
      const { data: newSignature, error: createError } = await supabase
        .from('client_signatures')
        .insert([{
          client_id: clientId,
          signature_data: testSignatureSVG,
          signature_name: `Signature de ${clientName}`,
          is_active: true,
          is_default: true,
          signature_metadata: {
            created_by: 'test-script',
            test_signature: true,
            client_name: clientName
          }
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erreur création signature:', createError);
        return false;
      }
      
      console.log('✅ Signature créée avec succès');
      console.log(`   ID: ${newSignature.id}`);
    }
    
    // Mettre à jour le statut du client
    await supabase
      .from('clients')
      .update({ 
        has_signature: true,
        signature_count: 1
      })
      .eq('id', clientId);
    
    console.log('✅ Statut client mis à jour');
    
    // Test de récupération
    console.log('\n🧪 TEST DE RÉCUPÉRATION:');
    console.log('========================');
    
    const { data: testSignature, error: testError } = await supabase
      .from('client_signatures')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();
    
    if (testError) {
      console.error('❌ Erreur test récupération:', testError);
      return false;
    }
    
    console.log('✅ Signature récupérée avec succès:');
    console.log(`   ID: ${testSignature.id}`);
    console.log(`   Nom: ${testSignature.signature_name}`);
    console.log(`   Créée: ${testSignature.created_at}`);
    console.log(`   Active: ${testSignature.is_active}`);
    console.log(`   Taille données: ${testSignature.signature_data.length} caractères`);
    
    console.log('\n🌐 URL DE TEST:');
    console.log('===============');
    console.log(`http://localhost:3000/client-portal/${testToken}`);
    
    console.log('\n🎉 SIGNATURE DE TEST CRÉÉE AVEC SUCCÈS !');
    console.log('========================================');
    console.log('✅ La signature devrait maintenant s\'afficher dans le portail client');
    console.log('✅ Vous pouvez tester les fonctionnalités Voir/Modifier/Supprimer');
    
    return true;
    
  } catch (error) {
    console.error('💥 Erreur création signature test:', error);
    return false;
  }
}

// Exécuter le script
if (require.main === module) {
  createTestSignature()
    .then(success => {
      if (success) {
        console.log('\n✅ Script terminé avec succès');
        process.exit(0);
      } else {
        console.log('\n❌ Script terminé avec erreurs');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { createTestSignature };
