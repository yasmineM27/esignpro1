import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les cookies
    const token = request.cookies.get('agent_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401 }
      )
    }

    // Vérifier et décoder le token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Récupérer les informations de l'agent depuis la base de données
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select(`
        id,
        agent_code,
        department,
        is_supervisor,
        users!inner(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('id', decoded.agentId)
      .single()

    if (agentError || !agent) {
      console.error('Erreur récupération agent:', agentError)
      return NextResponse.json(
        { error: 'Agent non trouvé' },
        { status: 404 }
      )
    }

    // Formater les données de réponse
    const agentInfo = {
      id: agent.id,
      first_name: agent.users.first_name,
      last_name: agent.users.last_name,
      email: agent.users.email,
      agent_code: agent.agent_code,
      department: agent.department,
      is_supervisor: agent.is_supervisor,
      role: agent.users.role
    }

    return NextResponse.json({
      success: true,
      agent: agentInfo
    })

  } catch (error) {
    console.error('Erreur API agent-info:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
