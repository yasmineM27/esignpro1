import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les cookies (agent_token ou user_token)
    let token = request.cookies.get('agent_token')?.value
    let tokenType = 'agent_token'

    if (!token) {
      token = request.cookies.get('user_token')?.value
      tokenType = 'user_token'
    }

    console.log(`🔍 API agent-info: ${tokenType} trouvé: ${token ? 'OUI' : 'NON'}`)

    if (!token) {
      console.log('❌ API agent-info: Aucun token trouvé')
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401 }
      )
    }

    // Vérifier et décoder le token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log(`🔍 API agent-info: Token décodé - userId: ${decoded.userId}, role: ${decoded.role}`)
    } catch (error) {
      console.log('❌ API agent-info: Token invalide:', error)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a le rôle agent ou admin
    if (decoded.role !== 'agent' && decoded.role !== 'admin') {
      console.log(`❌ API agent-info: Rôle non autorisé: ${decoded.role}`)
      return NextResponse.json(
        { error: 'Accès réservé aux agents et administrateurs' },
        { status: 403 }
      )
    }

    // Récupérer les informations de l'agent depuis la base de données
    // Si agentId existe dans le token, l'utiliser, sinon chercher par userId
    let agentQuery = supabaseAdmin
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

    if (decoded.agentId) {
      agentQuery = agentQuery.eq('id', decoded.agentId)
    } else {
      agentQuery = agentQuery.eq('user_id', decoded.userId)
    }

    const { data: agent, error: agentError } = await agentQuery.single()

    if (agentError || !agent) {
      console.error('❌ API agent-info: Erreur récupération agent:', agentError)
      console.error('❌ API agent-info: Paramètres de recherche:', {
        agentId: decoded.agentId,
        userId: decoded.userId,
        role: decoded.role
      })
      return NextResponse.json(
        { error: 'Agent non trouvé' },
        { status: 404 }
      )
    }

    console.log(`✅ API agent-info: Agent trouvé: ${agent.agent_code} (${agent.users.first_name} ${agent.users.last_name})`)

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
