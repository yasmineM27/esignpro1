import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET - Récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    console.log('🔍 Récupération utilisateur:', userId);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        is_active,
        last_login,
        created_at,
        updated_at,
        agents(
          id,
          agent_code,
          department,
          is_supervisor
        ),
        clients(
          id,
          client_code
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Erreur récupération utilisateur:', error);
      return NextResponse.json({ error: 'Utilisateur non trouvé', details: error }, { status: 404 });
    }

    const formattedUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
      agent: user.agents && user.agents.length > 0 ? user.agents[0] : null,
      client: user.clients && user.clients.length > 0 ? user.clients[0] : null
    };

    console.log('✅ Utilisateur récupéré:', user.email);

    return NextResponse.json({
      success: true,
      user: formattedUser
    });

  } catch (error) {
    console.error('❌ Erreur générale récupération utilisateur:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      is_active,
      password
    } = body;

    console.log('✏️ Mise à jour utilisateur:', userId, body);

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Gérer le mot de passe s'il est fourni
    if (password && password.trim()) {
      updateData.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    updateData.updated_at = new Date().toISOString();

    // Mettre à jour l'utilisateur
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (userError) {
      console.error('❌ Erreur mise à jour utilisateur:', userError);
      return NextResponse.json({
        success: false,
        error: 'Erreur mise à jour utilisateur',
        details: userError
      }, { status: 500 });
    }

    console.log(`✅ Utilisateur mis à jour: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur générale mise à jour utilisateur:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    console.log('🗑️ Suppression utilisateur:', userId);

    // Récupérer l'utilisateur avec ses informations
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    // Vérifier s'il y a des dépendances (dossiers, signatures, etc.)
    if (user.role === 'agent') {
      const { data: assignedCases, error: casesError } = await supabaseAdmin
        .from('insurance_cases')
        .select('id')
        .eq('agent_id', userId)
        .limit(1);

      if (assignedCases && assignedCases.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Impossible de supprimer cet utilisateur car il a des dossiers assignés. Désactivez-le plutôt.'
        }, { status: 409 });
      }
    }

    if (user.role === 'client') {
      const { data: clientCases, error: casesError } = await supabaseAdmin
        .from('insurance_cases')
        .select('id')
        .eq('client_id', userId)
        .limit(1);

      if (clientCases && clientCases.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Impossible de supprimer ce client car il a des dossiers. Désactivez-le plutôt.'
        }, { status: 409 });
      }
    }

    // Supprimer les entrées liées d'abord (agents, clients)
    if (user.role === 'agent') {
      await supabaseAdmin
        .from('agents')
        .delete()
        .eq('user_id', userId);
    }

    if (user.role === 'client') {
      await supabaseAdmin
        .from('clients')
        .delete()
        .eq('user_id', userId);
    }

    // Supprimer l'utilisateur
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('❌ Erreur suppression utilisateur:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Erreur suppression utilisateur',
        details: deleteError
      }, { status: 500 });
    }

    console.log(`✅ Utilisateur supprimé: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur générale suppression utilisateur:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}
