"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Database, Server, Wifi, RefreshCw } from "lucide-react"

interface SystemStatus {
  database: 'online' | 'offline' | 'checking'
  apis: 'online' | 'offline' | 'checking'
  auth: 'online' | 'offline' | 'checking'
  lastCheck: Date | null
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    apis: 'checking',
    auth: 'checking',
    lastCheck: null
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkSystemHealth = async () => {
    setIsChecking(true)
    
    // Test de la base de données via une API simple
    let dbStatus: 'online' | 'offline' = 'offline'
    try {
      const response = await fetch('/api/auth/agent-login', {
        method: 'GET',
        credentials: 'include'
      })
      // Même si l'auth échoue, si on a une réponse, la DB fonctionne
      if (response.status === 200 || response.status === 401) {
        dbStatus = 'online'
      }
    } catch (error) {
      console.error('DB check failed:', error)
    }

    // Test des APIs principales
    let apiStatus: 'online' | 'offline' = 'offline'
    try {
      const response = await fetch('/api/agent/navigation-stats')
      if (response.status === 200 || response.status === 401) {
        apiStatus = 'online'
      }
    } catch (error) {
      console.error('API check failed:', error)
    }

    // Test de l'authentification
    let authStatus: 'online' | 'offline' = 'offline'
    try {
      const response1 = await fetch('/api/auth/agent-login', { method: 'GET', credentials: 'include' })
      const response2 = await fetch('/api/auth/user-login', { method: 'GET', credentials: 'include' })
      
      if ((response1.status === 200 || response1.status === 401) && 
          (response2.status === 200 || response2.status === 401)) {
        authStatus = 'online'
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }

    setStatus({
      database: dbStatus,
      apis: apiStatus,
      auth: authStatus,
      lastCheck: new Date()
    })
    
    setIsChecking(false)
  }

  useEffect(() => {
    checkSystemHealth()
    
    // Vérification automatique toutes les 30 secondes
    const interval = setInterval(checkSystemHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'offline':
        return 'text-red-500'
      case 'checking':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">En ligne</Badge>
      case 'offline':
        return <Badge variant="destructive">Hors ligne</Badge>
      case 'checking':
        return <Badge variant="secondary">Vérification...</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getOverallStatus = () => {
    if (status.database === 'checking' || status.apis === 'checking' || status.auth === 'checking') {
      return 'checking'
    }
    if (status.database === 'online' && status.apis === 'online' && status.auth === 'online') {
      return 'online'
    }
    return 'offline'
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className={`h-5 w-5 ${getStatusColor(getOverallStatus())}`} />
            <span>État du Système</span>
          </div>
          <Button
            onClick={checkSystemHealth}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut global */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Statut Global</span>
          {getStatusBadge(getOverallStatus())}
        </div>

        {/* Détails des composants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className={`h-4 w-4 ${getStatusColor(status.database)}`} />
              <span className="text-sm">Base de données</span>
            </div>
            {getStatusBadge(status.database)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className={`h-4 w-4 ${getStatusColor(status.apis)}`} />
              <span className="text-sm">APIs</span>
            </div>
            {getStatusBadge(status.apis)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className={`h-4 w-4 ${getStatusColor(status.auth)}`} />
              <span className="text-sm">Authentification</span>
            </div>
            {getStatusBadge(status.auth)}
          </div>
        </div>

        {/* Dernière vérification */}
        {status.lastCheck && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Dernière vérification: {status.lastCheck.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
