import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 Récupération agents admin:', { status, department, role, limit, offset });

    // Construire la requête avec jointures
    let query = supabaseAdmin
      .from('agents')
      .select(`
        id,
        agent_code,
        department,
        is_supervisor,
        created_at,
        updated_at,
        users!inner(
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          is_active,
          last_login,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Filtres
    if (status !== 'all') {
      if (status === 'active') {
        query = query.eq('users.is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('users.is_active', false);
      }
    }

    if (department) {
      query = query.eq('department', department);
    }

    if (role) {
      query = query.eq('users.role', role);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: agents, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération agents:', error);
      return NextResponse.json({ error: 'Erreur récupération agents', details: error });
    }

    // Récupérer les statistiques pour chaque agent
    const agentIds = agents.map(agent => agent.id);
    const { data: caseStats, error: statsError } = await supabaseAdmin
      .from('insurance_cases')
      .select('agent_id, status')
      .in('agent_id', agentIds);

    if (statsError) {
      console.error('❌ Erreur récupération statistiques:', statsError);
    }

    // Calculer les statistiques par agent
    const statsMap = new Map();
    caseStats?.forEach(caseItem => {
      if (!statsMap.has(caseItem.agent_id)) {
        statsMap.set(caseItem.agent_id, { total: 0, completed: 0, pending: 0 });
      }
      const stats = statsMap.get(caseItem.agent_id);
      stats.total++;
      if (caseItem.status === 'signed' || caseItem.status === 'completed') {
        stats.completed++;
      } else {
        stats.pending++;
      }
    });

    // Formater les données
    const formattedAgents = agents.map(agent => {
      const stats = statsMap.get(agent.id) || { total: 0, completed: 0, pending: 0 };
      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        id: agent.id,
        agent_code: agent.agent_code,
        user_id: agent.users.id,
        first_name: agent.users.first_name,
        last_name: agent.users.last_name,
        full_name: `${agent.users.first_name} ${agent.users.last_name}`,
        email: agent.users.email,
        phone: agent.users.phone,
        department: agent.department,
        role: agent.users.role,
        is_supervisor: agent.is_supervisor,
        is_active: agent.users.is_active,
        last_login: agent.users.last_login,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        stats: {
          cases_handled: stats.total,
          cases_completed: stats.completed,
          cases_pending: stats.pending,
          completion_rate: completionRate
        }
      };
    });

    // Compter le total pour la pagination
    let countQuery = supabaseAdmin
      .from('agents')
      .select('id, users!inner(is_active)', { count: 'exact', head: true });

    if (status === 'active') {
      countQuery = countQuery.eq('users.is_active', true);
    } else if (status === 'inactive') {
      countQuery = countQuery.eq('users.is_active', false);
    }

    const { count: totalCount } = await countQuery;

    console.log(`✅ ${formattedAgents.length} agents récupérés`);

    return NextResponse.json({
      success: true,
      agents: formattedAgents,
      pagination: {
        offset,
        limit,
        total: totalCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur générale récupération agents:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}

// POST - Créer un nouvel agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      department, 
      role = 'agent',
      is_supervisor = false,
      password 
    } = body;

    console.log('➕ Création nouvel agent:', { first_name, last_name, email, department, role });

    // Validation des données
    if (!first_name || !last_name || !email || !department) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes: prénom, nom, email et département requis'
      }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      }, { status: 409 });
    }

    // Générer un code agent unique
    const agentCodePrefix = department.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const agent_code = `${agentCodePrefix}${timestamp}`;

    // Générer un mot de passe temporaire si non fourni
    const tempPassword = password || `temp${timestamp}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Créer l'utilisateur d'abord
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        first_name,
        last_name,
        email,
        phone,
        role: role === 'admin' ? 'admin' : role === 'supervisor' ? 'agent' : 'agent', // Les superviseurs sont des agents avec flag
        is_active: true,
        password_hash: hashedPassword
      }])
      .select()
      .single();

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return NextResponse.json({
        success: false,
        error: 'Erreur création utilisateur',
        details: userError
      }, { status: 500 });
    }

    // Créer l'agent
    const { data: newAgent, error: agentError } = await supabaseAdmin
      .from('agents')
      .insert([{
        user_id: newUser.id,
        agent_code,
        department,
        is_supervisor: is_supervisor || role === 'supervisor'
      }])
      .select()
      .single();

    if (agentError) {
      console.error('❌ Erreur création agent:', agentError);
      
      // Nettoyer l'utilisateur créé en cas d'erreur
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', newUser.id);

      return NextResponse.json({
        success: false,
        error: 'Erreur création agent',
        details: agentError
      }, { status: 500 });
    }

    console.log(`✅ Agent créé avec succès: ${agent_code}`);

    return NextResponse.json({
      success: true,
      message: 'Agent créé avec succès',
      agent: {
        id: newAgent.id,
        agent_code: newAgent.agent_code,
        user_id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        department: newAgent.department,
        role: newUser.role,
        is_supervisor: newAgent.is_supervisor,
        is_active: newUser.is_active,
        created_at: newAgent.created_at
      },
      // Retourner le mot de passe temporaire pour information
      temporary_password: password ? null : tempPassword
    });

  } catch (error) {
    console.error('❌ Erreur générale création agent:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}
