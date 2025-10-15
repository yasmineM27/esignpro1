"use client"

import { useState, useEffect } from 'react'

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

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  })

  const checkAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

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
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null
        })
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: data.error || 'Non authentifié'
        })
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Erreur de connexion'
      })
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      })
      
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

  return {
    ...authState,
    logout,
    refreshAuth,
    checkAuth
  }
}
