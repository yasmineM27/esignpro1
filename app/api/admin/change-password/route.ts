import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// POST - Changer le mot de passe d'un utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      new_password, 
      user_type = 'user' // 'user' ou 'agent'
    } = body;

    console.log('🔑 Changement mot de passe:', { user_id, user_type });

    // Validation des données
    if (!user_id || !new_password) {
      return NextResponse.json({
        success: false,
        error: 'ID utilisateur et nouveau mot de passe requis'
      }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', user_id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('❌ Erreur mise à jour mot de passe:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour du mot de passe',
        details: updateError
      }, { status: 500 });
    }

    console.log('✅ Mot de passe mis à jour avec succès pour:', existingUser.email);

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      user: {
        id: existingUser.id,
        email: existingUser.email,
        full_name: `${existingUser.first_name} ${existingUser.last_name}`,
        role: existingUser.role
      }
    });

  } catch (error) {
    console.error('❌ Erreur générale changement mot de passe:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}

// GET - Générer un mot de passe temporaire
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const length = parseInt(searchParams.get('length') || '8');
    
    // Générer un mot de passe temporaire sécurisé
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    
    for (let i = 0; i < length; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ajouter quelques caractères spéciaux
    tempPassword += '!@#'[Math.floor(Math.random() * 3)];
    
    return NextResponse.json({
      success: true,
      temporary_password: tempPassword
    });

  } catch (error) {
    console.error('❌ Erreur génération mot de passe:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur génération mot de passe' 
    }, { status: 500 });
  }
}
