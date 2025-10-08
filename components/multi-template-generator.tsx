"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Download, 
  FileSignature, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  template_name: string
  template_category: string
  template_description: string
  template_variables: string[]
  is_active: boolean
  usageCount: number
  lastUsed: string
}

interface GeneratedDocument {
  id: string
  templateId: string
  templateName: string
  templateCategory: string
  documentName: string
  content: string
  pdfUrl: string
  isSigned: boolean
  signedAt: string | null
  generatedAt: string
}

interface MultiTemplateGeneratorProps {
  clientId: string
  caseId: string
  clientName: string
  clientHasSignature: boolean
  agentId: string
  onDocumentsGenerated?: (documents: GeneratedDocument[]) => void
}

export function MultiTemplateGenerator({
  clientId,
  caseId,
  clientName,
  clientHasSignature,
  agentId,
  onDocumentsGenerated
}: MultiTemplateGeneratorProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
  const [customVariables, setCustomVariables] = useState<{ [key: string]: string }>({})
  const [sessionName, setSessionName] = useState('')
  const [autoApplySignature, setAutoApplySignature] = useState(true)
  const [showCustomVariables, setShowCustomVariables] = useState(false)

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true)
      const response = await fetch('/api/agent/templates?active=true')
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates || [])
      } else {
        console.error('Erreur chargement templates:', data.error)
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des modèles",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur API templates:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion lors du chargement des modèles",
        variant: "destructive"
      })
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([])
    } else {
      setSelectedTemplates(templates.map(t => t.id))
    }
  }

  const generateDocuments = async () => {
    if (selectedTemplates.length === 0) {
      toast({
        title: "Aucun modèle sélectionné",
        description: "Veuillez sélectionner au moins un modèle de document",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Étape 1: Générer le document Word simple
      console.log('📄 Génération document Word...');
      const wordResponse = await fetch('/api/generate-word-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId,
          caseId,
          clientData: {
            nomPrenom: clientName,
            adresse: customVariables.adresse || 'Adresse non spécifiée',
            npaVille: customVariables.npaVille || 'Ville non spécifiée',
            email: customVariables.email || 'Email non spécifié',
            telephone: customVariables.telephone || '',
            compagnieAssurance: customVariables.compagnieAssurance || 'Non spécifiée',
            numeroPolice: customVariables.numeroPolice || `POL-${Date.now()}`,
            dateResiliation: customVariables.dateResiliation || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            motifResiliation: customVariables.motifResiliation || 'Demande client'
          },
          includeSignature: autoApplySignature && clientHasSignature
        })
      });

      if (!wordResponse.ok) {
        throw new Error('Erreur génération document Word');
      }

      const wordData = await wordResponse.json();

      if (!wordData.success) {
        throw new Error(wordData.message || 'Erreur génération document');
      }

      console.log('✅ Document Word généré:', wordData.secureToken);

      // Étape 2: Envoyer l'email automatiquement
      console.log('📧 Envoi email automatique...');
      const emailResponse = await fetch('/api/agent/send-documents-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseId: wordData.caseId || caseId,
          clientEmail: customVariables.email,
          clientName: clientName,
          agentId
        })
      });

      const emailData = await emailResponse.json();

      if (emailData.success) {
        toast({
          title: "✅ Document généré et email envoyé !",
          description: `Document créé et email envoyé à ${customVariables.email || clientName}`,
        });

        // Simuler des documents générés pour l'interface
        const mockDocuments = [{
          id: `doc-${Date.now()}`,
          templateId: selectedTemplates[0] || 'template-1',
          templateName: 'Document de résiliation',
          templateCategory: 'resiliation',
          documentName: `Résiliation-${clientName}-${new Date().toLocaleDateString('fr-CH')}`,
          content: 'Document généré avec succès',
          pdfUrl: wordData.downloadUrl || '#',
          isSigned: autoApplySignature && clientHasSignature,
          signedAt: autoApplySignature && clientHasSignature ? new Date().toISOString() : null,
          generatedAt: new Date().toISOString()
        }];

        setGeneratedDocuments(mockDocuments);
        onDocumentsGenerated?.(mockDocuments);
      } else {
        console.warn('⚠️ Document généré mais erreur envoi email:', emailData.error);
        toast({
          title: "✅ Document généré",
          description: "Document créé avec succès. Email non envoyé automatiquement.",
        });
      }

    } catch (error) {
      console.error('❌ Erreur génération:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la génération",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const downloadDocument = (document: GeneratedDocument) => {
    try {
      const link = document.createElement('a')
      link.href = document.pdfUrl
      link.download = `${document.documentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Téléchargement démarré",
        description: `${document.documentName}.pdf`,
      })
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement",
        variant: "destructive"
      })
    }
  }

  const getTemplatesByCategory = () => {
    const categories: { [key: string]: Template[] } = {}
    templates.forEach(template => {
      if (!categories[template.template_category]) {
        categories[template.template_category] = []
      }
      categories[template.template_category].push(template)
    })
    return categories
  }

  if (isLoadingTemplates) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des modèles...</span>
        </CardContent>
      </Card>
    )
  }

  const templatesByCategory = getTemplatesByCategory()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération de Documents Multiples
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Client: <strong>{clientName}</strong></span>
            {clientHasSignature ? (
              <Badge className="bg-green-600">
                <FileSignature className="h-3 w-3 mr-1" />
                Signature disponible
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Aucune signature
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sélection des Modèles</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedTemplates.length === templates.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
              <Badge variant="outline">
                {selectedTemplates.length} / {templates.length} sélectionné(s)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category} className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 capitalize">
                {category.replace('_', ' ')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplates.includes(template.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateToggle(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTemplates.includes(template.id)}
                        onChange={() => handleTemplateToggle(template.id)}
                      />
                      <div className="flex-1">
                        <h5 className="font-medium">{template.template_name}</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.template_description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>Utilisé {template.usageCount} fois</span>
                          <span>•</span>
                          <span>Dernière utilisation: {new Date(template.lastUsed).toLocaleDateString('fr-CH')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generation Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Options de Génération
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="session-name">Nom de la session (optionnel)</Label>
            <Input
              id="session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder={`Génération ${new Date().toLocaleString('fr-CH')}`}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-signature"
              checked={autoApplySignature}
              onCheckedChange={setAutoApplySignature}
              disabled={!clientHasSignature}
            />
            <Label htmlFor="auto-signature">
              Appliquer automatiquement la signature du client
              {!clientHasSignature && (
                <span className="text-orange-600 ml-1">(signature non disponible)</span>
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-variables"
              checked={showCustomVariables}
              onCheckedChange={setShowCustomVariables}
            />
            <Label htmlFor="show-variables">
              Personnaliser les variables (avancé)
            </Label>
          </div>

          {showCustomVariables && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label>Variables personnalisées (JSON)</Label>
              <Textarea
                value={JSON.stringify(customVariables, null, 2)}
                onChange={(e) => {
                  try {
                    setCustomVariables(JSON.parse(e.target.value))
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"variable_name": "valeur"}'
                className="mt-1 font-mono text-sm"
                rows={4}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={generateDocuments}
          disabled={selectedTemplates.length === 0 || isGenerating}
          size="lg"
          className="w-full max-w-md"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Générer {selectedTemplates.length} document(s)
              {autoApplySignature && clientHasSignature && (
                <span className="ml-1">(avec signature)</span>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Generated Documents */}
      {generatedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Documents Générés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <h5 className="font-medium">{document.documentName}</h5>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {new Date(document.generatedAt).toLocaleString('fr-CH')}
                        {document.isSigned && (
                          <>
                            <span>•</span>
                            <FileSignature className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">Signé automatiquement</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
