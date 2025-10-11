import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET - Récupérer un agent spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    console.log('🔍 Récupération agent:', agentId);

    const { data: agent, error } = await supabaseAdmin
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
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('❌ Erreur récupération agent:', error);
      return NextResponse.json({ error: 'Agent non trouvé', details: error }, { status: 404 });
    }

    // Récupérer les statistiques de l'agent
    const { data: caseStats, error: statsError } = await supabaseAdmin
      .from('insurance_cases')
      .select('status, created_at')
      .eq('agent_id', agentId);

    if (statsError) {
      console.error('❌ Erreur récupération statistiques:', statsError);
    }

    // Calculer les statistiques
    const stats = {
      total: caseStats?.length || 0,
      completed: caseStats?.filter(c => c.status === 'signed' || c.status === 'completed').length || 0,
      pending: caseStats?.filter(c => c.status !== 'signed' && c.status !== 'completed').length || 0,
      this_month: caseStats?.filter(c => {
        const caseDate = new Date(c.created_at);
        const now = new Date();
        return caseDate.getMonth() === now.getMonth() && caseDate.getFullYear() === now.getFullYear();
      }).length || 0
    };

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    const formattedAgent = {
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
        ...stats,
        completion_rate: completionRate
      }
    };

    console.log('✅ Agent récupéré:', agent.agent_code);

    return NextResponse.json({
      success: true,
      agent: formattedAgent
    });

  } catch (error) {
    console.error('❌ Erreur générale récupération agent:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour un agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      role,
      is_supervisor,
      is_active,
      password
    } = body;

    console.log('✏️ Mise à jour agent:', agentId, body);

    // Récupérer l'agent existant
    const { data: existingAgent, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('user_id')
      .eq('id', agentId)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json({
        success: false,
        error: 'Agent non trouvé'
      }, { status: 404 });
    }

    // Mettre à jour l'utilisateur
    const userUpdates: any = {};
    if (first_name !== undefined) userUpdates.first_name = first_name;
    if (last_name !== undefined) userUpdates.last_name = last_name;
    if (email !== undefined) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (role !== undefined) userUpdates.role = role === 'admin' ? 'admin' : 'agent';
    if (is_active !== undefined) userUpdates.is_active = is_active;

    // Gérer le mot de passe s'il est fourni
    if (password && password.trim()) {
      userUpdates.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    userUpdates.updated_at = new Date().toISOString();

    const { error: userError } = await supabaseAdmin
      .from('users')
      .update(userUpdates)
      .eq('id', existingAgent.user_id);

    if (userError) {
      console.error('❌ Erreur mise à jour utilisateur:', userError);
      return NextResponse.json({
        success: false,
        error: 'Erreur mise à jour utilisateur',
        details: userError
      }, { status: 500 });
    }

    // Mettre à jour l'agent
    const agentUpdates: any = {};
    if (department !== undefined) agentUpdates.department = department;
    if (is_supervisor !== undefined) agentUpdates.is_supervisor = is_supervisor || role === 'supervisor';
    agentUpdates.updated_at = new Date().toISOString();

    const { error: agentError } = await supabaseAdmin
      .from('agents')
      .update(agentUpdates)
      .eq('id', agentId);

    if (agentError) {
      console.error('❌ Erreur mise à jour agent:', agentError);
      return NextResponse.json({
        success: false,
        error: 'Erreur mise à jour agent',
        details: agentError
      }, { status: 500 });
    }

    console.log(`✅ Agent mis à jour: ${agentId}`);

    return NextResponse.json({
      success: true,
      message: 'Agent mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur générale mise à jour agent:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer un agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    console.log('🗑️ Suppression agent:', agentId);

    // Récupérer l'agent avec ses informations
    const { data: agent, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('user_id, agent_code')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent non trouvé'
      }, { status: 404 });
    }

    // Vérifier s'il y a des dossiers assignés à cet agent
    const { data: assignedCases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id')
      .eq('agent_id', agentId)
      .limit(1);

    if (casesError) {
      console.error('❌ Erreur vérification dossiers:', casesError);
    }

    if (assignedCases && assignedCases.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de supprimer cet agent car il a des dossiers assignés. Désactivez-le plutôt.'
      }, { status: 409 });
    }

    // Supprimer l'agent (cela supprimera aussi l'utilisateur grâce aux contraintes CASCADE)
    const { error: deleteAgentError } = await supabaseAdmin
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (deleteAgentError) {
      console.error('❌ Erreur suppression agent:', deleteAgentError);
      return NextResponse.json({
        success: false,
        error: 'Erreur suppression agent',
        details: deleteAgentError
      }, { status: 500 });
    }

    // Supprimer l'utilisateur associé
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', agent.user_id);

    if (deleteUserError) {
      console.error('❌ Erreur suppression utilisateur:', deleteUserError);
      // Ne pas retourner d'erreur car l'agent est déjà supprimé
    }

    console.log(`✅ Agent supprimé: ${agent.agent_code}`);

    return NextResponse.json({
      success: true,
      message: 'Agent supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur générale suppression agent:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}
