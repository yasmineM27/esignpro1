import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('👥 Récupération clients agent:', { status, limit, offset });

    // Récupérer tous les dossiers avec clients et signatures
    const { data: cases, error } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        status,
        secure_token,
        insurance_company,
        policy_type,
        policy_number,
        termination_date,
        reason_for_termination,
        created_at,
        completed_at,
        updated_at,
        clients!inner(
          id,
          client_code,
          users!inner(
            id,
            first_name,
            last_name,
            email,
            phone,
            created_at
          )
        ),
        signatures(
          id,
          signed_at,
          is_valid
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des clients'
      }, { status: 500 });
    }

    console.log(`✅ ${cases?.length || 0} dossier(s) récupéré(s) de la base`);

    // Récupérer toutes les signatures clients pour déterminer qui a signé
    const clientIds = [...new Set(cases?.map(c => c.clients?.id).filter(Boolean))];
    const clientSignatures = new Map();

    if (clientIds.length > 0) {
      const { data: signatures } = await supabaseAdmin
        .from('client_signatures')
        .select('client_id, is_active')
        .in('client_id', clientIds)
        .eq('is_active', true);

      signatures?.forEach(sig => {
        clientSignatures.set(sig.client_id, true);
      });

      console.log(`🔍 ${signatures?.length || 0} signature(s) client(s) trouvée(s)`);
    }

    // Formater chaque dossier comme un "client" (un client peut avoir plusieurs entrées)
    const clients = cases?.map(caseItem => {
      if (!caseItem.clients || !caseItem.clients.users) {
        console.warn('⚠️ Dossier sans client/utilisateur:', caseItem.id);
        return null;
      }

      // LOGIQUE SIGNATURE GLOBALE : Si le client a une signature active dans client_signatures,
      // alors TOUS ses dossiers sont considérés comme "signés"
      const clientHasGlobalSignature = clientSignatures.has(caseItem.clients.id);

      return {
        // Informations client (identiques pour tous les dossiers du même client)
        id: caseItem.clients.id,
        userId: caseItem.clients.users.id,
        firstName: caseItem.clients.users.first_name,
        lastName: caseItem.clients.users.last_name,
        fullName: `${caseItem.clients.users.first_name} ${caseItem.clients.users.last_name}`,
        email: caseItem.clients.users.email,
        phone: caseItem.clients.users.phone,
        address: '',
        clientCreatedAt: caseItem.clients.users.created_at,

        // Informations du dossier spécifique
        caseId: caseItem.id,
        caseNumber: caseItem.case_number,
        caseStatus: caseItem.status,
        secureToken: caseItem.secure_token,
        insuranceCompany: caseItem.insurance_company,
        policyType: caseItem.policy_type,
        policyNumber: caseItem.policy_number,
        terminationDate: caseItem.termination_date,
        reasonForTermination: caseItem.reason_for_termination,
        caseCreatedAt: caseItem.created_at,
        caseCompletedAt: caseItem.completed_at,
        caseUpdatedAt: caseItem.updated_at,

        // SIGNATURE GLOBALE : Basée sur client_signatures, pas sur signatures du dossier
        hasSignature: clientHasGlobalSignature,
        signature: clientHasGlobalSignature ? { isGlobal: true } : null,

        // Statut global
        overallStatus: caseItem.status,

        // Portal URL (unique par dossier)
        portalUrl: `/client-portal/${caseItem.secure_token}`,

        // Temps écoulé
        daysSinceCreated: Math.floor((new Date().getTime() - new Date(caseItem.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        daysSinceUpdated: Math.floor((new Date().getTime() - new Date(caseItem.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      };
    }).filter(Boolean) || []; // Supprimer les entrées null

    // Calculer les statistiques
    const stats = {
      total: clients.length,
      pending: clients.filter(c => ['email_sent', 'documents_uploaded'].includes(c.caseStatus)).length,
      active: clients.filter(c => ['email_sent', 'documents_uploaded', 'signed'].includes(c.caseStatus)).length,
      completed: clients.filter(c => ['completed', 'validated'].includes(c.caseStatus)).length,
      withSignature: clients.filter(c => c.hasSignature).length
    };

    console.log(`✅ ${clients.length} client(s) récupéré(s)`);

    return NextResponse.json({
      success: true,
      clients,
      stats,
      pagination: {
        offset,
        limit,
        total: clients.length
      }
    });

  } catch (error) {
    console.error('💥 Erreur API clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la récupération des clients',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
