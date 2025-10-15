import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API Finalize - Début traitement');

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token manquant'
      }, { status: 400 });
    }

    // Vérifier que le dossier existe
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, status')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Token invalide:', token);
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    console.log('✅ Dossier trouvé:', caseData.case_number);

    // Vérifier que les documents requis sont uploadés
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('client_documents')
      .select('documenttype')
      .eq('token', token);

    if (docsError) {
      console.error('❌ Erreur récupération documents:', docsError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des documents'
      }, { status: 500 });
    }

    const requiredTypes = ['identity_front', 'identity_back'];
    const uploadedTypes = documents?.map(doc => doc.documenttype) || [];
    const missingRequired = requiredTypes.filter(type => !uploadedTypes.includes(type));

    if (missingRequired.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Documents requis manquants: ${missingRequired.join(', ')}`
      }, { status: 400 });
    }

    console.log('✅ Tous les documents requis sont présents');

    // Mettre à jour le statut du dossier
    const { error: updateError } = await supabaseAdmin
      .from('insurance_cases')
      .update({
        status: 'documents_uploaded',
        updated_at: new Date().toISOString()
      })
      .eq('id', caseData.id);

    if (updateError) {
      console.error('❌ Erreur mise à jour statut:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la finalisation'
      }, { status: 500 });
    }

    console.log('✅ Dossier finalisé avec succès');

    return NextResponse.json({
      success: true,
      message: 'Dossier finalisé avec succès ! Vous pouvez maintenant procéder à la signature.'
    });

  } catch (error) {
    console.error('❌ Erreur API Finalize:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
