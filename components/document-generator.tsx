"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  Download, 
  Eye, 
  PenTool, 
  CheckCircle,
  Plus,
  Minus,
  Calendar,
  Building,
  User
} from "lucide-react"

interface Person {
  name: string
  birthdate: string
  policyNumber: string
  isAdult: boolean
}

interface DocumentGeneratorProps {
  caseId: string
  clientData?: {
    name: string
    address: string
    postalCity: string
    birthdate?: string
    email?: string
    phone?: string
  }
  advisorData?: {
    name: string
    email: string
    phone: string
  }
}

export default function DocumentGenerator({ caseId, clientData, advisorData }: DocumentGeneratorProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const [documentType, setDocumentType] = useState<string>("")
  
  // Form data for OPSIO sheet
  const [opsioData, setOpsioData] = useState({
    paymentMethod: 'commission' as 'commission' | 'fees'
  })
  
  // Form data for resignation letter
  const [resignationData, setResignationData] = useState({
    insuranceCompany: '',
    companyAddress: '',
    companyPostalCity: '',
    lamalTerminationDate: '',
    lcaTerminationDate: '',
    persons: [
      { name: clientData?.name || '', birthdate: clientData?.birthdate || '', policyNumber: '', isAdult: true }
    ] as Person[]
  })

  const addPerson = () => {
    if (resignationData.persons.length < 4) {
      setResignationData(prev => ({
        ...prev,
        persons: [...prev.persons, { name: '', birthdate: '', policyNumber: '', isAdult: true }]
      }))
    }
  }

  const removePerson = (index: number) => {
    if (resignationData.persons.length > 1) {
      setResignationData(prev => ({
        ...prev,
        persons: prev.persons.filter((_, i) => i !== index)
      }))
    }
  }

  const updatePerson = (index: number, field: keyof Person, value: string | boolean) => {
    setResignationData(prev => ({
      ...prev,
      persons: prev.persons.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }))
  }

  const generateDocument = async () => {
    if (!documentType) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de document",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      let documentData: any = {
        clientName: clientData?.name || '',
        clientAddress: clientData?.address || '',
        clientPostalCity: clientData?.postalCity || '',
        clientBirthdate: clientData?.birthdate || '',
        clientEmail: clientData?.email || '',
        clientPhone: clientData?.phone || '',
        advisorName: advisorData?.name || '',
        advisorEmail: advisorData?.email || '',
        advisorPhone: advisorData?.phone || ''
      }

      if (documentType === 'opsio-info-sheet') {
        documentData.paymentMethod = opsioData.paymentMethod
      } else if (documentType === 'resignation-letter') {
        documentData = {
          ...documentData,
          insuranceCompany: resignationData.insuranceCompany,
          companyAddress: resignationData.companyAddress,
          companyPostalCity: resignationData.companyPostalCity,
          lamalTerminationDate: resignationData.lamalTerminationDate,
          lcaTerminationDate: resignationData.lcaTerminationDate,
          persons: resignationData.persons.filter(p => p.name.trim() !== '')
        }
      }

      // Préparer les données pour l'API - ne pas utiliser caseId pour éviter les erreurs
      const requestBody: any = {
        documentType,
        data: documentData
      }

      // Ne pas ajouter caseId pour éviter les problèmes de base de données
      // L'API créera automatiquement un client temporaire

      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedDocument(result.document)
        toast({
          title: "Document généré",
          description: `${result.document.title} créé avec succès`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erreur génération:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du document",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const signDocument = async (signerRole: 'client' | 'advisor') => {
    if (!generatedDocument) return

    setIsSigning(true)

    try {
      const signerName = signerRole === 'client' 
        ? clientData?.name || 'Client'
        : advisorData?.name || 'Conseiller'

      const response = await fetch('/api/documents/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: generatedDocument.id,
          signerName,
          signerRole,
          signatureType: 'electronic'
        })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedDocument(prev => ({
          ...prev,
          status: result.document.status,
          content: result.document.content
        }))
        
        toast({
          title: "Document signé",
          description: result.message
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erreur signature:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la signature du document",
        variant: "destructive"
      })
    } finally {
      setIsSigning(false)
    }
  }

  const previewDocument = () => {
    if (generatedDocument) {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(generatedDocument.content)
        newWindow.document.close()
      }
    }
  }

  const downloadDocument = () => {
    if (generatedDocument) {
      const blob = new Blob([generatedDocument.content], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedDocument.title.replace(/\s+/g, '_')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Générateur de Documents
          </CardTitle>
          <CardDescription>
            Créez et signez automatiquement les documents pour ce dossier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="document-type">Type de document</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type de document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opsio-info-sheet">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Feuille d'information OPSIO
                  </div>
                </SelectItem>
                <SelectItem value="resignation-letter">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Lettre de résiliation d'assurance
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {documentType === 'opsio-info-sheet' && (
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">Configuration Feuille OPSIO</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Mode de rémunération</Label>
                  <Select 
                    value={opsioData.paymentMethod} 
                    onValueChange={(value: 'commission' | 'fees') => 
                      setOpsioData(prev => ({ ...prev, paymentMethod: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commission">Commission de la compagnie d'assurance</SelectItem>
                      <SelectItem value="fees">Honoraires payés par le client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {documentType === 'resignation-letter' && (
            <Card className="bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm">Configuration Lettre de Résiliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance-company">Compagnie d'assurance</Label>
                    <Input
                      id="insurance-company"
                      value={resignationData.insuranceCompany}
                      onChange={(e) => setResignationData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                      placeholder="Ex: Helsana Assurances SA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-address">Adresse de la compagnie</Label>
                    <Input
                      id="company-address"
                      value={resignationData.companyAddress}
                      onChange={(e) => setResignationData(prev => ({ ...prev, companyAddress: e.target.value }))}
                      placeholder="Ex: Audenstrasse 2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-postal-city">NPA Ville compagnie</Label>
                    <Input
                      id="company-postal-city"
                      value={resignationData.companyPostalCity}
                      onChange={(e) => setResignationData(prev => ({ ...prev, companyPostalCity: e.target.value }))}
                      placeholder="Ex: 8021 Zurich"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lamal-date">Date résiliation LAMal</Label>
                    <Input
                      id="lamal-date"
                      type="date"
                      value={resignationData.lamalTerminationDate}
                      onChange={(e) => setResignationData(prev => ({ ...prev, lamalTerminationDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lca-date">Date résiliation LCA</Label>
                    <Input
                      id="lca-date"
                      type="date"
                      value={resignationData.lcaTerminationDate}
                      onChange={(e) => setResignationData(prev => ({ ...prev, lcaTerminationDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Personnes assurées</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPerson}
                      disabled={resignationData.persons.length >= 4}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {resignationData.persons.map((person, index) => (
                    <Card key={index} className="mb-3 bg-white">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Personne {index + 1}</h4>
                          {resignationData.persons.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePerson(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label>Nom et prénom</Label>
                            <Input
                              value={person.name}
                              onChange={(e) => updatePerson(index, 'name', e.target.value)}
                              placeholder="Nom Prénom"
                            />
                          </div>
                          <div>
                            <Label>Date de naissance</Label>
                            <Input
                              type="date"
                              value={person.birthdate}
                              onChange={(e) => updatePerson(index, 'birthdate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Numéro de police</Label>
                            <Input
                              value={person.policyNumber}
                              onChange={(e) => updatePerson(index, 'policyNumber', e.target.value)}
                              placeholder="Ex: 123456789"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={generateDocument} 
            disabled={isGenerating || !documentType}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Génération en cours...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer le document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedDocument && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Document généré: {generatedDocument.title}
            </CardTitle>
            <CardDescription>
              Statut: <span className="font-medium">{generatedDocument.status}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" onClick={previewDocument}>
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
              <Button variant="outline" onClick={downloadDocument}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => signDocument('client')}
                disabled={isSigning}
                variant="default"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Signer (Client)
              </Button>
              <Button 
                onClick={() => signDocument('advisor')}
                disabled={isSigning}
                variant="secondary"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Signer (Conseiller)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
