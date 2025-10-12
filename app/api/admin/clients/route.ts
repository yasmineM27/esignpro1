import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer tous les clients
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération clients admin');

    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        user_id,
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
          email,
          first_name,
          last_name,
          phone,
          role,
          is_active
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération clients'
      }, { status: 500 });
    }

    console.log(`✅ ${clients?.length || 0} clients récupérés`);

    return NextResponse.json({
      success: true,
      clients: clients || []
    });

  } catch (error) {
    console.error('❌ Erreur récupération clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST - Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      client_code,
      date_of_birth,
      address,
      city,
      postal_code,
      country = 'Suisse'
    } = body;

    console.log('➕ Création nouveau client:', { user_id, client_code });

    // Validation des champs requis
    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'user_id requis'
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    // Générer un code client si non fourni
    const finalClientCode = client_code || `CLIENT_${Date.now()}`;

    // Créer le client
    const { data: newClient, error: createError } = await supabaseAdmin
      .from('clients')
      .insert([{
        user_id,
        client_code: finalClientCode,
        date_of_birth,
        address,
        city,
        postal_code,
        country
      }])
      .select(`
        id,
        user_id,
        client_code,
        date_of_birth,
        address,
        city,
        postal_code,
        country,
        created_at,
        users!inner(
          id,
          email,
          first_name,
          last_name,
          phone
        )
      `)
      .single();

    if (createError) {
      console.error('❌ Erreur création client:', createError);
      
      if (createError.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          error: 'Un client avec ce code existe déjà'
        }, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création du client'
      }, { status: 500 });
    }

    console.log('✅ Client créé avec succès:', newClient.id);

    return NextResponse.json({
      success: true,
      client: newClient
    });

  } catch (error) {
    console.error('❌ Erreur création client:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
