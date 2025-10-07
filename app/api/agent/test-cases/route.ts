import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TEST - API simplifiée avec données de test...');

    // Retourner des données de test statiques pour éviter les erreurs de BDD
    const testCases = [
      {
        id: 'test-case-1',
        case_number: 'CASE-001',
        status: 'draft',
        created_at: new Date().toISOString()
      },
      {
        id: 'test-case-2',
        case_number: 'CASE-002',
        status: 'email_sent',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'test-case-3',
        case_number: 'CASE-003',
        status: 'completed',
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      }
    ];

    console.log(`✅ ${testCases.length} dossiers de test générés`);

    // Enrichir les données de test
    const enrichedCases = testCases.map(caseItem => {
      // Calcul du temps écoulé
      const createdAt = new Date(caseItem.created_at);
      const now = new Date();
      const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Statut global simplifié
      let overallStatus = 'pending';
      if (caseItem.status === 'completed' || caseItem.status === 'validated') {
        overallStatus = 'completed';
      } else if (caseItem.status === 'signed') {
        overallStatus = 'signed';
      } else if (caseItem.status === 'documents_uploaded') {
        overallStatus = 'active';
      }

      return {
        id: caseItem.id,
        caseNumber: caseItem.case_number,
        status: caseItem.status,
        overallStatus,
        priority: 'medium',
        secureToken: 'token-' + caseItem.id.substring(0, 8),
        client: {
          id: 'client-' + caseItem.id.substring(0, 8),
          clientCode: 'CLI-' + caseItem.case_number,
          firstName: 'Client',
          lastName: 'Test',
          fullName: `Client ${caseItem.case_number}`,
          email: `client-${caseItem.case_number}@example.com`,
          phone: '+33123456789'
        },
        insuranceCompany: 'Assurance Test',
        policyType: 'Résiliation',
        policyNumber: 'POL-' + caseItem.case_number,
        terminationDate: '',
        reasonForTermination: '',
        hasSignature: false,
        signature: null,
        documentsCount: 0,
        generatedDocsCount: 0,
        emailsSent: 0,
        totalDocuments: 0,
        createdAt: caseItem.created_at,
        updatedAt: caseItem.created_at,
        completedAt: null,
        expiresAt: null,
        daysSinceCreated,
        daysSinceUpdated: daysSinceCreated,
        portalUrl: `/signature/token-${caseItem.id.substring(0, 8)}`
      };
    }) || [];

    // Statistiques
    const stats = {
      total: enrichedCases.length,
      pending: enrichedCases.filter(c => c.overallStatus === 'pending').length,
      active: enrichedCases.filter(c => c.overallStatus === 'active').length,
      signed: enrichedCases.filter(c => c.overallStatus === 'signed').length,
      completed: enrichedCases.filter(c => c.overallStatus === 'completed').length,
      withSignature: enrichedCases.filter(c => c.hasSignature).length,
      highPriority: enrichedCases.filter(c => c.priority === 'high').length,
      avgDaysToComplete: 0
    };

    console.log('✅ Données de test enrichies avec succès:', {
      cases: enrichedCases.length,
      stats
    });

    return NextResponse.json({
      success: true,
      cases: enrichedCases,
      stats,
      debug: {
        rawCases: testCases.length,
        message: 'Données de test statiques utilisées'
      }
    });

  } catch (error) {
    console.error('❌ Erreur test cases:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test de récupération des dossiers',
      details: error.message
    }, { status: 500 });
  }
}
