// Test pour vérifier les données de l'agent dans la base de données
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAgentData() {
  console.log('🔍 Test des données agent...\n');

  try {
    // 1. Vérifier l'utilisateur agent
    console.log('1. Recherche utilisateur agent.test@esignpro.ch...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        agents!inner(
          id,
          agent_code,
          department,
          is_supervisor
        )
      `)
      .eq('email', 'agent.test@esignpro.ch')
      .single();

    if (userError) {
      console.log('❌ Erreur récupération utilisateur:', userError);
      return;
    }

    if (!userData) {
      console.log('❌ Utilisateur agent.test@esignpro.ch non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:');
    console.log('   - ID:', userData.id);
    console.log('   - Email:', userData.email);
    console.log('   - Nom:', userData.first_name, userData.last_name);
    console.log('   - Rôle:', userData.role);
    console.log('   - Actif:', userData.is_active);
    console.log('   - Agent ID:', userData.agents.id);
    console.log('   - Code agent:', userData.agents.agent_code);
    console.log('   - Département:', userData.agents.department);
    console.log('   - Superviseur:', userData.agents.is_supervisor);

    // 2. Vérifier si le rôle est correct
    if (userData.role !== 'agent') {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ: Le rôle devrait être "agent" mais est:', userData.role);
      
      // Corriger le rôle
      console.log('🔧 Correction du rôle...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'agent' })
        .eq('id', userData.id);

      if (updateError) {
        console.log('❌ Erreur correction rôle:', updateError);
      } else {
        console.log('✅ Rôle corrigé vers "agent"');
      }
    } else {
      console.log('\n✅ Rôle correct: "agent"');
    }

    // 3. Tester la connexion
    console.log('\n2. Test de connexion...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/agent-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'agent.test@esignpro.ch',
        password: 'test123'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Connexion réussie');
      console.log('   - Rôle retourné:', loginData.user.role);
      console.log('   - Redirection attendue vers: /agent');
    } else {
      console.log('❌ Échec connexion:', loginData.error);
    }

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testAgentData();
