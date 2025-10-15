import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Completed Cases - Récupération des dossiers terminés');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Version simplifiée pour éviter les erreurs de fetch
    console.log('📊 Tentative de récupération des dossiers terminés...');

    const { data: completedCases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        status,
        secure_token,
        created_at,
        completed_at,
        client_id
      `)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (casesError) {
      console.error('❌ Erreur Supabase cases:', casesError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des dossiers'
      }, { status: 500 });
    }

    console.log(`✅ ${completedCases?.length || 0} dossiers terminés récupérés`);

    // Récupérer les clients séparément pour éviter les erreurs de jointure
    const clientIds = completedCases?.map(c => c.client_id).filter(Boolean) || [];

    let clientsData = [];
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from('clients')
        .select(`
          id,
          has_signature,
          user_id
        `)
        .in('id', clientIds);

      if (clientsError) {
        console.error('❌ Erreur clients:', clientsError);
      } else {
        clientsData = clients || [];
        console.log(`✅ ${clientsData.length} clients récupérés`);
      }
    }

    // Récupérer les utilisateurs séparément
    const userIds = clientsData.map(c => c.user_id).filter(Boolean);
    let usersData = [];

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone
        `)
        .in('id', userIds);

      if (usersError) {
        console.error('❌ Erreur users:', usersError);
      } else {
        usersData = users || [];
        console.log(`✅ ${usersData.length} utilisateurs récupérés`);
      }
    }

    // Récupérer les signatures des clients qui en ont
    let clientSignaturesData: any[] = [];
    const clientsWithSignatures = clientsData?.filter(c => c.has_signature) || [];

    if (clientsWithSignatures.length > 0) {
      const clientIds = clientsWithSignatures.map(c => c.id);
      const { data: clientSignatures, error: sigError } = await supabaseAdmin
        .from('client_signatures')
        .select('id, client_id, signature_data, signature_name, created_at, is_active, is_default')
        .in('client_id', clientIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!sigError && clientSignatures) {
        clientSignaturesData = clientSignatures;
        console.log(`✅ ${clientSignatures.length} signatures clients récupérées`);
      }
    }

    // Construire les données finales avec les vraies signatures
    const casesWithSignatureData = (completedCases || []).map(caseItem => {
      // Trouver le client correspondant
      const client = clientsData.find(c => c.id === caseItem.client_id);
      const user = client ? usersData.find(u => u.id === client.user_id) : null;

      // Trouver la signature correspondante (par client, pas par cas)
      const clientSignature = clientSignaturesData.find(s => s.client_id === client?.id);

      return {
        id: caseItem.id,
        caseNumber: caseItem.case_number,
        status: caseItem.status,
        secureToken: caseItem.secure_token,
        createdAt: caseItem.created_at,
        completedAt: caseItem.completed_at,
        client: {
          id: client?.id || 'unknown',
          firstName: user?.first_name || 'Prénom',
          lastName: user?.last_name || 'Nom',
          fullName: `${user?.first_name || 'Prénom'} ${user?.last_name || 'Nom'}`,
          email: user?.email || 'email@example.com',
          phone: user?.phone || ''
        },
        signature: clientSignature ? {
          id: clientSignature.id,
          signedAt: clientSignature.created_at,
          signatureData: clientSignature.signature_data,
          signatureName: clientSignature.signature_name,
          isValid: true, // Les signatures clients sont considérées comme valides
          isDefault: clientSignature.is_default
        } : null,
        hasSignature: client?.has_signature || false
      };
    });

    // Calculer les statistiques
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: casesWithSignatureData.length,
      thisWeek: casesWithSignatureData.filter(c => new Date(c.completedAt) >= weekAgo).length,
      thisMonth: casesWithSignatureData.filter(c => new Date(c.completedAt) >= monthAgo).length,
      validSignatures: casesWithSignatureData.filter(c => c.hasSignature).length,
      averageTime: casesWithSignatureData.length > 0
        ? Math.round(casesWithSignatureData.reduce((sum, c) => {
            const created = new Date(c.createdAt);
            const completed = new Date(c.completedAt);
            const days = Math.floor((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / casesWithSignatureData.length)
        : 0
    };

    console.log('📊 Statistiques calculées:', stats);

    // Debug: vérifier les données client
    completedCases.forEach((caseItem, index) => {
      if (!caseItem.client || !caseItem.client.firstName || !caseItem.client.lastName) {
        console.warn(`⚠️ Données client incomplètes pour dossier ${caseItem.caseNumber}:`, {
          clientExists: !!caseItem.client,
          clientId: caseItem.client?.id,
          firstName: caseItem.client?.firstName,
          lastName: caseItem.client?.lastName,
          fullName: caseItem.client?.fullName
        });
      }
    });

    return NextResponse.json({
      success: true,
      cases: casesWithSignatureData,
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
