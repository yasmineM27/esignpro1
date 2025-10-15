"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Shield, User, Key } from "lucide-react"

interface AuthStatus {
  hasToken: boolean
  tokenType: string | null
  isValid: boolean
  userRole: string | null
  userId: string | null
  email: string | null
  canAccessAdmin: boolean
  error: string | null
}

export function AdminAuthDiagnostic() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkAuthStatus = async () => {
    setIsChecking(true)
    
    const status: AuthStatus = {
      hasToken: false,
      tokenType: null,
      isValid: false,
      userRole: null,
      userId: null,
      email: null,
      canAccessAdmin: false,
      error: null
    }

    try {
      // Vérifier les cookies côté client
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      // Détecter le type de token
      if (cookies.admin_token) {
        status.hasToken = true
        status.tokenType = 'admin_token'
      } else if (cookies.agent_token) {
        status.hasToken = true
        status.tokenType = 'agent_token'
      } else if (cookies.user_token) {
        status.hasToken = true
        status.tokenType = 'user_token'
      }

      if (!status.hasToken) {
        status.error = 'Aucun token d\'authentification trouvé'
        setAuthStatus(status)
        setIsChecking(false)
        setLastCheck(new Date())
        return
      }

      // Tester l'authentification avec l'API
      const response = await fetch('/api/auth/agent-login', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success && data.user) {
        status.isValid = true
        status.userRole = data.user.role
        status.userId = data.user.id
        status.email = data.user.email
        status.canAccessAdmin = data.user.role === 'admin'
        
        if (!status.canAccessAdmin) {
          status.error = `Rôle insuffisant: ${data.user.role} (admin requis)`
        }
      } else {
        status.error = data.error || 'Token invalide ou expiré'
      }

    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Erreur de connexion'
    }

    setAuthStatus(status)
    setIsChecking(false)
    setLastCheck(new Date())
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (success: boolean, label: string) => {
    return success ? 
      <Badge className="bg-green-100 text-green-800">{label}</Badge> :
      <Badge variant="destructive">{label}</Badge>
  }

  if (!authStatus) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Vérification de l'authentification...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Diagnostic Authentification Admin</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(authStatus.canAccessAdmin, authStatus.canAccessAdmin ? 'Accès OK' : 'Accès Refusé')}
            <Button
              onClick={checkAuthStatus}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Résumé global */}
        <div className={`p-4 rounded-lg ${authStatus.canAccessAdmin ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(authStatus.canAccessAdmin)}
            <span className="font-medium">
              {authStatus.canAccessAdmin ? 'Accès Admin Autorisé' : 'Accès Admin Refusé'}
            </span>
          </div>
          {authStatus.error && (
            <p className="text-sm text-red-600">{authStatus.error}</p>
          )}
        </div>

        {/* Détails de l'authentification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Token</span>
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Présent:</span>
                {getStatusIcon(authStatus.hasToken)}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Type:</span>
                <Badge variant="outline">{authStatus.tokenType || 'Aucun'}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Valide:</span>
                {getStatusIcon(authStatus.isValid)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Utilisateur</span>
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Rôle:</span>
                <Badge variant={authStatus.userRole === 'admin' ? 'default' : 'secondary'}>
                  {authStatus.userRole || 'Inconnu'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="text-xs text-gray-600 truncate max-w-32">
                  {authStatus.email || 'Non disponible'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>ID:</span>
                <span className="text-xs text-gray-600 font-mono">
                  {authStatus.userId ? authStatus.userId.substring(0, 8) + '...' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions recommandées */}
        {!authStatus.canAccessAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Actions Recommandées:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {!authStatus.hasToken && (
                <li>• Connectez-vous avec un compte administrateur</li>
              )}
              {authStatus.hasToken && !authStatus.isValid && (
                <li>• Votre session a expiré, reconnectez-vous</li>
              )}
              {authStatus.isValid && authStatus.userRole !== 'admin' && (
                <li>• Votre compte n'a pas les privilèges administrateur</li>
              )}
            </ul>
          </div>
        )}

        {/* Informations de debug */}
        {lastCheck && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Dernière vérification: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
