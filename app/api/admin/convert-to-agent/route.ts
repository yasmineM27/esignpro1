import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST - Convertir un utilisateur en agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      department = 'Non assigné',
      is_supervisor = false
    } = body;

    console.log('🔄 Conversion utilisateur en agent:', { user_id, department, is_supervisor });

    // Validation des données
    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'ID utilisateur requis'
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

    // Vérifier s'il n'est pas déjà agent
    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (existingAgent) {
      return NextResponse.json({
        success: false,
        error: 'Cet utilisateur est déjà un agent'
      }, { status: 409 });
    }

    // Générer un code agent unique
    const agentCodePrefix = department.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const agent_code = `${agentCodePrefix}${timestamp}`;

    // Créer l'entrée agent
    const { data: newAgent, error: agentError } = await supabaseAdmin
      .from('agents')
      .insert([{
        user_id: user_id,
        agent_code: agent_code,
        department: department,
        is_supervisor: is_supervisor
      }])
      .select()
      .single();

    if (agentError) {
      console.error('❌ Erreur création agent:', agentError);
      return NextResponse.json({
        success: false,
        error: 'Erreur création agent',
        details: agentError
      }, { status: 500 });
    }

    // Mettre à jour le rôle de l'utilisateur si nécessaire
    if (existingUser.role !== 'agent') {
      await supabaseAdmin
        .from('users')
        .update({ 
          role: 'agent',
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id);
    }

    console.log(`✅ Utilisateur converti en agent avec succès: ${agent_code}`);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur converti en agent avec succès',
      agent: {
        id: newAgent.id,
        agent_code: newAgent.agent_code,
        user_id: user_id,
        department: newAgent.department,
        is_supervisor: newAgent.is_supervisor,
        user: {
          email: existingUser.email,
          full_name: `${existingUser.first_name} ${existingUser.last_name}`
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur générale conversion agent:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}
