import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API for managing client signatures
 * GET: Retrieve client signatures
 * POST: Save/update client signature
 * DELETE: Deactivate client signature
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const caseId = searchParams.get('caseId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    console.log('🔍 Récupération signatures client:', { clientId, caseId, includeInactive });

    if (!clientId && !caseId) {
      return NextResponse.json({
        success: false,
        error: 'clientId ou caseId requis'
      }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('client_signatures')
      .select(`
        id,
        client_id,
        signature_data,
        signature_name,
        signature_metadata,
        is_active,
        is_default,
        created_at,
        updated_at,
        clients!inner(
          id,
          users!inner(
            first_name,
            last_name,
            email
          )
        )
      `);

    if (clientId) {
      query = query.eq('client_id', clientId);
    } else if (caseId) {
      // Get client_id from case_id first
      const { data: caseData, error: caseError } = await supabaseAdmin
        .from('insurance_cases')
        .select('client_id')
        .eq('id', caseId)
        .single();

      if (caseError || !caseData) {
        return NextResponse.json({
          success: false,
          error: 'Dossier non trouvé'
        }, { status: 404 });
      }

      query = query.eq('client_id', caseData.client_id);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data: signatures, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération signatures:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des signatures'
      }, { status: 500 });
    }

    console.log(`✅ ${signatures?.length || 0} signature(s) récupérée(s)`);

    return NextResponse.json({
      success: true,
      signatures: signatures || [],
      count: signatures?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur API signatures:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      clientId, 
      signatureData, 
      signatureName = 'Signature principale',
      isDefault = true,
      caseId,
      metadata = {}
    } = await request.json();

    console.log('💾 Sauvegarde signature client:', { 
      clientId, 
      signatureName, 
      isDefault, 
      caseId,
      signatureLength: signatureData?.length 
    });

    if (!clientId || !signatureData) {
      return NextResponse.json({
        success: false,
        error: 'clientId et signatureData requis'
      }, { status: 400 });
    }

    // Vérifier que le client existe
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        users!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error('❌ Client non trouvé:', clientError);
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // Si c'est la signature par défaut, désactiver les autres signatures par défaut
    if (isDefault) {
      await supabaseAdmin
        .from('client_signatures')
        .update({ is_default: false })
        .eq('client_id', clientId)
        .eq('is_default', true);
    }

    // Préparer les métadonnées
    const signatureMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      client_name: `${clientData.users.first_name} ${clientData.users.last_name}`,
      case_id: caseId || null,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    };

    // Sauvegarder la signature
    const { data: signatureResult, error: signatureError } = await supabaseAdmin
      .from('client_signatures')
      .insert([{
        client_id: clientId,
        signature_data: signatureData,
        signature_name: signatureName,
        signature_metadata: signatureMetadata,
        is_active: true,
        is_default: isDefault
      }])
      .select()
      .single();

    if (signatureError) {
      console.error('❌ Erreur sauvegarde signature:', signatureError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la sauvegarde de la signature'
      }, { status: 500 });
    }

    // Mettre à jour le statut du client (has_signature sera mis à jour par le trigger)
    await supabaseAdmin
      .from('clients')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', clientId);

    console.log('✅ Signature sauvegardée avec succès:', signatureResult.id);

    return NextResponse.json({
      success: true,
      signature: signatureResult,
      message: 'Signature sauvegardée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la sauvegarde'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { signatureId, signatureName, isDefault, isActive } = await request.json();

    console.log('🔄 Mise à jour signature:', { signatureId, signatureName, isDefault, isActive });

    if (!signatureId) {
      return NextResponse.json({
        success: false,
        error: 'signatureId requis'
      }, { status: 400 });
    }

    // Récupérer la signature existante
    const { data: existingSignature, error: fetchError } = await supabaseAdmin
      .from('client_signatures')
      .select('client_id, is_default')
      .eq('id', signatureId)
      .single();

    if (fetchError || !existingSignature) {
      return NextResponse.json({
        success: false,
        error: 'Signature non trouvée'
      }, { status: 404 });
    }

    // Si on définit cette signature comme par défaut, désactiver les autres
    if (isDefault && !existingSignature.is_default) {
      await supabaseAdmin
        .from('client_signatures')
        .update({ is_default: false })
        .eq('client_id', existingSignature.client_id)
        .eq('is_default', true);
    }

    // Mettre à jour la signature
    const updateData: any = { updated_at: new Date().toISOString() };
    if (signatureName !== undefined) updateData.signature_name = signatureName;
    if (isDefault !== undefined) updateData.is_default = isDefault;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: updatedSignature, error: updateError } = await supabaseAdmin
      .from('client_signatures')
      .update(updateData)
      .eq('id', signatureId)
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
    console.error('❌ Erreur mise à jour signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signatureId = searchParams.get('signatureId');

    console.log('🗑️ Suppression signature:', { signatureId });

    if (!signatureId) {
      return NextResponse.json({
        success: false,
        error: 'signatureId requis'
      }, { status: 400 });
    }

    // Désactiver la signature au lieu de la supprimer (pour l'audit)
    const { error: deleteError } = await supabaseAdmin
      .from('client_signatures')
      .update({ 
        is_active: false, 
        is_default: false,
        updated_at: new Date().toISOString() 
      })
      .eq('id', signatureId);

    if (deleteError) {
      console.error('❌ Erreur suppression signature:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la suppression'
      }, { status: 500 });
    }

    console.log('✅ Signature désactivée avec succès');

    return NextResponse.json({
      success: true,
      message: 'Signature supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
