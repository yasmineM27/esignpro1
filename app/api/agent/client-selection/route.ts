import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API for client selection and management
 * GET: Search and retrieve clients for selection
 * POST: Create new client or link existing client to case
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeSignatureStatus = searchParams.get('includeSignatureStatus') === 'true';
    const onlyWithSignature = searchParams.get('onlyWithSignature') === 'true';

    console.log('🔍 Recherche clients:', { search, limit, includeSignatureStatus, onlyWithSignature });

    // First, try with new columns (after database enhancements)
    let query = supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        date_of_birth,
        address,
        city,
        postal_code,
        country,
        has_signature,
        signature_count,
        created_at,
        updated_at,
        users!inner(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `);

    // If new columns don't exist, fall back to basic query
    let fallbackMode = false;

    // Filter by signature status if requested (only if new columns exist)
    if (onlyWithSignature && !fallbackMode) {
      query = query.eq('has_signature', true);
    }

    // Apply search filter - use a different approach to avoid Supabase syntax issues
    if (search.trim()) {
      // For now, just search by first name to test the basic functionality
      query = query.ilike('users.first_name', `%${search.trim()}%`);
    }

    query = query
      .order('updated_at', { ascending: false })
      .limit(limit);

    let { data: clients, error } = await query;

    // If error due to missing columns, try fallback query
    if (error && (error.message?.includes('has_signature') || error.code === 'PGRST100')) {
      console.log('🔄 Trying fallback query without new columns...');
      fallbackMode = true;

      let fallbackQuery = supabaseAdmin
        .from('clients')
        .select(`
          id,
          client_code,
          date_of_birth,
          address,
          city,
          postal_code,
          country,
          created_at,
          updated_at,
          users!inner(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `);

      // Apply search filter for fallback - use simple approach
      if (search.trim()) {
        fallbackQuery = fallbackQuery.ilike('users.first_name', `%${search.trim()}%`);
      }

      fallbackQuery = fallbackQuery
        .order('updated_at', { ascending: false })
        .limit(limit);

      const fallbackResult = await fallbackQuery;
      clients = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('❌ Erreur recherche clients:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la recherche des clients'
      }, { status: 500 });
    }

    // Check signatures manually for each client (since columns might not exist)
    const clientIds = clients?.map(c => c.id) || [];
    let signatureMap = new Map();

    if (clientIds.length > 0) {
      try {
        const { data: signatures, error: sigError } = await supabaseAdmin
          .from('client_signatures')
          .select('client_id, id, is_active, is_default')
          .in('client_id', clientIds)
          .eq('is_active', true);

        if (!sigError && signatures) {
          signatures.forEach(sig => {
            if (!signatureMap.has(sig.client_id)) {
              signatureMap.set(sig.client_id, { count: 0, hasDefault: false });
            }
            const current = signatureMap.get(sig.client_id);
            current.count++;
            if (sig.is_default) current.hasDefault = true;
          });
        }
      } catch (sigError) {
        console.warn('⚠️ Erreur récupération signatures:', sigError);
      }
    }

    // Format the data for the frontend
    const formattedClients = clients?.map(client => {
      const signatureInfo = signatureMap.get(client.id) || { count: 0, hasDefault: false };
      const hasSignature = signatureInfo.count > 0;

      return {
        id: client.id,
        clientCode: client.client_code,
        firstName: client.users.first_name,
        lastName: client.users.last_name,
        fullName: `${client.users.first_name} ${client.users.last_name}`,
        email: client.users.email,
        phone: client.users.phone,
        dateOfBirth: client.date_of_birth,
        address: client.address,
        city: client.city,
        postalCode: client.postal_code,
        country: client.country,
        // Use real signature data from client_signatures table
        hasSignature: hasSignature,
        signatureCount: signatureInfo.count,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
        // Additional computed fields
        displayText: `${client.users.first_name} ${client.users.last_name} (${client.users.email})`,
        signatureStatus: hasSignature ? 'Signature disponible' : 'Aucune signature'
      };
    }) || [];

    // Apply signature filter if requested
    let filteredClients = formattedClients;
    if (onlyWithSignature) {
      filteredClients = formattedClients.filter(client => client.hasSignature);
    }

    // Get additional statistics
    let stats = null;
    if (includeSignatureStatus) {
      stats = {
        total: formattedClients.length,
        withSignature: formattedClients.filter(c => c.hasSignature).length,
        withoutSignature: formattedClients.filter(c => !c.hasSignature).length
      };
    } else if (includeSignatureStatus && fallbackMode) {
      // Fallback stats when new columns don't exist
      stats = {
        total: formattedClients.length,
        withSignature: 0,
        withoutSignature: formattedClients.length
      };
    }

    console.log(`✅ ${formattedClients.length} client(s) trouvé(s)${fallbackMode ? ' (mode de compatibilité)' : ''}`);

    return NextResponse.json({
      success: true,
      clients: filteredClients,
      count: filteredClients.length,
      stats: stats,
      searchTerm: search,
      fallbackMode: fallbackMode,
      warning: fallbackMode ? 'Base de données non mise à jour. Appliquez les améliorations de la base de données pour activer toutes les fonctionnalités.' : null
    });

  } catch (error) {
    console.error('❌ Erreur API recherche clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      action,
      clientId,
      clientData,
      caseData,
      agentId: rawAgentId = '550e8400-e29b-41d4-a716-446655440001' // UUID de l'agent par défaut
    } = await request.json();

    // Force correct UUID if old value is passed - use default agent from new schema
    let agentId = rawAgentId === 'agent-001' ? '550e8400-e29b-41d4-a716-446655440001' : rawAgentId;

    // Verify agent exists in new agents table, if not use first available agent
    const { data: agentCheck } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .single();

    if (!agentCheck) {
      console.log('⚠️ Agent non trouvé, utilisation du premier agent disponible');
      const { data: firstAgent } = await supabaseAdmin
        .from('agents')
        .select('id')
        .limit(1)
        .single();

      if (firstAgent) {
        agentId = firstAgent.id;
      }
    }

    console.log('📝 Action client:', { action, clientId, agentId });

    switch (action) {
      case 'create_client':
        return await createNewClient(clientData, agentId);
      
      case 'create_case_for_client':
        return await createCaseForExistingClient(clientId, caseData, agentId);
      
      case 'get_client_details':
        return await getClientDetails(clientId);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Action non reconnue'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erreur action client:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

async function createNewClient(clientData: any, agentId: string) {
  try {
    console.log('👤 Création nouveau client:', clientData);

    // 1. Create user first
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        email: clientData.email,
        first_name: clientData.firstName,
        last_name: clientData.lastName,
        phone: clientData.phone,
        role: 'client',
        is_active: true
      }])
      .select()
      .single();

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création de l\'utilisateur'
      }, { status: 500 });
    }

    // 2. Create client
    const { data: clientResult, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert([{
        user_id: userData.id,
        client_code: `CLI-${Date.now()}`,
        date_of_birth: clientData.dateOfBirth,
        address: clientData.address,
        city: clientData.city,
        postal_code: clientData.postalCode,
        country: clientData.country || 'Suisse',
        has_signature: false,
        signature_count: 0
      }])
      .select(`
        *,
        users!inner(*)
      `)
      .single();

    if (clientError) {
      console.error('❌ Erreur création client:', clientError);
      // Cleanup user if client creation failed
      await supabaseAdmin.from('users').delete().eq('id', userData.id);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création du client'
      }, { status: 500 });
    }

    console.log('✅ Client créé avec succès:', clientResult.id);

    return NextResponse.json({
      success: true,
      client: {
        id: clientResult.id,
        clientCode: clientResult.client_code,
        firstName: clientResult.users.first_name,
        lastName: clientResult.users.last_name,
        fullName: `${clientResult.users.first_name} ${clientResult.users.last_name}`,
        email: clientResult.users.email,
        phone: clientResult.users.phone,
        dateOfBirth: clientResult.date_of_birth,
        address: clientResult.address,
        city: clientResult.city,
        postalCode: clientResult.postal_code,
        country: clientResult.country,
        hasSignature: clientResult.has_signature,
        signatureCount: clientResult.signature_count,
        createdAt: clientResult.created_at
      },
      message: 'Client créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création client:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la création'
    }, { status: 500 });
  }
}

async function createCaseForExistingClient(clientId: string, caseData: any, agentId: string) {
  try {
    console.log('📁 Création dossier pour client existant:', { clientId, caseData });

    // Generate secure token and case number
    const secureToken = `SECURE_${Date.now()}_${Math.random().toString(36).substring(2, 17)}`;
    const caseNumber = `CASE-${Date.now()}`;

    const { data: caseResult, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .insert([{
        case_number: caseNumber,
        client_id: clientId,
        agent_id: agentId,
        secure_token: secureToken,
        status: 'draft',
        insurance_company: caseData.insuranceCompany,
        policy_number: caseData.policyNumber,
        policy_type: caseData.policyType,
        termination_date: caseData.terminationDate,
        reason_for_termination: caseData.reasonForTermination,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }])
      .select(`
        *,
        clients!inner(
          *,
          users!inner(*)
        )
      `)
      .single();

    if (caseError) {
      console.error('❌ Erreur création dossier:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création du dossier'
      }, { status: 500 });
    }

    console.log('✅ Dossier créé avec succès:', caseResult.id);

    return NextResponse.json({
      success: true,
      case: {
        id: caseResult.id,
        caseNumber: caseResult.case_number,
        secureToken: caseResult.secure_token,
        status: caseResult.status,
        clientId: caseResult.client_id,
        clientName: `${caseResult.clients.users.first_name} ${caseResult.clients.users.last_name}`,
        clientEmail: caseResult.clients.users.email,
        clientHasSignature: caseResult.clients.has_signature,
        insuranceCompany: caseResult.insurance_company,
        policyNumber: caseResult.policy_number,
        policyType: caseResult.policy_type,
        terminationDate: caseResult.termination_date,
        reasonForTermination: caseResult.reason_for_termination,
        createdAt: caseResult.created_at,
        expiresAt: caseResult.expires_at
      },
      message: 'Dossier créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création dossier:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la création du dossier'
    }, { status: 500 });
  }
}

async function getClientDetails(clientId: string) {
  try {
    console.log('📋 Récupération détails client:', clientId);

    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        users!inner(*),
        client_signatures!left(
          id,
          signature_name,
          is_default,
          is_active,
          created_at
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // Get recent cases for this client
    const { data: recentCases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        status,
        insurance_company,
        policy_type,
        created_at,
        updated_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);

    const formattedClient = {
      id: clientData.id,
      clientCode: clientData.client_code,
      firstName: clientData.users.first_name,
      lastName: clientData.users.last_name,
      fullName: `${clientData.users.first_name} ${clientData.users.last_name}`,
      email: clientData.users.email,
      phone: clientData.users.phone,
      dateOfBirth: clientData.date_of_birth,
      address: clientData.address,
      city: clientData.city,
      postalCode: clientData.postal_code,
      country: clientData.country,
      hasSignature: clientData.has_signature,
      signatureCount: clientData.signature_count,
      signatures: clientData.client_signatures || [],
      recentCases: recentCases || [],
      createdAt: clientData.created_at,
      updatedAt: clientData.updated_at
    };

    return NextResponse.json({
      success: true,
      client: formattedClient
    });

  } catch (error) {
    console.error('❌ Erreur récupération détails client:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
