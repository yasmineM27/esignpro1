import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 Récupération utilisateurs admin:', { role, status, limit, offset });

    // Construire la requête avec jointures optionnelles
    let query = supabaseAdmin
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
      .order('created_at', { ascending: false });

    // Filtres
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      return NextResponse.json({ error: 'Erreur récupération utilisateurs', details: error });
    }

    // Formater les données
    const formattedUsers = users.map(user => ({
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
      // Relations optionnelles
      agent: user.agents && user.agents.length > 0 ? user.agents[0] : null,
      client: user.clients && user.clients.length > 0 ? user.clients[0] : null
    }));

    // Compter le total pour la pagination
    const { count: totalCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    console.log(`✅ ${formattedUsers.length} utilisateurs récupérés`);

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        offset,
        limit,
        total: totalCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur générale récupération utilisateurs:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      role = 'client',
      password
    } = body;

    console.log('➕ Création nouvel utilisateur:', { first_name, last_name, email, role });

    // Validation des données
    if (!first_name || !last_name || !email) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes: prénom, nom et email requis'
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

    // Générer un mot de passe temporaire si non fourni
    const tempPassword = password || `temp${Date.now().toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Créer l'utilisateur
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        first_name,
        last_name,
        email,
        phone: phone || null,
        role,
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

    // Si c'est un agent, créer aussi l'entrée agent
    if (role === 'agent') {
      const agentCodePrefix = 'USR';
      const timestamp = Date.now().toString().slice(-6);
      const agent_code = `${agentCodePrefix}${timestamp}`;

      const { error: agentError } = await supabaseAdmin
        .from('agents')
        .insert([{
          user_id: newUser.id,
          agent_code,
          department: 'Non assigné',
          is_supervisor: false
        }]);

      if (agentError) {
        console.error('❌ Erreur création agent:', agentError);
        // Ne pas échouer complètement, juste logger l'erreur
      }
    }

    // Si c'est un client, créer aussi l'entrée client
    if (role === 'client') {
      const clientCodePrefix = 'CLI';
      const timestamp = Date.now().toString().slice(-6);
      const client_code = `${clientCodePrefix}${timestamp}`;

      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert([{
          user_id: newUser.id,
          client_code
        }]);

      if (clientError) {
        console.error('❌ Erreur création client:', clientError);
        // Ne pas échouer complètement, juste logger l'erreur
      }
    }

    console.log(`✅ Utilisateur créé avec succès: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        is_active: newUser.is_active,
        created_at: newUser.created_at
      }
    });

  } catch (error) {
    console.error('❌ Erreur générale création utilisateur:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}
