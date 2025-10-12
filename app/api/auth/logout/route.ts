import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Créer une réponse de succès
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    })

    // Supprimer tous les cookies d'authentification
    response.cookies.delete('agent_token')
    response.cookies.delete('user_token')
    response.cookies.delete('admin_token')
    response.cookies.delete('user-role')
    response.cookies.delete('auth-token')

    // Définir des cookies expirés pour s'assurer qu'ils sont supprimés
    response.cookies.set('agent_token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    response.cookies.set('user_token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    response.cookies.set('admin_token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}
