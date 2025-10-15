import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Completed Cases - Récupération des dossiers terminés');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Récupérer tous les dossiers avec statut 'completed'
    const { data: completedCases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        status,
        secure_token,
        created_at,
        completed_at,
        client_id,
        clients!inner(
          id,
          has_signature,
          users!inner(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (casesError) {
      console.error('❌ Erreur récupération dossiers:', casesError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des dossiers'
      }, { status: 500 });
    }

    console.log(`📊 ${completedCases?.length || 0} dossiers terminés trouvés`);

    // Pour chaque dossier, récupérer la signature du client
    const casesWithSignatures = await Promise.all(
      (completedCases || []).map(async (caseItem) => {
        // Récupérer la signature active du client
        const { data: signature, error: sigError } = await supabaseAdmin
          .from('client_signatures')
          .select('*')
          .eq('client_id', caseItem.client_id)
          .eq('is_active', true)
          .single();

        if (sigError && sigError.code !== 'PGRST116') {
          console.error(`❌ Erreur signature client ${caseItem.client_id}:`, sigError);
        }

        return {
          id: caseItem.id,
          caseNumber: caseItem.case_number,
          status: caseItem.status,
          secureToken: caseItem.secure_token,
          createdAt: caseItem.created_at,
          completedAt: caseItem.completed_at,
          client: {
            id: caseItem.clients.id,
            firstName: caseItem.clients.users.first_name,
            lastName: caseItem.clients.users.last_name,
            fullName: `${caseItem.clients.users.first_name} ${caseItem.clients.users.last_name}`,
            email: caseItem.clients.users.email,
            phone: caseItem.clients.users.phone || ''
          },
          signature: signature ? {
            id: signature.id,
            signatureData: signature.signature_data,
            signatureName: signature.signature_name,
            signedAt: signature.created_at,
            isValid: signature.is_active,
            isDefault: signature.is_default
          } : null,
          hasSignature: !!signature
        };
      })
    );

    // Calculer les statistiques
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: casesWithSignatures.length,
      thisWeek: casesWithSignatures.filter(c => new Date(c.completedAt) >= weekAgo).length,
      thisMonth: casesWithSignatures.filter(c => new Date(c.completedAt) >= monthAgo).length,
      validSignatures: casesWithSignatures.filter(c => c.hasSignature).length,
      averageTime: casesWithSignatures.length > 0 
        ? Math.round(casesWithSignatures.reduce((sum, c) => {
            const created = new Date(c.createdAt);
            const completed = new Date(c.completedAt);
            const days = Math.floor((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / casesWithSignatures.length)
        : 0
    };

    console.log('📊 Statistiques calculées:', stats);

    return NextResponse.json({
      success: true,
      cases: casesWithSignatures,
      stats
    });

  } catch (error) {
    console.error('❌ Erreur API Completed Cases:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
