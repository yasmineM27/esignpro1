"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, LogOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AuthStatus {
  isAuthenticated: boolean
  user: any
  tokenType: string
  error?: string
}

export function AuthTest() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      // Essayer d'abord l'API agent-login
      let response = await fetch('/api/auth/agent-login', {
        method: 'GET',
        credentials: 'include'
      })

      let data = await response.json()
      let tokenType = 'agent_token'

      // Si échec avec agent-login, essayer user-login
      if (!data.success) {
        response = await fetch('/api/auth/user-login', {
          method: 'GET',
          credentials: 'include'
        })
        data = await response.json()
        tokenType = 'user_token'
      }

      setAuthStatus({
        isAuthenticated: data.success,
        user: data.user || null,
        tokenType,
        error: data.error
      })
    } catch (error) {
      setAuthStatus({
        isAuthenticated: false,
        user: null,
        tokenType: 'none',
        error: 'Erreur de connexion'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Déconnexion réussie",
          description: "Tous les tokens ont été supprimés"
        })
        
        setAuthStatus({
          isAuthenticated: false,
          user: null,
          tokenType: 'none'
        })
      } else {
        throw new Error(data.error || 'Erreur de déconnexion')
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>État d'Authentification</span>
          <Button
            variant="outline"
            size="sm"
            onClick={checkAuth}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {authStatus && (
          <>
            <div className="flex items-center space-x-2">
              {authStatus.isAuthenticated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {authStatus.isAuthenticated ? 'Connecté' : 'Non connecté'}
              </span>
            </div>

            {authStatus.user && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Nom:</strong> {authStatus.user.first_name} {authStatus.user.last_name}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {authStatus.user.email}
                </p>
                <div className="flex items-center space-x-2">
                  <strong className="text-sm">Rôle:</strong>
                  <Badge variant={
                    authStatus.user.role === 'admin' ? 'destructive' :
                    authStatus.user.role === 'agent' ? 'default' : 'secondary'
                  }>
                    {authStatus.user.role}
                  </Badge>
                </div>
                <p className="text-sm">
                  <strong>Token:</strong> {authStatus.tokenType}
                </p>
              </div>
            )}

            {authStatus.error && (
              <p className="text-sm text-red-600">
                <strong>Erreur:</strong> {authStatus.error}
              </p>
            )}

            {authStatus.isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Tester Déconnexion
              </Button>
            )}
          </>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Vérification...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
