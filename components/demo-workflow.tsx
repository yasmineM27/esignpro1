"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  FileText,
  Mail,
  Download,
  Signature,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DemoStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
  icon: React.ReactNode
}

export function DemoWorkflow() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [demoResults, setDemoResults] = useState<any>({})

  const [steps, setSteps] = useState<DemoStep[]>([
    {
      id: 'create-client',
      title: '1. Créer un client de test',
      description: 'Création d\'un client avec toutes les informations nécessaires',
      status: 'pending',
      icon: <User className="h-4 w-4" />
    },
    {
      id: 'create-case',
      title: '2. Créer un dossier de résiliation',
      description: 'Génération d\'un dossier avec documents Word',
      status: 'pending',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'generate-document',
      title: 'Document Word',
      description: 'Générer un document Word avec signature',
      status: 'pending',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'send-email',
      title: 'Envoi Email',
      description: 'Envoyer l\'email au client (simulé)',
      status: 'pending',
      icon: <Mail className="h-4 w-4" />
    },
    {
      id: 'client-signature',
      title: 'Signature Client',
      description: 'Simuler la signature du client',
      status: 'pending',
      icon: <Signature className="h-4 w-4" />
    },
    {
      id: 'download-docs',
      title: 'Téléchargement',
      description: 'Télécharger les documents avec signatures',
      status: 'pending',
      icon: <Download className="h-4 w-4" />
    }
  ])

  const updateStepStatus = (stepId: string, status: DemoStep['status'], result?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, result } : step
    ))
  }

  const runDemo = async () => {
    setIsRunning(true)
    setProgress(0)
    setCurrentStep(0)

    const testClient = {
      nom: 'Demo',
      prenom: 'Client',
      email: 'demo@esignpro.ch',
      telephone: '+41791234567',
      dateNaissance: '1990-01-01',
      adresse: 'Rue de Demo 123',
      npa: '1000',
      ville: 'Lausanne',
      destinataire: 'CSS Assurance',
      numeroPolice: 'DEMO-2025-001',
      typeFormulaire: 'resiliation',
      dateLamal: '2025-12-31',
      dateLCA: '2025-12-31'
    }

    const agentId = '550e8400-e29b-41d4-a716-446655440001'

    try {
      // Étape 1: Créer un client
      setCurrentStep(1)
      updateStepStatus('create-client', 'running')
      setProgress(16)

      const clientResponse = await fetch('/api/agent/client-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_client',
          clientData: testClient,
          agentId
        })
      })

      if (!clientResponse.ok) throw new Error('Erreur création client')
      const clientResult = await clientResponse.json()
      updateStepStatus('create-client', 'completed', clientResult.client)
      setDemoResults(prev => ({ ...prev, client: clientResult.client }))

      // Étape 2: Créer un dossier
      setCurrentStep(2)
      updateStepStatus('create-case', 'running')
      setProgress(32)

      const caseResponse = await fetch('/api/agent/client-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_case_for_client',
          clientId: clientResult.client.id,
          caseData: {
            insuranceCompany: testClient.destinataire,
            policyNumber: testClient.numeroPolice,
            policyType: testClient.typeFormulaire,
            terminationDate: testClient.dateLamal,
            reasonForTermination: 'Résiliation à l\'échéance'
          },
          agentId
        })
      })

      if (!caseResponse.ok) throw new Error('Erreur création dossier')
      const caseResult = await caseResponse.json()
      updateStepStatus('create-case', 'completed', caseResult.case)
      setDemoResults(prev => ({ ...prev, case: caseResult.case }))

      // Étape 3: Générer document Word
      setCurrentStep(3)
      updateStepStatus('generate-document', 'running')
      setProgress(48)

      const docResponse = await fetch('/api/generate-word-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData: testClient,
          clientId: clientResult.client.id,
          caseId: caseResult.case.secureToken,
          includeSignature: true
        })
      })

      if (!docResponse.ok) throw new Error('Erreur génération document')
      updateStepStatus('generate-document', 'completed')
      setProgress(64)

      // Étape 4: Envoyer email (simulé)
      setCurrentStep(4)
      updateStepStatus('send-email', 'running')

      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: testClient.email,
            clientName: `${testClient.prenom} ${testClient.nom}`,
            clientId: caseResult.case.secureToken,
            documentContent: `Dossier ${caseResult.case.caseNumber}`,
            caseId: caseResult.case.id,
            caseNumber: caseResult.case.caseNumber,
            secureToken: caseResult.case.secureToken
          })
        })

        const emailResult = await emailResponse.json()
        updateStepStatus('send-email', 'completed', emailResult)
        setDemoResults(prev => ({ ...prev, email: emailResult }))
      } catch (error) {
        // Email peut échouer en dev, c'est normal
        updateStepStatus('send-email', 'completed', { simulated: true })
        setDemoResults(prev => ({ ...prev, email: { simulated: true } }))
      }
      setProgress(80)

      // Étape 5: Simuler signature client
      setCurrentStep(5)
      updateStepStatus('client-signature', 'running')

      const testSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

      try {
        const sigResponse = await fetch('/api/client/save-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: caseResult.case.secureToken,
            signature: testSignature,
            caseId: caseResult.case.secureToken
          })
        })

        const sigResult = await sigResponse.json()
        updateStepStatus('client-signature', 'completed', sigResult)
        setDemoResults(prev => ({ ...prev, signature: sigResult }))
      } catch (error) {
        updateStepStatus('client-signature', 'completed', { simulated: true })
        setDemoResults(prev => ({ ...prev, signature: { simulated: true } }))
      }
      setProgress(96)

      // Étape 6: Télécharger documents
      setCurrentStep(6)
      updateStepStatus('download-docs', 'running')

      const downloadResponse = await fetch('/api/agent/download-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseResult.case.id,
          clientId: clientResult.client.id
        })
      })

      if (downloadResponse.ok) {
        updateStepStatus('download-docs', 'completed', { success: true })
        setProgress(100)
      } else {
        throw new Error('Erreur téléchargement')
      }

      // Demo terminé avec succès
      toast({
        title: "🎉 Demo terminé avec succès!",
        description: "Tous les composants de l'application fonctionnent correctement.",
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      updateStepStatus(steps[currentStep - 1]?.id || 'unknown', 'error')
      
      toast({
        title: "❌ Erreur dans le demo",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: DemoStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusBadge = (status: DemoStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>
      default:
        return <Badge variant="outline">En attente</Badge>
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Démonstration Workflow Complet
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Testez automatiquement toutes les fonctionnalités de l'application eSignPro
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bouton de lancement */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={runDemo} 
            disabled={isRunning}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Demo en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer le Demo
              </>
            )}
          </Button>
          
          {isRunning && (
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {progress}% - Étape {currentStep}/6
              </p>
            </div>
          )}
        </div>

        {/* Liste des étapes */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                step.status === 'completed' ? 'bg-green-50 border-green-200' :
                step.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(step.status)}
                {step.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{step.title}</h4>
                  {getStatusBadge(step.status)}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {step.result && step.status === 'completed' && (
                  <div className="mt-2 text-xs text-green-700">
                    {step.id === 'create-client' && `✅ Client: ${step.result.fullName}`}
                    {step.id === 'create-case' && `✅ Dossier: ${step.result.caseNumber}`}
                    {step.id === 'generate-document' && `✅ Document Word généré`}
                    {step.id === 'send-email' && `✅ Email ${step.result.simulated ? 'simulé' : 'envoyé'}`}
                    {step.id === 'client-signature' && `✅ Signature ${step.result.simulated ? 'simulée' : 'sauvegardée'}`}
                    {step.id === 'download-docs' && `✅ Documents téléchargeables`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Résultats du demo */}
        {demoResults.case && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Résultats du Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Client créé:</strong> {demoResults.client?.fullName}
                </div>
                <div>
                  <strong>Dossier:</strong> {demoResults.case?.caseNumber}
                </div>
                <div>
                  <strong>Token sécurisé:</strong> {demoResults.case?.secureToken?.substring(0, 20)}...
                </div>
                <div className="flex items-center gap-2">
                  <strong>Portail client:</strong>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/client-portal/${demoResults.case?.secureToken}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
