import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Analyse des signatures de dossiers vs signatures clients...');

    // 1. Récupérer toutes les signatures de dossiers avec les infos clients
    const { data: caseSignatures, error: caseError } = await supabaseAdmin
      .from('signatures')
      .select(`
        id,
        case_id,
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
      `);

    if (caseError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération signatures de dossiers',
        details: caseError.message
      }, { status: 500 });
    }

    // 2. Récupérer toutes les signatures clients existantes
    const { data: clientSignatures, error: clientError } = await supabaseAdmin
      .from('client_signatures')
      .select('client_id, signature_name, created_at');

    if (clientError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération signatures clients',
        details: clientError.message
      }, { status: 500 });
    }

    // 3. Analyser les différences
    const clientSignatureMap = new Map();
    clientSignatures?.forEach(sig => {
      if (!clientSignatureMap.has(sig.client_id)) {
        clientSignatureMap.set(sig.client_id, []);
      }
      clientSignatureMap.get(sig.client_id).push(sig);
    });

    const analysis = [];
    const clientsWithCaseSignatures = new Map();

    caseSignatures?.forEach(caseSig => {
      const clientId = caseSig.insurance_cases.client_id;
      const clientName = `${caseSig.insurance_cases.clients.users.first_name} ${caseSig.insurance_cases.clients.users.last_name}`;
      
      if (!clientsWithCaseSignatures.has(clientId)) {
        clientsWithCaseSignatures.set(clientId, {
          clientId,
          clientName,
          clientCode: caseSig.insurance_cases.clients.client_code,
          email: caseSig.insurance_cases.clients.users.email,
          caseSignatures: [],
          hasClientSignatures: clientSignatureMap.has(clientId),
          clientSignatureCount: clientSignatureMap.get(clientId)?.length || 0
        });
      }

      clientsWithCaseSignatures.get(clientId).caseSignatures.push({
        id: caseSig.id,
        caseId: caseSig.case_id,
        caseNumber: caseSig.insurance_cases.case_number,
        signedAt: caseSig.signed_at,
        createdAt: caseSig.created_at,
        hasSignatureData: !!caseSig.signature_data
      });
    });

    // 4. Identifier les clients qui ont des signatures de dossiers mais pas de signatures clients
    const clientsNeedingMigration = [];
    
    for (const [clientId, clientData] of clientsWithCaseSignatures) {
      if (!clientData.hasClientSignatures && clientData.caseSignatures.length > 0) {
        // Vérifier si au moins une signature de dossier a des données
        const signaturesWithData = clientData.caseSignatures.filter(s => s.hasSignatureData);
        
        if (signaturesWithData.length > 0) {
          clientsNeedingMigration.push({
            ...clientData,
            signaturesWithData: signaturesWithData.length,
            mostRecentSignature: signaturesWithData.sort((a, b) => 
              new Date(b.signedAt || b.createdAt).getTime() - new Date(a.signedAt || a.createdAt).getTime()
            )[0]
          });
        }
      }
    }

    // 5. Statistiques
    const stats = {
      totalCaseSignatures: caseSignatures?.length || 0,
      totalClientSignatures: clientSignatures?.length || 0,
      clientsWithCaseSignatures: clientsWithCaseSignatures.size,
      clientsWithClientSignatures: clientSignatureMap.size,
      clientsNeedingMigration: clientsNeedingMigration.length,
      clientsWithBoth: Array.from(clientsWithCaseSignatures.values()).filter(c => c.hasClientSignatures).length
    };

    return NextResponse.json({
      success: true,
      message: 'Analyse terminée',
      stats,
      clientsNeedingMigration,
      allClientsWithCaseSignatures: Array.from(clientsWithCaseSignatures.values())
    });

  } catch (error) {
    console.error('💥 Erreur analyse signatures:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, clientId, signatureId } = await request.json();
    
    console.log('🔄 Migration signature:', { action, clientId, signatureId });

    if (action === 'migrate_client_signature') {
      // Migrer une signature spécifique de dossier vers signature client
      const { data: caseSignature, error: caseError } = await supabaseAdmin
        .from('signatures')
        .select(`
          id,
          signature_data,
          signed_at,
          created_at,
          signature_metadata,
          insurance_cases!inner(
            case_number,
            client_id,
            clients!inner(
              client_code,
              users!inner(
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('id', signatureId)
        .single();

      if (caseError || !caseSignature) {
        return NextResponse.json({
          success: false,
          error: 'Signature de dossier non trouvée'
        }, { status: 404 });
      }

      const clientName = `${caseSignature.insurance_cases.clients.users.first_name} ${caseSignature.insurance_cases.clients.users.last_name}`;
      const signatureName = `Signature_${clientName.replace(/\s+/g, '_')}_${caseSignature.insurance_cases.case_number}`;

      // Créer la signature client
      const { data: newClientSignature, error: createError } = await supabaseAdmin
        .from('client_signatures')
        .insert({
          client_id: caseSignature.insurance_cases.client_id,
          signature_data: caseSignature.signature_data,
          signature_name: signatureName,
          is_active: true,
          is_default: true, // Première signature devient par défaut
          signature_metadata: {
            ...caseSignature.signature_metadata,
            migrated_from_case: caseSignature.insurance_cases.case_number,
            migrated_at: new Date().toISOString(),
            original_signature_id: caseSignature.id
          }
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Erreur création signature client',
          details: createError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Signature migrée pour ${clientName}`,
        newSignature: newClientSignature
      });

    } else if (action === 'migrate_all_needed') {
      // Migrer toutes les signatures nécessaires - NOUVELLE LOGIQUE
      console.log('🔄 Migration automatique de toutes les signatures nécessaires...');

      // 1. Récupérer tous les clients qui ont des signatures de dossiers mais pas de signatures clients
      const { data: clientsWithCaseSignatures, error: clientsError } = await supabaseAdmin
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

      if (clientsError) {
        throw new Error(`Erreur récupération signatures de dossiers: ${clientsError.message}`);
      }

      // 2. Récupérer tous les clients qui ont déjà des signatures clients
      const { data: existingClientSignatures, error: existingError } = await supabaseAdmin
        .from('client_signatures')
        .select('client_id')
        .eq('is_active', true);

      if (existingError) {
        throw new Error(`Erreur récupération signatures clients: ${existingError.message}`);
      }

      const existingClientIds = new Set(existingClientSignatures?.map(s => s.client_id) || []);

      // 3. Identifier les clients qui ont des signatures de dossiers mais pas de signatures clients
      const clientsNeedingMigration = new Map();

      clientsWithCaseSignatures?.forEach(sig => {
        const clientId = sig.insurance_cases.client_id;

        // Si ce client n'a pas déjà de signature client
        if (!existingClientIds.has(clientId)) {
          const clientName = `${sig.insurance_cases.clients.users.first_name} ${sig.insurance_cases.clients.users.last_name}`;

          if (!clientsNeedingMigration.has(clientId)) {
            clientsNeedingMigration.set(clientId, {
              clientId,
              clientName,
              clientCode: sig.insurance_cases.clients.client_code,
              email: sig.insurance_cases.clients.users.email,
              signatures: []
            });
          }

          clientsNeedingMigration.get(clientId).signatures.push({
            id: sig.id,
            signatureData: sig.signature_data,
            caseNumber: sig.insurance_cases.case_number,
            signedAt: sig.signed_at,
            createdAt: sig.created_at,
            metadata: sig.signature_metadata
          });
        }
      });

      console.log(`📊 ${clientsNeedingMigration.size} clients nécessitent une migration`);

      // 4. Migrer chaque client
      const migrations = [];
      let successCount = 0;
      let errorCount = 0;

      for (const [clientId, clientData] of clientsNeedingMigration) {
        try {
          // Prendre la signature la plus récente
          const mostRecentSignature = clientData.signatures.sort((a, b) =>
            new Date(b.signedAt || b.createdAt).getTime() - new Date(a.signedAt || a.createdAt).getTime()
          )[0];

          const signatureName = `Signature_${clientData.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_Principal`;

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
                migration_reason: 'auto_sync_case_to_client',
                total_case_signatures: clientData.signatures.length
              }
            })
            .select()
            .single();

          if (createError) {
            console.error(`❌ Erreur création signature pour ${clientData.clientName}:`, createError);
            errorCount++;
            migrations.push({
              clientName: clientData.clientName,
              clientId: clientId,
              status: 'error',
              error: createError.message
            });
          } else {
            console.log(`✅ Signature migrée pour ${clientData.clientName}`);
            successCount++;
            migrations.push({
              clientName: clientData.clientName,
              clientId: clientId,
              status: 'success',
              signatureName: signatureName,
              migratedFrom: mostRecentSignature.caseNumber,
              totalCaseSignatures: clientData.signatures.length
            });
          }

        } catch (error) {
          console.error(`❌ Erreur migration ${clientData.clientName}:`, error);
          errorCount++;
          migrations.push({
            clientName: clientData.clientName,
            clientId: clientId,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Migration automatique terminée: ${successCount} succès, ${errorCount} erreurs`,
        successCount,
        errorCount,
        totalClientsAnalyzed: clientsNeedingMigration.size,
        migrations
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Action non reconnue'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Erreur migration:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
