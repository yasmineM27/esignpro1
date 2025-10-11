import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST - Connexion utilisateur (tous types)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Tentative connexion utilisateur:', { email });

    // Validation des données
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email et mot de passe requis'
      }, { status: 400 });
    }

    // Rechercher l'utilisateur avec ses relations optionnelles
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        is_active,
        password_hash,
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
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      console.log('❌ Utilisateur non trouvé ou inactif:', userError);
      return NextResponse.json({
        success: false,
        error: 'Identifiants invalides ou compte inactif'
      }, { status: 401 });
    }

    // Vérifier le mot de passe
    let isPasswordValid = false;
    if (userData.password_hash) {
      // Vérifier avec bcrypt si un hash existe
      isPasswordValid = await bcrypt.compare(password, userData.password_hash);
    } else {
      // Mode démo pour les anciens comptes sans mot de passe
      isPasswordValid = password.length >= 4;
    }

    if (!isPasswordValid) {
      console.log('❌ Mot de passe invalide');
      return NextResponse.json({
        success: false,
        error: 'Identifiants invalides'
      }, { status: 401 });
    }

    // Mettre à jour la dernière connexion
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    // Créer le token JWT avec les bonnes données selon le rôle
    const tokenPayload: any = {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      firstName: userData.first_name,
      lastName: userData.last_name
    };

    // Ajouter les données spécifiques selon le rôle
    if (userData.role === 'agent' && userData.agents && userData.agents.length > 0) {
      const agent = userData.agents[0];
      tokenPayload.agentId = agent.id;
      tokenPayload.agentCode = agent.agent_code;
      tokenPayload.department = agent.department;
      tokenPayload.isSupervisor = agent.is_supervisor;
    }

    if (userData.role === 'client' && userData.clients && userData.clients.length > 0) {
      const client = userData.clients[0];
      tokenPayload.clientId = client.id;
      tokenPayload.clientCode = client.client_code;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    // Définir le cookie sécurisé
    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        agents: userData.agents || [],
        clients: userData.clients || []
      }
    });

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 // 8 heures
    });

    console.log('✅ Connexion réussie pour:', userData.email);
    return response;

  } catch (error) {
    console.error('❌ Erreur générale connexion:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}

// GET - Vérifier le token et récupérer les infos de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Récupérer les informations actuelles de l'utilisateur
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        is_active,
        last_login,
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
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !userData) {
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé ou inactif'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('❌ Erreur vérification token:', error);
    return NextResponse.json({
      success: false,
      error: 'Token invalide'
    }, { status: 401 });
  }
}

// DELETE - Déconnexion
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    });

    // Supprimer le cookie
    response.cookies.delete('user_token');

    return response;

  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur déconnexion' 
    }, { status: 500 });
  }
}
