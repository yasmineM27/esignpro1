import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { caseId, status, reason } = await request.json();

    console.log('🔄 Mise à jour statut dossier:', {
      caseId,
      status,
      reason
    });

    // Vérifier que le dossier existe
    const { data: existingCase, error: fetchError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, status, client_id')
      .eq('id', caseId)
      .single();

    if (fetchError || !existingCase) {
      console.error('❌ Dossier non trouvé:', fetchError?.message);
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // Si le statut devient "signed", marquer comme complété
    if (status === 'signed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Mettre à jour le dossier
    const { data: updatedCase, error: updateError } = await supabaseAdmin
      .from('insurance_cases')
      .update(updateData)
      .eq('id', caseId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour du dossier',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Dossier mis à jour:', {
      id: updatedCase.id,
      caseNumber: updatedCase.case_number,
      oldStatus: existingCase.status,
      newStatus: updatedCase.status
    });

    return NextResponse.json({
      success: true,
      message: `Statut du dossier ${updatedCase.case_number} mis à jour de "${existingCase.status}" vers "${updatedCase.status}"`,
      case: {
        id: updatedCase.id,
        caseNumber: updatedCase.case_number,
        status: updatedCase.status,
        updatedAt: updatedCase.updated_at,
        completedAt: updatedCase.completed_at
      },
      previousStatus: existingCase.status
    });

  } catch (error) {
    console.error('💥 Erreur API update-case-status:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du statut',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// API pour mettre à jour en masse les dossiers avec signatures
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Mise à jour en masse des statuts...');

    // Récupérer tous les dossiers avec signatures mais statut draft
    const { data: casesWithSignatures, error: fetchError } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        status,
        signatures!inner(id, signed_at, is_valid)
      `)
      .eq('status', 'draft')
      .eq('signatures.is_valid', true);

    if (fetchError) {
      console.error('❌ Erreur récupération dossiers:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des dossiers'
      }, { status: 500 });
    }

    if (!casesWithSignatures || casesWithSignatures.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun dossier à mettre à jour',
        updated: 0
      });
    }

    console.log(`📝 ${casesWithSignatures.length} dossier(s) à mettre à jour`);

    // Mettre à jour tous les dossiers en une seule requête
    const caseIds = casesWithSignatures.map(c => c.id);
    const { data: updatedCases, error: updateError } = await supabaseAdmin
      .from('insurance_cases')
      .update({
        status: 'signed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', caseIds)
      .select('id, case_number, status');

    if (updateError) {
      console.error('❌ Erreur mise à jour en masse:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour en masse'
      }, { status: 500 });
    }

    console.log(`✅ ${updatedCases?.length || 0} dossier(s) mis à jour vers "signed"`);

    return NextResponse.json({
      success: true,
      message: `${updatedCases?.length || 0} dossier(s) mis à jour de "draft" vers "signed"`,
      updated: updatedCases?.length || 0,
      cases: updatedCases?.map(c => ({
        id: c.id,
        caseNumber: c.case_number,
        status: c.status
      }))
    });

  } catch (error) {
    console.error('💥 Erreur API update-case-status (bulk):', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour en masse',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
