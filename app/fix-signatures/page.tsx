'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  User, 
  FileSignature,
  Settings,
  Zap
} from 'lucide-react'

interface SignatureProblem {
  type: string
  clientId: string
  clientName: string
  clientCode: string
  issue: string
  signatures: Array<{
    id: string
    name: string
    active: boolean
    default: boolean
    created: string
  }>
}

interface DiagnosticStats {
  totalClients: number
  totalSignatures: number
  clientsWithSignatures: number
  clientsWithProblems: number
  problemTypes: {
    inactive_signatures: number
    no_default_signature: number
    multiple_default_signatures: number
  }
}

export default function FixSignaturesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<{
    stats: DiagnosticStats
    problems: SignatureProblem[]
    clientsWithSignatures: any[]
  } | null>(null)
  const { toast } = useToast()

  const runDiagnostic = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/fix-client-signatures')
      const data = await response.json()

      if (data.success) {
        setDiagnosticData(data)
        toast({
          title: "✅ Diagnostic terminé",
          description: `${data.stats.clientsWithProblems} problèmes détectés sur ${data.stats.totalClients} clients`,
          variant: "default"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur diagnostic:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors du diagnostic des signatures",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fixAllProblems = async () => {
    setIsFixing(true)
    try {
      const response = await fetch('/api/fix-client-signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_all_problems' })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "🎉 Corrections appliquées !",
          description: data.message,
          variant: "default"
        })
        
        // Relancer le diagnostic
        await runDiagnostic()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur correction:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la correction des signatures",
        variant: "destructive"
      })
    } finally {
      setIsFixing(false)
    }
  }

  const fixSpecificProblem = async (clientId: string, action: string, signatureId?: string) => {
    try {
      const response = await fetch('/api/fix-client-signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, clientId, signatureId })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Correction appliquée",
          description: data.message,
          variant: "default"
        })
        
        // Relancer le diagnostic
        await runDiagnostic()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erreur correction spécifique:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la correction",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getProblemIcon = (type: string) => {
    switch (type) {
      case 'inactive_signatures':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'no_default_signature':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'multiple_default_signatures':
        return <Settings className="h-5 w-5 text-orange-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getProblemColor = (type: string) => {
    switch (type) {
      case 'inactive_signatures':
        return 'border-red-200 bg-red-50'
      case 'no_default_signature':
        return 'border-yellow-200 bg-yellow-50'
      case 'multiple_default_signatures':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileSignature className="h-8 w-8 text-blue-600" />
                Diagnostic et Correction des Signatures
              </h1>
              <p className="text-gray-600 mt-2">
                Identifier et corriger les problèmes de signatures clients
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={runDiagnostic}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser Diagnostic
              </Button>
              {diagnosticData && diagnosticData.problems.length > 0 && (
                <Button 
                  onClick={fixAllProblems}
                  disabled={isFixing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Zap className={`h-4 w-4 mr-2 ${isFixing ? 'animate-pulse' : ''}`} />
                  {isFixing ? 'Correction...' : 'Corriger Tout'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {diagnosticData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{diagnosticData.stats.totalClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileSignature className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avec Signatures</p>
                    <p className="text-2xl font-bold text-gray-900">{diagnosticData.stats.clientsWithSignatures}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avec Problèmes</p>
                    <p className="text-2xl font-bold text-gray-900">{diagnosticData.stats.clientsWithProblems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fonctionnels</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {diagnosticData.stats.clientsWithSignatures - diagnosticData.stats.clientsWithProblems}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Problèmes détectés */}
        {diagnosticData && diagnosticData.problems.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Problèmes Détectés ({diagnosticData.problems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticData.problems.map((problem, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${getProblemColor(problem.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getProblemIcon(problem.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {problem.clientName}
                            <Badge variant="outline" className="ml-2">
                              {problem.clientCode}
                            </Badge>
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{problem.issue}</p>
                          
                          {/* Détails des signatures */}
                          <div className="mt-3 space-y-2">
                            {problem.signatures.map((sig) => (
                              <div key={sig.id} className="flex items-center gap-2 text-xs">
                                <span className="font-medium">{sig.name}</span>
                                <Badge variant={sig.active ? "default" : "secondary"}>
                                  {sig.active ? "Active" : "Inactive"}
                                </Badge>
                                {sig.default && (
                                  <Badge variant="outline">Par défaut</Badge>
                                )}
                                <span className="text-gray-500">
                                  {new Date(sig.created).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {problem.type === 'inactive_signatures' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fixSpecificProblem(problem.clientId, 'activate_all_signatures')}
                          >
                            Activer Tout
                          </Button>
                        )}
                        {problem.type === 'no_default_signature' && problem.signatures.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fixSpecificProblem(
                              problem.clientId, 
                              'set_default_signature', 
                              problem.signatures[0].id
                            )}
                          >
                            Définir Défaut
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clients avec signatures fonctionnelles */}
        {diagnosticData && diagnosticData.clientsWithSignatures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Clients avec Signatures ({diagnosticData.clientsWithSignatures.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diagnosticData.clientsWithSignatures.map((client) => (
                  <div
                    key={client.clientId}
                    className={`p-4 border rounded-lg ${
                      client.activeCount > 0 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{client.clientName}</h4>
                        <p className="text-sm text-gray-600">{client.clientCode}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">
                            {client.signatureCount} signature{client.signatureCount > 1 ? 's' : ''}
                          </Badge>
                          <Badge variant={client.activeCount > 0 ? "default" : "secondary"}>
                            {client.activeCount} active{client.activeCount > 1 ? 's' : ''}
                          </Badge>
                          {client.defaultCount > 0 && (
                            <Badge variant="outline">
                              {client.defaultCount} défaut
                            </Badge>
                          )}
                        </div>
                      </div>
                      {client.activeCount > 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* État de chargement */}
        {isLoading && !diagnosticData && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Diagnostic en cours...</span>
          </div>
        )}
      </div>
    </div>
  )
}
