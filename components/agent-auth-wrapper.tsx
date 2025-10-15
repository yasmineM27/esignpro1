"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AgentUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  agent?: {
    id: string
    agent_code: string
    department: string
    is_supervisor: boolean
  }
}

interface AgentAuthWrapperProps {
  children: React.ReactNode
}

export function AgentAuthWrapper({ children }: AgentAuthWrapperProps) {
  const [user, setUser] = useState<AgentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Vérification authentification agent...')
        
        // Essayer d'abord l'API agent-login
        let response = await fetch('/api/auth/agent-login', {
          method: 'GET',
          credentials: 'include'
        })

        let data = await response.json()

        // Si échec avec agent-login, essayer user-login
        if (!data.success) {
          console.log('🔍 Tentative avec user-login...')
          response = await fetch('/api/auth/user-login', {
            method: 'GET',
            credentials: 'include'
          })
          data = await response.json()
        }

        if (data.success && data.user) {
          console.log('✅ Utilisateur authentifié:', data.user)
          
          // Vérifier que l'utilisateur a le bon rôle
          if (data.user.role === 'agent' || data.user.role === 'admin') {
            setUser(data.user)
          } else {
            console.log('❌ Rôle non autorisé:', data.user.role)
            setError('Accès réservé aux agents et administrateurs')
            router.push('/login')
          }
        } else {
          console.log('❌ Non authentifié, redirection vers login')
          router.push('/login')
        }
      } catch (error) {
        console.error('❌ Erreur vérification auth:', error)
        setError('Erreur de vérification d\'authentification')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirection vers la page de connexion...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
