import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔧 RÉPARATION DE LA BASE DE DONNÉES - CLIENTS MANQUANTS');
    console.log('========================================================');
    
    // 1. Récupérer tous les dossiers avec leurs client_id
    const { data: cases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, client_id, case_number')
      .not('client_id', 'is', null);
      
    if (casesError) {
      console.error('❌ Erreur récupération dossiers:', casesError);
      return NextResponse.json({ error: 'Erreur récupération dossiers', details: casesError });
    }
    
    console.log(`📋 ${cases.length} dossiers avec client_id trouvés`);
    
    // 2. Récupérer tous les clients existants
    const { data: existingClients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id');
      
    if (clientsError) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return NextResponse.json({ error: 'Erreur récupération clients', details: clientsError });
    }
    
    const existingClientIds = existingClients.map(c => c.id);
    console.log(`👥 ${existingClientIds.length} clients existants`);
    
    // 3. Identifier les client_id orphelins
    const allClientIds = [...new Set(cases.map(c => c.client_id))];
    const orphanClientIds = allClientIds.filter(id => !existingClientIds.includes(id));
    
    console.log(`🔍 ${allClientIds.length} client_id uniques dans les dossiers`);
    console.log(`❌ ${orphanClientIds.length} client_id orphelins trouvés`);
    
    if (orphanClientIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Aucun client orphelin trouvé - base de données cohérente',
        stats: {
          total_cases: cases.length,
          existing_clients: existingClientIds.length,
          orphan_clients: 0
        }
      });
    }
    
    // 4. Récupérer les informations des utilisateurs pour ces clients
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role')
      .in('id', orphanClientIds);
      
    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError);
    }
    
    console.log(`🔑 ${users?.length || 0} utilisateurs trouvés pour les clients orphelins`);
    
    // 5. Créer les clients manquants
    const clientsToCreate = [];
    
    for (const clientId of orphanClientIds) {
      const user = users?.find(u => u.id === clientId);
      
      const clientData = {
        id: clientId,
        user_id: user ? clientId : null,
        client_code: user ? `CLIENT_${user.first_name}_${user.last_name}`.toUpperCase().replace(/\s+/g, '_') : `CLIENT_${clientId.substring(0, 8)}`,
        has_signature: false,
        signature_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      clientsToCreate.push(clientData);
      
      console.log(`➕ Préparation client: ${clientData.client_code} (${user ? user.email : 'pas d\'utilisateur'})`);
    }
    
    // 6. Insérer les clients en batch
    const { data: createdClients, error: insertError } = await supabaseAdmin
      .from('clients')
      .insert(clientsToCreate)
      .select();
      
    if (insertError) {
      console.error('❌ Erreur création clients:', insertError);
      return NextResponse.json({ error: 'Erreur création clients', details: insertError });
    }
    
    console.log(`✅ ${createdClients.length} clients créés avec succès`);
    
    // 7. Vérifier les signatures existantes pour ces clients
    const { data: signatures, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select('client_id')
      .in('client_id', orphanClientIds);
      
    if (!sigError && signatures.length > 0) {
      console.log(`✍️ ${signatures.length} signatures trouvées pour les nouveaux clients`);
      
      // Mettre à jour has_signature pour les clients qui ont des signatures
      const clientsWithSignatures = [...new Set(signatures.map(s => s.client_id))];
      
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ 
          has_signature: true,
          signature_count: 1,
          updated_at: new Date().toISOString()
        })
        .in('id', clientsWithSignatures);
        
      if (updateError) {
        console.error('❌ Erreur mise à jour signatures:', updateError);
      } else {
        console.log(`✅ ${clientsWithSignatures.length} clients mis à jour avec has_signature=true`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Réparation terminée - ${createdClients.length} clients créés`,
      stats: {
        total_cases: cases.length,
        existing_clients_before: existingClientIds.length,
        orphan_clients_found: orphanClientIds.length,
        clients_created: createdClients.length,
        clients_with_signatures: signatures?.length || 0
      },
      created_clients: createdClients.map(c => ({
        id: c.id,
        client_code: c.client_code,
        has_signature: c.has_signature
      }))
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}
