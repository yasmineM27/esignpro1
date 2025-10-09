import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Récupérer la signature d'un client via le token du dossier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token requis'
      }, { status: 400 });
    }

    console.log('🔍 Récupération signature client pour token:', token);

    // Récupérer le client_id à partir du token du dossier
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('client_id')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Erreur récupération dossier:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    // Récupérer la signature active du client
    const { data: signature, error: signatureError } = await supabaseAdmin
      .from('client_signatures')
      .select('*')
      .eq('client_id', caseData.client_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (signatureError && signatureError.code !== 'PGRST116') {
      console.error('❌ Erreur récupération signature:', signatureError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération de la signature'
      }, { status: 500 });
    }

    if (signature) {
      console.log(`✅ Signature trouvée pour client ${caseData.client_id}:`, {
        id: signature.id,
        signature_name: signature.signature_name,
        created_at: signature.created_at,
        is_active: signature.is_active,
        signature_data_length: signature.signature_data?.length || 0,
        signature_data_preview: signature.signature_data?.substring(0, 50) + '...'
      });
    } else {
      console.log(`✅ Signature non trouvée pour client ${caseData.client_id}`);
    }

    return NextResponse.json({
      success: true,
      signature: signature || null
    });

  } catch (error) {
    console.error('💥 Erreur API signature client:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

// POST - Créer ou mettre à jour une signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signatureData, signatureName } = body;

    if (!token || !signatureData) {
      return NextResponse.json({
        success: false,
        error: 'Token et données de signature requis'
      }, { status: 400 });
    }

    console.log('📝 Création/mise à jour signature pour token:', token);

    // Récupérer le client_id à partir du token du dossier
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('client_id, clients!inner(users!inner(first_name, last_name, email))')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Erreur récupération dossier:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    const clientId = caseData.client_id;

    // Désactiver toutes les signatures existantes du client
    await supabaseAdmin
      .from('client_signatures')
      .update({ is_active: false })
      .eq('client_id', clientId);

    // Créer la nouvelle signature
    const { data: newSignature, error: createError } = await supabaseAdmin
      .from('client_signatures')
      .insert([{
        client_id: clientId,
        signature_data: signatureData,
        signature_name: signatureName || 'Signature principale',
        is_active: true,
        is_default: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création signature:', createError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création de la signature'
      }, { status: 500 });
    }

    // Mettre à jour le statut du client
    await supabaseAdmin
      .from('clients')
      .update({ 
        has_signature: true,
        signature_count: 1
      })
      .eq('id', clientId);

    console.log('✅ Signature créée avec succès pour client:', clientId);

    return NextResponse.json({
      success: true,
      signature: newSignature,
      message: 'Signature créée avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur création signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

// DELETE - Supprimer une signature
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { signatureId, token } = body;

    if (!signatureId || !token) {
      return NextResponse.json({
        success: false,
        error: 'ID de signature et token requis'
      }, { status: 400 });
    }

    console.log('🗑️ Suppression signature:', signatureId);

    // Vérifier que la signature appartient au bon client
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('client_id')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    // Vérifier que la signature appartient au client
    const { data: signature, error: signatureError } = await supabaseAdmin
      .from('client_signatures')
      .select('client_id')
      .eq('id', signatureId)
      .eq('client_id', caseData.client_id)
      .single();

    if (signatureError || !signature) {
      return NextResponse.json({
        success: false,
        error: 'Signature non trouvée ou non autorisée'
      }, { status: 404 });
    }

    // Supprimer la signature
    const { error: deleteError } = await supabaseAdmin
      .from('client_signatures')
      .delete()
      .eq('id', signatureId);

    if (deleteError) {
      console.error('❌ Erreur suppression signature:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la suppression'
      }, { status: 500 });
    }

    // Vérifier s'il reste des signatures actives pour ce client
    const { data: remainingSignatures } = await supabaseAdmin
      .from('client_signatures')
      .select('id')
      .eq('client_id', caseData.client_id)
      .eq('is_active', true);

    // Mettre à jour le statut du client
    await supabaseAdmin
      .from('clients')
      .update({ 
        has_signature: (remainingSignatures?.length || 0) > 0,
        signature_count: remainingSignatures?.length || 0
      })
      .eq('id', caseData.client_id);

    console.log('✅ Signature supprimée avec succès');

    return NextResponse.json({
      success: true,
      message: 'Signature supprimée avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur suppression signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

// PUT - Mettre à jour une signature existante
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { signatureId, token, signatureData, signatureName } = body;

    if (!signatureId || !token || !signatureData) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres requis manquants'
      }, { status: 400 });
    }

    console.log('✏️ Mise à jour signature:', signatureId);

    // Vérifier l'autorisation
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('client_id')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    // Mettre à jour la signature
    const { data: updatedSignature, error: updateError } = await supabaseAdmin
      .from('client_signatures')
      .update({
        signature_data: signatureData,
        signature_name: signatureName || 'Signature principale',
        updated_at: new Date().toISOString()
      })
      .eq('id', signatureId)
      .eq('client_id', caseData.client_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour signature:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      }, { status: 500 });
    }

    console.log('✅ Signature mise à jour avec succès');

    return NextResponse.json({
      success: true,
      signature: updatedSignature,
      message: 'Signature mise à jour avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur mise à jour signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
