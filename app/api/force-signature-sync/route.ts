import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 SYNCHRONISATION FORCÉE DES SIGNATURES');
    console.log('=====================================');

    // 1. Récupérer tous les clients qui ont des signatures de dossiers
    const { data: caseSignatures, error: caseError } = await supabaseAdmin
      .from('signatures')
      .select(`
        id,
        signature_data,
        signed_at,
        created_at,
        signature_metadata,
        insurance_cases!inner(
          id,
          case_number,
          client_id,
          clients!inner(
            id,
            client_code,
            users!inner(
              first_name,
              last_name,
              email
            )
          )
        )
      `)
      .not('signature_data', 'is', null)
      .order('signed_at', { ascending: false });

    if (caseError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération signatures de dossiers',
        details: caseError.message
      }, { status: 500 });
    }

    console.log(`📊 ${caseSignatures?.length || 0} signatures de dossiers trouvées`);

    // 2. Récupérer tous les clients qui ont déjà des signatures clients
    const { data: existingClientSignatures, error: existingError } = await supabaseAdmin
      .from('client_signatures')
      .select('client_id, signature_name, is_active, is_default')
      .eq('is_active', true);

    if (existingError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération signatures clients',
        details: existingError.message
      }, { status: 500 });
    }

    const existingClientIds = new Set(existingClientSignatures?.map(s => s.client_id) || []);
    console.log(`📊 ${existingClientIds.size} clients ont déjà des signatures réutilisables`);

    // 3. Identifier les clients qui ont des signatures de dossiers mais pas de signatures clients
    const clientsToMigrate = new Map();
    
    caseSignatures?.forEach(sig => {
      const clientId = sig.insurance_cases.client_id;
      
      // Si ce client n'a pas déjà de signature client
      if (!existingClientIds.has(clientId)) {
        const clientName = `${sig.insurance_cases.clients.users.first_name} ${sig.insurance_cases.clients.users.last_name}`;
        
        if (!clientsToMigrate.has(clientId)) {
          clientsToMigrate.set(clientId, {
            clientId,
            clientName,
            clientCode: sig.insurance_cases.clients.client_code,
            email: sig.insurance_cases.clients.users.email,
            signatures: []
          });
        }
        
        clientsToMigrate.get(clientId).signatures.push({
          id: sig.id,
          signatureData: sig.signature_data,
          caseNumber: sig.insurance_cases.case_number,
          signedAt: sig.signed_at,
          createdAt: sig.created_at,
          metadata: sig.signature_metadata
        });
      }
    });

    console.log(`🎯 ${clientsToMigrate.size} clients nécessitent une migration`);

    if (clientsToMigrate.size === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune migration nécessaire - toutes les signatures sont déjà synchronisées',
        stats: {
          totalCaseSignatures: caseSignatures?.length || 0,
          clientsWithExistingSignatures: existingClientIds.size,
          clientsNeedingMigration: 0,
          migrationsPerformed: 0
        }
      });
    }

    // 4. Effectuer les migrations
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const [clientId, clientData] of clientsToMigrate) {
      try {
        // Prendre la signature la plus récente
        const mostRecentSignature = clientData.signatures.sort((a, b) => 
          new Date(b.signedAt || b.createdAt).getTime() - new Date(a.signedAt || a.createdAt).getTime()
        )[0];

        const signatureName = `Signature_${clientData.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_Auto`;

        console.log(`🔄 Migration ${clientData.clientName} (${clientData.signatures.length} signatures disponibles)`);

        // Créer la signature client
        const { data: newClientSignature, error: createError } = await supabaseAdmin
          .from('client_signatures')
          .insert({
            client_id: clientId,
            signature_data: mostRecentSignature.signatureData,
            signature_name: signatureName,
            is_active: true,
            is_default: true,
            signature_metadata: {
              ...mostRecentSignature.metadata,
              migrated_from_case: mostRecentSignature.caseNumber,
              migrated_at: new Date().toISOString(),
              original_signature_id: mostRecentSignature.id,
              migration_reason: 'force_sync_api',
              total_case_signatures: clientData.signatures.length,
              sync_date: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (createError) {
          console.error(`❌ Erreur ${clientData.clientName}:`, createError.message);
          errorCount++;
          results.push({
            clientName: clientData.clientName,
            clientId: clientId,
            status: 'error',
            error: createError.message
          });
        } else {
          console.log(`✅ ${clientData.clientName} - Signature migrée avec succès`);
          successCount++;
          results.push({
            clientName: clientData.clientName,
            clientId: clientId,
            status: 'success',
            signatureName: signatureName,
            migratedFrom: mostRecentSignature.caseNumber,
            totalCaseSignatures: clientData.signatures.length,
            newSignatureId: newClientSignature.id
          });
        }

      } catch (error) {
        console.error(`❌ Erreur migration ${clientData.clientName}:`, error);
        errorCount++;
        results.push({
          clientName: clientData.clientName,
          clientId: clientId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    console.log('=====================================');
    console.log(`✅ SYNCHRONISATION TERMINÉE: ${successCount} succès, ${errorCount} erreurs`);

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${successCount} signatures migrées, ${errorCount} erreurs`,
      stats: {
        totalCaseSignatures: caseSignatures?.length || 0,
        clientsWithExistingSignatures: existingClientIds.size,
        clientsNeedingMigration: clientsToMigrate.size,
        migrationsPerformed: successCount,
        migrationErrors: errorCount
      },
      results: results
    });

  } catch (error) {
    console.error('💥 Erreur synchronisation forcée:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
