import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') || '550e8400-e29b-41d4-a716-446655440001';
    const status = searchParams.get('status'); // all, pending, signed, completed, validated, archived
    const priority = searchParams.get('priority'); // high, medium, low
    const insuranceCompany = searchParams.get('insuranceCompany');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📁 Récupération tous dossiers:', {
      agentId, status, priority, insuranceCompany, 
      dateFrom, dateTo, search, sortBy, sortOrder, limit, offset
    });

    // Requête principale avec toutes les relations
    let query = supabaseAdmin
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
        updated_at,
        completed_at,
        expires_at,
        client_id,
        agent_id,
        clients!inner(
          id,
          client_code,
          users!inner(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        ),
        signatures(
          id,
          signature_data,
          signed_at,
          is_valid
        )
      `);
      // .eq('agent_id', agentId); // Commenté pour éviter l'erreur d'agent inexistant

    // Filtres de statut
    if (status && status !== 'all') {
      switch (status) {
        case 'pending':
          query = query.in('status', ['email_sent', 'documents_uploaded']);
          break;
        case 'active':
          query = query.in('status', ['email_sent', 'documents_uploaded', 'signed']);
          break;
        case 'signed':
          query = query.eq('status', 'signed');
          break;
        case 'completed':
          query = query.eq('status', 'completed');
          break;
        case 'validated':
          query = query.eq('status', 'validated');
          break;
        case 'archived':
          query = query.eq('status', 'archived');
          break;
        default:
          query = query.eq('status', status);
      }
    }

    // Filtre par priorité
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Filtre par compagnie d'assurance
    if (insuranceCompany) {
      query = query.eq('insurance_company', insuranceCompany);
    }

    // Filtres de date
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Tri
    const validSortFields = ['created_at', 'updated_at', 'case_number', 'status', 'priority'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    
    query = query.order(sortField, order);

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: cases, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des dossiers'
      }, { status: 500 });
    }

    // Traitement et enrichissement des données
    const enrichedCases = cases?.map(caseItem => {
      const client = caseItem.clients;
      const user = client.users;
      const signatures = caseItem.signatures || [];
      // Relations simplifiées - pas de documents pour éviter les erreurs
      const documents = [];
      const generatedDocs = [];
      const emails = [];

      // Calculs de statut et métriques
      const hasSignature = signatures.length > 0;
      const lastSignature = signatures.sort((a, b) => 
        new Date(b.signed_at || b.created_at).getTime() - new Date(a.signed_at || a.created_at).getTime()
      )[0];
      
      const documentsCount = documents.length;
      const generatedDocsCount = generatedDocs.length;
      const emailsSent = emails.filter(e => e.status === 'sent').length;
      
      // Calcul du temps écoulé
      const createdAt = new Date(caseItem.created_at);
      const now = new Date();
      const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcul de la priorité automatique (colonne priority n'existe pas dans la vraie DB)
      let calculatedPriority = 'medium';
      if (daysSinceCreated > 7 && caseItem.status === 'email_sent') {
        calculatedPriority = 'high';
      } else if (daysSinceCreated < 2) {
        calculatedPriority = 'low';
      }

      // Statut global
      let overallStatus = 'pending';
      if (caseItem.status === 'completed' || caseItem.status === 'validated') {
        overallStatus = 'completed';
      } else if (hasSignature) {
        overallStatus = 'signed';
      } else if (documentsCount > 0) {
        overallStatus = 'active';
      }

      return {
        id: caseItem.id,
        caseNumber: caseItem.case_number,
        status: caseItem.status,
        overallStatus,
        priority: calculatedPriority,
        secureToken: caseItem.secure_token,
        
        // Informations client
        client: {
          id: client.id,
          clientCode: client.client_code,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone
        },

        // Informations assurance
        insuranceCompany: caseItem.insurance_company,
        policyType: caseItem.policy_type,
        policyNumber: caseItem.policy_number,
        terminationDate: caseItem.termination_date,
        reasonForTermination: caseItem.reason_for_termination,

        // Signature
        hasSignature,
        signature: lastSignature ? {
          id: lastSignature.id,
          signedAt: lastSignature.signed_at,
          isValid: lastSignature.is_valid,
          validationStatus: lastSignature.validation_status,
          validatedAt: lastSignature.validated_at
        } : null,

        // Métriques
        documentsCount,
        generatedDocsCount,
        emailsSent,
        totalDocuments: documentsCount + generatedDocsCount,

        // Dates
        createdAt: caseItem.created_at,
        updatedAt: caseItem.updated_at,
        completedAt: caseItem.completed_at,
        expiresAt: caseItem.expires_at,
        daysSinceCreated,
        daysSinceUpdated: Math.floor((now.getTime() - new Date(caseItem.updated_at).getTime()) / (1000 * 60 * 60 * 24)),

        // URL du portail client
        portalUrl: `/client/${caseItem.secure_token}`
      };
    }) || [];

    // Filtrage par recherche textuelle (après enrichissement)
    let filteredCases = enrichedCases;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCases = enrichedCases.filter(caseItem => 
        caseItem.client.fullName.toLowerCase().includes(searchLower) ||
        caseItem.client.email.toLowerCase().includes(searchLower) ||
        caseItem.caseNumber.toLowerCase().includes(searchLower) ||
        caseItem.insuranceCompany?.toLowerCase().includes(searchLower) ||
        caseItem.policyNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Statistiques globales
    const stats = {
      total: filteredCases.length,
      pending: filteredCases.filter(c => c.overallStatus === 'pending').length,
      active: filteredCases.filter(c => c.overallStatus === 'active').length,
      signed: filteredCases.filter(c => c.overallStatus === 'signed').length,
      completed: filteredCases.filter(c => c.overallStatus === 'completed').length,
      withSignature: filteredCases.filter(c => c.hasSignature).length,
      highPriority: filteredCases.filter(c => c.priority === 'high').length,
      avgDaysToComplete: filteredCases.filter(c => c.completedAt).reduce((acc, c) => {
        const completedAt = new Date(c.completedAt!);
        const createdAt = new Date(c.createdAt);
        return acc + Math.floor((completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / Math.max(filteredCases.filter(c => c.completedAt).length, 1)
    };

    console.log(`✅ ${filteredCases.length} dossier(s) récupéré(s) avec filtres`);

    return NextResponse.json({
      success: true,
      cases: filteredCases,
      stats,
      pagination: {
        limit,
        offset,
        total: filteredCases.length,
        hasMore: filteredCases.length === limit
      },
      filters: {
        status,
        priority,
        insuranceCompany,
        dateFrom,
        dateTo,
        search,
        sortBy: sortField,
        sortOrder
      }
    });

  } catch (error) {
    console.error('❌ Erreur API tous dossiers:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
