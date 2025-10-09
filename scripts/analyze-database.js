const { supabaseAdmin } = require('../lib/supabase.ts');

async function analyzeDatabase() {
  console.log('🔍 ANALYSE DE LA BASE DE DONNÉES');
  console.log('================================');
  
  try {
    // Compter les dossiers
    const { data: cases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, client_id, case_number')
      .limit(10);
      
    if (casesError) {
      console.error('❌ Erreur dossiers:', casesError);
      return;
    }
      
    console.log('📋 Dossiers (insurance_cases):');
    console.log('Nombre:', cases?.length || 0);
    if (cases?.length > 0) {
      console.log('Exemples:', cases.slice(0, 3).map(c => ({ 
        case_number: c.case_number, 
        client_id: c.client_id 
      })));
    }
    
    // Compter les clients
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, client_code, user_id')
      .limit(10);
      
    if (clientsError) {
      console.error('❌ Erreur clients:', clientsError);
    } else {
      console.log('\n👥 Clients (clients):');
      console.log('Nombre:', clients?.length || 0);
      if (clients?.length > 0) {
        console.log('Exemples:', clients.slice(0, 3));
      }
    }
    
    // Compter les utilisateurs
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role')
      .limit(10);
      
    if (usersError) {
      console.error('❌ Erreur utilisateurs:', usersError);
    } else {
      console.log('\n🔑 Utilisateurs (users):');
      console.log('Nombre:', users?.length || 0);
      if (users?.length > 0) {
        console.log('Exemples:', users.slice(0, 3).map(u => ({ 
          email: u.email, 
          name: `${u.first_name} ${u.last_name}`,
          role: u.role 
        })));
      }
    }
    
    // Vérifier les client_id orphelins
    if (cases?.length > 0) {
      const clientIds = [...new Set(cases.map(c => c.client_id).filter(Boolean))];
      console.log('\n🔍 Client IDs uniques dans les dossiers:', clientIds.length);
      
      if (clients?.length > 0) {
        const existingClientIds = clients.map(c => c.id);
        const orphanIds = clientIds.filter(id => !existingClientIds.includes(id));
        console.log('❌ Client IDs orphelins (dossiers sans clients):', orphanIds.length);
        if (orphanIds.length > 0) {
          console.log('Exemples orphelins:', orphanIds.slice(0, 3));
        }
      } else {
        console.log('❌ PROBLÈME: Tous les client_id sont orphelins (table clients vide)');
        console.log('Client IDs dans les dossiers:', clientIds.slice(0, 5));
      }
    }
    
    // Compter les signatures
    const { data: signatures, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select('id, client_id')
      .limit(10);
      
    if (sigError) {
      console.error('❌ Erreur signatures:', sigError);
    } else {
      console.log('\n✍️ Signatures (client_signatures):');
      console.log('Nombre:', signatures?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

analyzeDatabase().catch(console.error);
