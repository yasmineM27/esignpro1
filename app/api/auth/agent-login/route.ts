import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST - Connexion agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, agent_code } = body;

    console.log('🔐 Tentative connexion agent:', { email, agent_code });

    // Validation des données
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email et mot de passe requis'
      }, { status: 400 });
    }

    // Rechercher l'utilisateur et l'agent
    let query = supabaseAdmin
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
        agents!inner(
          id,
          agent_code,
          department,
          is_supervisor
        )
      `)
      .eq('email', email)
      .eq('is_active', true);

    // Si un code agent est fourni, l'utiliser aussi pour la recherche
    if (agent_code) {
      query = query.eq('agents.agent_code', agent_code);
    }

    const { data: userData, error: userError } = await query.single();

    if (userError || !userData) {
      console.log('❌ Utilisateur non trouvé ou inactif');
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

    // Créer le token JWT
    const tokenPayload = {
      userId: userData.id,
      agentId: userData.agents.id,
      email: userData.email,
      role: userData.role,
      agentCode: userData.agents.agent_code,
      department: userData.agents.department,
      isSupervisor: userData.agents.is_supervisor
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    // Créer la réponse avec le cookie
    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        phone: userData.phone,
        role: userData.role,
        agent: {
          id: userData.agents.id,
          agent_code: userData.agents.agent_code,
          department: userData.agents.department,
          is_supervisor: userData.agents.is_supervisor
        }
      },
      token
    });

    // Définir le cookie sécurisé
    response.cookies.set('agent_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 // 8 heures
    });

    console.log(`✅ Connexion réussie pour l'agent: ${userData.agents.agent_code}`);

    return response;

  } catch (error) {
    console.error('❌ Erreur connexion agent:', error);
    return NextResponse.json({ 
      error: 'Erreur de connexion', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}

// GET - Vérifier le token et récupérer les infos de l'agent connecté
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('agent_token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Récupérer les informations actuelles de l'agent
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
        agents!inner(
          id,
          agent_code,
          department,
          is_supervisor
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
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        phone: userData.phone,
        role: userData.role,
        last_login: userData.last_login,
        agent: {
          id: userData.agents.id,
          agent_code: userData.agents.agent_code,
          department: userData.agents.department,
          is_supervisor: userData.agents.is_supervisor
        }
      }
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
export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    });

    // Supprimer le cookie
    response.cookies.delete('agent_token');

    return response;

  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    return NextResponse.json({ 
      error: 'Erreur de déconnexion', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}
