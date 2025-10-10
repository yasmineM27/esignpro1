import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔧 MISE À JOUR DES NOMS DE SIGNATURES');
    console.log('=====================================');
    
    // 1. Récupérer toutes les signatures avec les informations clients
    const { data: signatures, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select(`
        id,
        client_id,
        signature_name,
        signature_metadata,
        created_at,
        clients!inner(
          id,
          client_code,
          users!inner(
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('is_active', true);
      
    if (sigError) {
      console.error('❌ Erreur récupération signatures:', sigError);
      return NextResponse.json({ error: 'Erreur récupération signatures', details: sigError });
    }
    
    console.log(`📝 ${signatures.length} signatures trouvées`);
    
    // 2. Récupérer les dossiers pour chaque client pour avoir les case_number
    const clientIds = [...new Set(signatures.map(s => s.client_id))];
    const { data: cases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, client_id, created_at')
      .in('client_id', clientIds)
      .order('created_at', { ascending: false });
      
    if (casesError) {
      console.error('❌ Erreur récupération dossiers:', casesError);
    }
    
    // Créer une map client_id -> case_number (le plus récent)
    const clientCaseMap = new Map();
    cases?.forEach(caseItem => {
      if (!clientCaseMap.has(caseItem.client_id)) {
        clientCaseMap.set(caseItem.client_id, caseItem.case_number);
      }
    });
    
    console.log(`📋 ${cases?.length || 0} dossiers trouvés pour ${clientIds.length} clients`);
    
    // 3. Mettre à jour chaque signature
    const updates = [];
    let updatedCount = 0;
    
    for (const signature of signatures) {
      try {
        const client = signature.clients;
        const clientName = `${client.users.first_name} ${client.users.last_name}`;
        const caseNumber = clientCaseMap.get(signature.client_id) || 'UNKNOWN';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
        
        // Vérifier si le nom doit être mis à jour
        const currentName = signature.signature_name || '';
        const shouldUpdate = 
          currentName === 'Signature principale' ||
          currentName === 'Ma signature' ||
          currentName.startsWith('Signature de ') === false ||
          !currentName.includes(clientName);
        
        if (shouldUpdate) {
          const newSignatureName = `Signature de ${clientName} (${caseNumber})`;
          const newMetadata = {
            ...signature.signature_metadata,
            client_name: clientName,
            client_email: client.users.email,
            case_number: caseNumber,
            updated_via: 'admin_script',
            original_name: currentName,
            migration_timestamp: timestamp
          };
          
          updates.push({
            id: signature.id,
            signature_name: newSignatureName,
            signature_metadata: newMetadata,
            updated_at: new Date().toISOString()
          });
          
          console.log(`📝 Mise à jour: "${currentName}" → "${newSignatureName}"`);
          updatedCount++;
        } else {
          console.log(`✅ Déjà à jour: "${currentName}"`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur traitement signature ${signature.id}:`, error);
      }
    }
    
    // 4. Exécuter les mises à jour par batch
    if (updates.length > 0) {
      console.log(`🔄 Mise à jour de ${updates.length} signatures...`);
      
      for (const update of updates) {
        const { error: updateError } = await supabaseAdmin
          .from('client_signatures')
          .update({
            signature_name: update.signature_name,
            signature_metadata: update.signature_metadata,
            updated_at: update.updated_at
          })
          .eq('id', update.id);
          
        if (updateError) {
          console.error(`❌ Erreur mise à jour signature ${update.id}:`, updateError);
        }
      }
      
      console.log(`✅ ${updates.length} signatures mises à jour avec succès`);
    } else {
      console.log('✅ Aucune signature à mettre à jour');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Mise à jour terminée - ${updatedCount} signatures mises à jour`,
      stats: {
        total_signatures: signatures.length,
        signatures_updated: updatedCount,
        signatures_already_ok: signatures.length - updatedCount
      },
      updated_signatures: updates.map(u => ({
        id: u.id,
        new_name: u.signature_name
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
