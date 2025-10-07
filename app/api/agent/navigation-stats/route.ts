import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Récupération statistiques navigation (version simplifiée)...');

    // 1. Récupérer tous les dossiers avec requête simple
    const { data: cases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, status, created_at, completed_at, client_id')
      .order('created_at', { ascending: false });

    if (casesError) {
      console.error('❌ Erreur récupération dossiers:', casesError);
      return NextResponse.json({
        success: false,
        error: `Erreur récupération dossiers: ${casesError.message}`,
        details: casesError
      }, { status: 500 });
    }

    console.log(`✅ ${cases?.length || 0} dossiers récupérés`);

    // 2. Récupérer les clients avec requête simple
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.warn('⚠️ Erreur récupération clients:', clientsError);
      // Continuer sans les clients
    }

    console.log(`✅ ${clients?.length || 0} clients récupérés`);

    // 3. Récupérer les signatures (optionnel)
    const { data: signatures, error: signaturesError } = await supabaseAdmin
      .from('signatures')
      .select('id, case_id, signed_at, is_valid')
      .order('signed_at', { ascending: false });

    if (signaturesError) {
      console.warn('⚠️ Erreur récupération signatures:', signaturesError);
      // Continuer sans les signatures
    }

    console.log(`✅ ${signatures?.length || 0} signatures récupérées`);

    // 4. Calculer les statistiques
    const totalCases = cases?.length || 0;
    const totalClients = clients?.length || 0;
    const totalSignatures = signatures?.length || 0;

    // Statistiques par statut
    const casesByStatus = {
      draft: cases?.filter(c => c.status === 'draft').length || 0,
      email_sent: cases?.filter(c => c.status === 'email_sent').length || 0,
      documents_uploaded: cases?.filter(c => c.status === 'documents_uploaded').length || 0,
      signed: cases?.filter(c => c.status === 'signed').length || 0,
      completed: cases?.filter(c => c.status === 'completed').length || 0,
      validated: cases?.filter(c => c.status === 'validated').length || 0
    };

    // Dossiers en attente (email envoyé mais pas encore de documents)
    const pendingCases = casesByStatus.email_sent;

    // Dossiers archivés (terminés depuis plus de 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const archivedCases = cases?.filter(c => 
      c.status === 'completed' && 
      c.completed_at && 
      new Date(c.completed_at) < thirtyDaysAgo
    ).length || 0;

    // 5. Statistiques détaillées pour la navigation
    const navigationStats = {
      // Compteurs principaux
      total: totalCases,
      clients: totalClients,
      pending: pendingCases,
      completed: casesByStatus.completed,
      archive: archivedCases,

      // Détail par statut
      draft: casesByStatus.draft,
      email_sent: casesByStatus.email_sent,
      documents_uploaded: casesByStatus.documents_uploaded,
      signed: casesByStatus.signed,
      validated: casesByStatus.validated,

      // Métriques additionnelles
      signatures: totalSignatures,
      validSignatures: signatures?.filter(s => s.is_valid === true).length || 0,
      
      // Activité récente (dernières 24h)
      recentCases: cases?.filter(c => {
        const caseDate = new Date(c.created_at);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return caseDate >= yesterday;
      }).length || 0,

      // Taux de conversion
      conversionRate: totalCases > 0 ? Math.round((casesByStatus.signed / totalCases) * 100) : 0,
      completionRate: totalCases > 0 ? Math.round((casesByStatus.completed / totalCases) * 100) : 0
    };

    console.log('✅ Statistiques navigation calculées:', {
      total: navigationStats.total,
      clients: navigationStats.clients,
      pending: navigationStats.pending,
      completed: navigationStats.completed
    });

    return NextResponse.json({
      success: true,
      stats: navigationStats,
      generatedAt: new Date().toISOString(),
      dataSource: 'database'
    });

  } catch (error) {
    console.error('❌ Erreur API navigation stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors du calcul des statistiques',
      details: error.message
    }, { status: 500 });
  }
}

// Endpoint POST pour forcer le rafraîchissement des statistiques
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Rafraîchissement forcé des statistiques navigation...');
    
    // Réutiliser la logique GET
    const getResponse = await GET(request);
    const data = await getResponse.json();
    
    if (data.success) {
      return NextResponse.json({
        success: true,
        message: 'Statistiques rafraîchies avec succès',
        stats: data.stats,
        refreshedAt: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du rafraîchissement'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur rafraîchissement stats navigation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors du rafraîchissement'
    }, { status: 500 });
  }
}
