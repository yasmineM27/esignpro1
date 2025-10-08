import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientData, includeSignature = true } = await request.json();

    console.log('📁 Création dossier réel:', {
      clientId,
      clientName: clientData?.nomPrenom,
      includeSignature
    });

    // 1. Vérifier que le client existe
    const { data: clientInfo, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        users!inner(
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !clientInfo) {
      console.error('❌ Client non trouvé:', clientError?.message);
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // 2. Générer un numéro de dossier unique
    const caseNumber = `RES-${new Date().getFullYear()}-${Date.now()}`;
    const secureToken = `token-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // 3. Récupérer un agent valide
    const { data: validAgent } = await supabaseAdmin
      .from('agents')
      .select('id')
      .limit(1)
      .single();

    if (!validAgent) {
      console.error('❌ Aucun agent trouvé dans la base');
      return NextResponse.json({
        success: false,
        error: 'Aucun agent disponible'
      }, { status: 500 });
    }

    // 4. Créer le dossier d'assurance
    const { data: newCase, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .insert([{
        case_number: caseNumber,
        client_id: clientId,
        agent_id: validAgent.id, // Agent valide de la DB
        secure_token: secureToken,
        status: includeSignature ? 'signed' : 'draft',
        insurance_company: clientData?.compagnieAssurance || 'Non spécifiée',
        policy_type: 'Résiliation',
        policy_number: clientData?.numeroPolice || `POL-${Date.now()}`,
        termination_date: clientData?.dateResiliation || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason_for_termination: clientData?.motifResiliation || 'Demande client',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: includeSignature ? new Date().toISOString() : null
      }])
      .select()
      .single();

    if (caseError) {
      console.error('❌ Erreur création dossier:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création du dossier',
        details: caseError.message
      }, { status: 500 });
    }

    console.log('✅ Dossier créé:', {
      id: newCase.id,
      caseNumber: newCase.case_number,
      status: newCase.status
    });

    // 4. Si signature demandée, créer l'enregistrement de signature
    let signatureRecord = null;
    if (includeSignature) {
      // Récupérer la signature du client
      const { data: clientSignature, error: sigError } = await supabaseAdmin
        .from('client_signatures')
        .select('id, signature_data, signature_name')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)
        .single();

      if (clientSignature && !sigError) {
        // Créer l'enregistrement de signature pour ce dossier
        const { data: signature, error: signatureError } = await supabaseAdmin
          .from('signatures')
          .insert([{
            case_id: newCase.id,
            signer_id: clientInfo.users.id,
            signature_data: clientSignature.signature_data,
            signature_metadata: {
              signature_name: clientSignature.signature_name,
              applied_at: new Date().toISOString(),
              applied_by: 'agent'
            },
            signed_at: new Date().toISOString(),
            is_valid: true
          }])
          .select()
          .single();

        if (!signatureError) {
          signatureRecord = signature;
          console.log('✅ Signature appliquée au dossier');
        } else {
          console.warn('⚠️ Erreur application signature:', signatureError);
        }
      } else {
        console.warn('⚠️ Aucune signature trouvée pour le client');
      }
    }

    // 5. Préparer la réponse complète
    const response = {
      success: true,
      message: `Dossier ${caseNumber} créé avec succès`,
      case: {
        id: newCase.id,
        caseNumber: newCase.case_number,
        secureToken: newCase.secure_token,
        status: newCase.status,
        insuranceCompany: newCase.insurance_company,
        policyType: newCase.policy_type,
        policyNumber: newCase.policy_number,
        terminationDate: newCase.termination_date,
        reasonForTermination: newCase.reason_for_termination,
        createdAt: newCase.created_at,
        completedAt: newCase.completed_at,
        expiresAt: newCase.expires_at,
        portalUrl: `/signature/${newCase.secure_token}`
      },
      client: {
        id: clientInfo.id,
        clientCode: clientInfo.client_code,
        fullName: `${clientInfo.users.first_name} ${clientInfo.users.last_name}`,
        email: clientInfo.users.email,
        phone: clientInfo.users.phone
      },
      signature: signatureRecord ? {
        id: signatureRecord.id,
        applied: true,
        signedAt: signatureRecord.signed_at
      } : null
    };

    console.log('🎉 Dossier complet créé avec succès');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erreur création dossier réel:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la création du dossier',
      details: error.message
    }, { status: 500 });
  }
}
