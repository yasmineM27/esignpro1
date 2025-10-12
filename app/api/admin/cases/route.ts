import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - Récupérer tous les dossiers
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération dossiers admin');

    const { data: cases, error } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        client_id,
        agent_id,
        secure_token,
        status,
        insurance_company,
        policy_number,
        policy_type,
        termination_date,
        reason_for_termination,
        completed_at,
        expires_at,
        created_at,
        updated_at,
        clients!inner(
          id,
          client_code,
          users!inner(
            first_name,
            last_name,
            email
          )
        ),
        agents(
          id,
          agent_code,
          users!inner(
            first_name,
            last_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération dossiers'
      }, { status: 500 });
    }

    console.log(`✅ ${cases?.length || 0} dossiers récupérés`);

    return NextResponse.json({
      success: true,
      cases: cases || []
    });

  } catch (error) {
    console.error('❌ Erreur récupération dossiers:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST - Créer un nouveau dossier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      client_id,
      agent_id,
      case_number,
      insurance_company,
      policy_number,
      policy_type,
      termination_date,
      reason_for_termination,
      status = 'draft'
    } = body;

    console.log('➕ Création nouveau dossier:', { client_id, case_number });

    // Validation des champs requis
    if (!client_id) {
      return NextResponse.json({
        success: false,
        error: 'client_id requis'
      }, { status: 400 });
    }

    // Vérifier que le client existe
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // Générer un numéro de dossier si non fourni
    const finalCaseNumber = case_number || `CASE_${Date.now()}`;
    
    // Générer un token sécurisé
    const secureToken = generateSecureToken();

    // Créer le dossier
    const { data: newCase, error: createError } = await supabaseAdmin
      .from('insurance_cases')
      .insert([{
        client_id,
        agent_id,
        case_number: finalCaseNumber,
        secure_token: secureToken,
        status,
        insurance_company,
        policy_number,
        policy_type,
        termination_date,
        reason_for_termination,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
      }])
      .select(`
        id,
        case_number,
        client_id,
        agent_id,
        secure_token,
        status,
        insurance_company,
        policy_number,
        policy_type,
        termination_date,
        reason_for_termination,
        expires_at,
        created_at,
        clients!inner(
          id,
          client_code,
          users!inner(
            first_name,
            last_name,
            email
          )
        )
      `)
      .single();

    if (createError) {
      console.error('❌ Erreur création dossier:', createError);
      
      if (createError.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          error: 'Un dossier avec ce numéro existe déjà'
        }, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création du dossier'
      }, { status: 500 });
    }

    console.log('✅ Dossier créé avec succès:', newCase.id);

    return NextResponse.json({
      success: true,
      case: newCase
    });

  } catch (error) {
    console.error('❌ Erreur création dossier:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
