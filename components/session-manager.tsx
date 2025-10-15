"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SessionManagerProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'agent' | 'client'
  redirectTo?: string
  checkInterval?: number // en millisecondes
}

export function SessionManager({ 
  children, 
  requiredRole,
  redirectTo = '/login',
  checkInterval = 5 * 60 * 1000 // 5 minutes par défaut
}: SessionManagerProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkSession = async () => {
    try {
      // Essayer d'abord l'API agent-login
      let response = await fetch('/api/auth/agent-login', {
        method: 'GET',
        credentials: 'include'
      })

      let data = await response.json()

      // Si échec avec agent-login, essayer user-login
      if (!data.success) {
        response = await fetch('/api/auth/user-login', {
          method: 'GET',
          credentials: 'include'
        })
        data = await response.json()
      }

      if (data.success && data.user) {
        // Vérifier le rôle si requis
        if (requiredRole) {
          const userRole = data.user.role
          let hasAccess = false

          if (requiredRole === 'admin') {
            // Pour admin, accepter seulement les admins
            hasAccess = userRole === 'admin'
          } else if (requiredRole === 'agent') {
            // Pour agent, accepter agents et admins
            hasAccess = userRole === 'agent' || userRole === 'admin'
          } else if (requiredRole === 'client') {
            // Pour client, accepter seulement les clients
            hasAccess = userRole === 'client'
          }

          if (!hasAccess) {
            console.log(`❌ Accès refusé - Rôle requis: ${requiredRole}, rôle utilisateur: ${userRole}`)
            setIsAuthenticated(false)
            return
          }
        }

        setIsAuthenticated(true)
        console.log(`✅ Session valide pour ${data.user.role}: ${data.user.email}`)
      } else {
        console.log('❌ Session invalide ou expirée')
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Erreur vérification session:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Vérification initiale
    checkSession()

    // Vérification périodique
    const interval = setInterval(checkSession, checkInterval)

    // Vérification lors du focus de la fenêtre
    const handleFocus = () => {
      checkSession()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkInterval, requiredRole])

  useEffect(() => {
    if (isAuthenticated === false && !isLoading) {
      console.log(`🔄 Redirection vers ${redirectTo}`)
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  // Affichage du loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de la session...</p>
        </div>
      </div>
    )
  }

  // Affichage du contenu si authentifié
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Affichage de redirection si non authentifié
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse rounded-full h-12 w-12 bg-gray-300 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  )
}
