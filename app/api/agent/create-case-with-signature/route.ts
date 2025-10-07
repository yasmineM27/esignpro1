import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      clientId, 
      clientData, 
      autoApplySignature = true,
      agentId = '550e8400-e29b-41d4-a716-446655440001'
    } = await request.json();

    console.log('🆕 Création dossier avec signature:', {
      clientId,
      autoApplySignature,
      clientName: clientData?.nomPrenom
    });

    if (!clientId || !clientData) {
      return NextResponse.json({
        success: false,
        error: 'clientId et clientData requis'
      }, { status: 400 });
    }

    // 1. Vérifier que le client existe et a une signature si demandé
    const { data: clientInfo, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        users!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !clientInfo) {
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // 2. Vérifier la signature si demandée
    let hasSignature = false;
    if (autoApplySignature) {
      // D'abord essayer avec is_default = true
      let { data: signature, error: sigError } = await supabaseAdmin
        .from('client_signatures')
        .select('id, signature_name')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      // Si pas de signature par défaut, prendre la première signature active
      if (sigError || !signature) {
        console.log('⚠️ Pas de signature par défaut, recherche signature active...');
        const { data: signatures, error: sigError2 } = await supabaseAdmin
          .from('client_signatures')
          .select('id, signature_name')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .limit(1);

        if (!sigError2 && signatures && signatures.length > 0) {
          signature = signatures[0];
          console.log('✅ Signature active trouvée:', signature.signature_name);
        }
      }

      hasSignature = !!signature;

      if (!hasSignature) {
        console.warn('⚠️ Aucune signature trouvée pour client:', clientId);
        return NextResponse.json({
          success: false,
          error: 'Aucune signature disponible pour ce client'
        }, { status: 400 });
      }

      console.log('✅ Signature trouvée pour client:', clientId, signature.signature_name);
    }

    // 3. Générer un numéro de dossier unique
    const timestamp = Date.now();
    const caseNumber = `RES-${new Date().getFullYear()}-${timestamp}`;
    const secureToken = `SECURE_${timestamp}_${Math.random().toString(36).substring(2, 15)}`;

    // 4. Créer le dossier
    const { data: newCase, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .insert({
        case_number: caseNumber,
        client_id: clientId,
        agent_id: agentId,
        status: hasSignature ? 'signed' : 'pending',
        insurance_company: 'Compagnie par défaut',
        policy_type: 'Assurance générale',
        policy_number: `POL-${timestamp}`,
        incident_date: new Date().toISOString().split('T')[0],
        incident_description: 'Dossier créé automatiquement avec signature',
        secure_token: secureToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(hasSignature && {
          completed_at: new Date().toISOString(),
          signature_data: {
            auto_applied: true,
            applied_at: new Date().toISOString(),
            client_name: clientInfo.users.first_name + ' ' + clientInfo.users.last_name
          }
        })
      })
      .select()
      .single();

    if (caseError) {
      console.error('❌ Erreur création dossier:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création du dossier'
      }, { status: 500 });
    }

    console.log('✅ Dossier créé:', newCase.id, 'Numéro:', caseNumber);

    // 5. Si signature automatique, créer l'entrée dans la table signatures
    if (hasSignature && autoApplySignature) {
      try {
        // Récupérer la signature du client (même logique que la vérification)
        let { data: clientSignature, error: sigDataError } = await supabaseAdmin
          .from('client_signatures')
          .select('signature_data, signature_name')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .eq('is_default', true)
          .single();

        // Si pas de signature par défaut, prendre la première signature active
        if (sigDataError || !clientSignature) {
          const { data: signatures, error: sigError2 } = await supabaseAdmin
            .from('client_signatures')
            .select('signature_data, signature_name')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .limit(1);

          if (!sigError2 && signatures && signatures.length > 0) {
            clientSignature = signatures[0];
          }
        }

        if (clientSignature) {
          // Créer l'entrée dans la table signatures pour compatibilité
          const { data: signatureEntry, error: sigEntryError } = await supabaseAdmin
            .from('signatures')
            .insert({
              case_id: newCase.id,
              signature_data: clientSignature.signature_data,
              signature_metadata: {
                auto_applied: true,
                source: 'client_signatures',
                signature_name: clientSignature.signature_name,
                applied_by: 'system'
              },
              signed_at: new Date().toISOString(),
              is_valid: true
            })
            .select()
            .single();

          if (sigEntryError) {
            console.warn('⚠️ Erreur création entrée signature:', sigEntryError);
          } else {
            console.log('✅ Signature automatiquement appliquée:', signatureEntry.id);
          }
        }
      } catch (sigError) {
        console.warn('⚠️ Erreur application signature automatique:', sigError);
      }
    }

    // 6. Créer les documents par défaut si nécessaire
    try {
      // Ici on pourrait générer automatiquement les documents Word avec signature
      // Pour l'instant, on se contente de créer le dossier
    } catch (docError) {
      console.warn('⚠️ Erreur génération documents:', docError);
    }

    return NextResponse.json({
      success: true,
      message: `Dossier ${caseNumber} créé avec succès${hasSignature ? ' avec signature automatique' : ''}`,
      caseId: newCase.id,
      caseNumber: caseNumber,
      secureToken: secureToken,
      status: newCase.status,
      hasSignature: hasSignature,
      clientName: `${clientInfo.users.first_name} ${clientInfo.users.last_name}`,
      createdAt: newCase.created_at
    });

  } catch (error) {
    console.error('❌ Erreur création dossier avec signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la création du dossier'
    }, { status: 500 });
  }
}

// Endpoint GET pour vérifier les prérequis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'clientId requis'
      }, { status: 400 });
    }

    // Vérifier le client et sa signature
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        users!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // Vérifier la signature
    const { data: signature, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select('id, signature_name, created_at')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    const hasSignature = !sigError && !!signature;

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: `${client.users.first_name} ${client.users.last_name}`,
        email: client.users.email,
        code: client.client_code
      },
      hasSignature: hasSignature,
      signature: hasSignature ? {
        name: signature.signature_name,
        createdAt: signature.created_at
      } : null,
      canCreateWithSignature: hasSignature
    });

  } catch (error) {
    console.error('❌ Erreur vérification prérequis:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
