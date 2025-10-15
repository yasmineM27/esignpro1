"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"
import Link from "next/link"
import { ErrorMonitor } from "@/components/error-monitor"
import { SystemStatus } from "@/components/system-status"
import { AdminDiagnostic } from "@/components/admin-diagnostic"
import { SignatureErrorTest } from "@/components/signature-error-test"
import { AdminAuthDiagnostic } from "@/components/admin-auth-diagnostic"

interface TestResult {
  name: string
  url: string
  status: 'success' | 'error' | 'loading'
  data?: any
  error?: string
  duration?: number
}

export default function APITestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const apis = [
    { name: 'Completed Cases', url: '/api/agent/completed-cases?limit=5' },
    { name: 'All Cases', url: '/api/agent/all-cases?status=all&limit=5' },
    { name: 'Navigation Stats', url: '/api/agent/navigation-stats' },
    { name: 'Agent Login Check', url: '/api/auth/agent-login' },
    { name: 'User Login Check', url: '/api/auth/user-login' }
  ]

  const testAPI = async (api: { name: string; url: string }): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch(api.url, {
        method: 'GET',
        credentials: 'include'
      })
      
      const data = await response.json()
      const duration = Date.now() - startTime
      
      return {
        name: api.name,
        url: api.url,
        status: response.ok ? 'success' : 'error',
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error || `HTTP ${response.status}`,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: api.name,
        url: api.url,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])
    
    // Initialiser avec le statut loading
    const initialResults = apis.map(api => ({
      name: api.name,
      url: api.url,
      status: 'loading' as const
    }))
    setResults(initialResults)
    
    // Tester chaque API
    for (let i = 0; i < apis.length; i++) {
      const result = await testAPI(apis[i])
      
      setResults(prev => prev.map((r, index) => 
        index === i ? result : r
      ))
    }
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'loading':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Succès</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      case 'loading':
        return <Badge variant="secondary">Test...</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test des APIs</h1>
            <p className="text-gray-600">Diagnostic des endpoints de l'application</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Test en cours...' : 'Lancer les tests'}</span>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Retour</Link>
            </Button>
          </div>
        </div>

        {/* Statut système */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SystemStatus />
        </div>

        {/* Diagnostic Admin */}
        <div className="mb-6">
          <AdminDiagnostic />
        </div>

        {/* Test Corrections Signature */}
        <div className="mb-6">
          <SignatureErrorTest />
        </div>

        {/* Diagnostic Authentification Admin */}
        <div className="mb-6">
          <AdminAuthDiagnostic />
        </div>

        {/* Résultats */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{result.name}</span>
                    {getStatusIcon(result.status)}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {result.url}
                    </code>
                    {getStatusBadge(result.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.duration && (
                    <p className="text-sm text-gray-600">
                      <strong>Durée:</strong> {result.duration}ms
                    </p>
                  )}
                  
                  {result.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800">
                        <strong>Erreur:</strong> {result.error}
                      </p>
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800 mb-2">
                        <strong>Données reçues:</strong>
                      </p>
                      <pre className="text-xs text-green-700 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2).substring(0, 300)}
                        {JSON.stringify(result.data, null, 2).length > 300 ? '...' : ''}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        {results.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Cliquez sur "Lancer les tests" pour vérifier le bon fonctionnement des APIs.</p>
              <div className="space-y-2">
                <h4 className="font-medium">APIs testées :</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {apis.map((api, index) => (
                    <li key={index}>
                      <strong>{api.name}</strong> - <code>{api.url}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monitor d'erreurs */}
      <ErrorMonitor />
    </div>
  )
}
