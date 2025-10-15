"use client"

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'agent' | 'client'
  agent_code?: string
  department?: string
  is_supervisor?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  logout: () => Promise<void>
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)

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
        setUser(data.user)
        setError(null)
      } else {
        setUser(null)
        setError(data.error || 'Non authentifié')
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error)
      setUser(null)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      setUser(null)
      setError(null)
      
      // Rediriger vers la page de connexion
      window.location.href = '/login'
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  const refreshAuth = () => {
    checkAuth()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
