import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API Apply Signature - Début traitement');

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token manquant'
      }, { status: 400 });
    }

    // 1. Récupérer les données du dossier
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, client_id')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Dossier non trouvé:', token);
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    console.log('✅ Dossier trouvé:', caseData.case_number);

    // 2. Récupérer les informations du client
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('id', caseData.client_id)
      .single();

    if (clientError || !clientData) {
      console.error('❌ Client non trouvé');
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // 3. Récupérer le nom du client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name')
      .eq('id', clientData.user_id)
      .single();

    if (userError || !userData) {
      console.error('❌ Utilisateur non trouvé');
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    const clientName = `${userData.first_name} ${userData.last_name}`;
    console.log('✅ Client:', clientName);

    // 4. Récupérer la signature active du client
    const { data: signatureData, error: signatureError } = await supabaseAdmin
      .from('client_signatures')
      .select('*')
      .eq('client_id', caseData.client_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (signatureError || !signatureData) {
      console.error('❌ Signature non trouvée');
      return NextResponse.json({
        success: false,
        error: 'Aucune signature active trouvée pour ce client'
      }, { status: 404 });
    }

    console.log('✅ Signature trouvée:', signatureData.signature_name);

    // 5. Mettre à jour le statut du dossier à "signed"
    const timestamp = new Date().toISOString();
    
    const { error: updateCaseError } = await supabaseAdmin
      .from('insurance_cases')
      .update({
        status: 'completed', // Changé de 'signed' à 'completed' pour qu'il apparaisse dans "Terminés"
        completed_at: timestamp,
        updated_at: timestamp
      })
      .eq('id', caseData.id);

    if (updateCaseError) {
      console.error('❌ Erreur mise à jour dossier:', updateCaseError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour du dossier'
      }, { status: 500 });
    }

    // 6. Marquer le client comme ayant une signature
    const { error: updateClientError } = await supabaseAdmin
      .from('clients')
      .update({
        has_signature: true,
        updated_at: timestamp
      })
      .eq('id', caseData.client_id);

    if (updateClientError) {
      console.warn('⚠️ Erreur mise à jour client:', updateClientError);
    }

    console.log('✅ Signature appliquée avec succès au dossier');

    return NextResponse.json({
      success: true,
      message: 'Signature appliquée avec succès',
      data: {
        signedDocuments: 1, // Pour l'instant, on considère qu'on a signé le dossier
        clientName,
        signatureAppliedAt: timestamp,
        caseNumber: caseData.case_number
      }
    });

  } catch (error) {
    console.error('❌ Erreur API Apply Signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
