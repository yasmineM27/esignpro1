"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Users, FileText, Settings } from "lucide-react"

interface AdminAPIStatus {
  name: string
  endpoint: string
  status: 'success' | 'error' | 'loading'
  data?: any
  error?: string
  duration?: number
}

export function AdminDiagnostic() {
  const [apiStatuses, setApiStatuses] = useState<AdminAPIStatus[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const adminAPIs = [
    { name: 'Dashboard Stats', endpoint: '/api/admin/dashboard-stats', icon: Database },
    { name: 'Users Management', endpoint: '/api/admin/users', icon: Users },
    { name: 'Agents Management', endpoint: '/api/admin/agents', icon: Users },
    { name: 'Clients Management', endpoint: '/api/admin/clients', icon: Users },
    { name: 'Cases Management', endpoint: '/api/admin/cases', icon: FileText },
    { name: 'System Settings', endpoint: '/api/admin/settings', icon: Settings }
  ]

  const checkAdminAPIs = async () => {
    setIsChecking(true)
    
    // Initialiser avec le statut loading
    const initialStatuses = adminAPIs.map(api => ({
      name: api.name,
      endpoint: api.endpoint,
      status: 'loading' as const
    }))
    setApiStatuses(initialStatuses)
    
    // Tester chaque API
    for (let i = 0; i < adminAPIs.length; i++) {
      const api = adminAPIs[i]
      const startTime = Date.now()
      
      try {
        const response = await fetch(api.endpoint, {
          method: 'GET',
          credentials: 'include'
        })
        
        const duration = Date.now() - startTime
        
        if (response.ok) {
          const data = await response.json()
          setApiStatuses(prev => prev.map((status, index) => 
            index === i ? {
              ...status,
              status: 'success' as const,
              data: data,
              duration
            } : status
          ))
        } else {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
          setApiStatuses(prev => prev.map((status, index) => 
            index === i ? {
              ...status,
              status: 'error' as const,
              error: errorData.error || `HTTP ${response.status}`,
              duration
            } : status
          ))
        }
      } catch (error) {
        const duration = Date.now() - startTime
        setApiStatuses(prev => prev.map((status, index) => 
          index === i ? {
            ...status,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            duration
          } : status
        ))
      }
    }
    
    setIsChecking(false)
    setLastCheck(new Date())
  }

  useEffect(() => {
    checkAdminAPIs()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'loading':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      case 'loading':
        return <Badge variant="secondary">Test...</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getOverallStatus = () => {
    if (apiStatuses.length === 0) return 'loading'
    
    const hasLoading = apiStatuses.some(api => api.status === 'loading')
    if (hasLoading) return 'loading'
    
    const hasError = apiStatuses.some(api => api.status === 'error')
    if (hasError) return 'error'
    
    return 'success'
  }

  const successCount = apiStatuses.filter(api => api.status === 'success').length
  const errorCount = apiStatuses.filter(api => api.status === 'error').length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Diagnostic Interface Admin</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(getOverallStatus())}
            <Button
              onClick={checkAdminAPIs}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        
        {/* Résumé */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>✅ {successCount} OK</span>
          <span>❌ {errorCount} Erreurs</span>
          {lastCheck && (
            <span>🕒 {lastCheck.toLocaleTimeString()}</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiStatuses.map((api, index) => {
            const IconComponent = adminAPIs[index]?.icon || Database
            
            return (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">{api.name}</span>
                  </div>
                  {getStatusIcon(api.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {api.endpoint}
                  </code>
                  {getStatusBadge(api.status)}
                </div>
                
                {api.duration && (
                  <div className="text-xs text-gray-600">
                    Durée: {api.duration}ms
                  </div>
                )}
                
                {api.error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {api.error}
                  </div>
                )}
                
                {api.data && api.status === 'success' && (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    {api.name === 'Dashboard Stats' && api.data.data && (
                      <div>
                        Agents: {api.data.data.activeAgents} | 
                        Docs: {api.data.data.totalDocuments} | 
                        Signatures: {api.data.data.todaySignatures}
                      </div>
                    )}
                    {api.name === 'Users Management' && api.data.users && (
                      <div>{api.data.users.length} utilisateurs</div>
                    )}
                    {api.name === 'Agents Management' && api.data.agents && (
                      <div>{api.data.agents.length} agents</div>
                    )}
                    {api.name === 'Clients Management' && api.data.clients && (
                      <div>{api.data.clients.length} clients</div>
                    )}
                    {api.name === 'Cases Management' && api.data.cases && (
                      <div>{api.data.cases.length} dossiers</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
