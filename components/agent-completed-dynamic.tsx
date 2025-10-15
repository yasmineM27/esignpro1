"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Eye, 
  RefreshCw,
  Filter,
  User,
  Building,
  CheckCircle,
  Download,
  Signature,
  Award,
  Clock,
  Star
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompletedCase {
  id: string
  caseNumber: string
  status: string
  secureToken: string
  client: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    phone: string
  }
  insuranceCompany: string
  policyType: string
  policyNumber: string
  createdAt: string
  completedAt: string
  signature: {
    id: string
    signedAt: string
    signatureData: string
    isValid: boolean
    validatedAt: string
    validatedBy: string
  }
  portalUrl: string
  daysToComplete: number
  completionScore: number
}

interface CompletedStats {
  total: number
  thisWeek: number
  thisMonth: number
  averageTime: number
  validSignatures: number
}

export function AgentCompletedDynamic() {
  const [cases, setCases] = useState<CompletedCase[]>([])
  const [stats, setStats] = useState<CompletedStats>({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    averageTime: 0,
    validSignatures: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSignature, setSelectedSignature] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCompletedCases()
    
    // Recharger toutes les 60 secondes
    const interval = setInterval(loadCompletedCases, 60000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const loadCompletedCases = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/agent/completed-cases?limit=50')
      const data = await response.json()

      if (data.success) {
        const formattedCases = data.cases.map((caseItem: any) => {
          // Calculer les jours pour terminer
          const createdDate = new Date(caseItem.createdAt)
          const completedDate = new Date(caseItem.completedAt)
          const daysToComplete = Math.floor((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

          return {
            id: caseItem.id,
            caseNumber: caseItem.caseNumber,
            status: caseItem.status,
            secureToken: caseItem.secureToken,
            client: {
              id: caseItem.client.id,
              firstName: caseItem.client.firstName,
              lastName: caseItem.client.lastName,
              fullName: caseItem.client.fullName,
              email: caseItem.client.email,
              phone: caseItem.client.phone
            },
            insuranceCompany: '', // À ajouter si nécessaire
            policyType: '', // À ajouter si nécessaire
            policyNumber: '', // À ajouter si nécessaire
            createdAt: caseItem.createdAt,
            completedAt: caseItem.completedAt,
            signature: caseItem.signature ? {
              id: caseItem.signature.id,
              signedAt: caseItem.signature.signedAt,
              signatureData: caseItem.signature.signatureData,
              isValid: caseItem.signature.isValid,
              signatureName: caseItem.signature.signatureName
            } : null,
            portalUrl: `https://esignpro.ch/client-portal/${caseItem.secureToken}`,
            daysToComplete: daysToComplete,
            completionScore: daysToComplete <= 1 ? 100 : daysToComplete <= 3 ? 90 : daysToComplete <= 7 ? 80 : 70,
            hasSignature: caseItem.hasSignature
          }
        })

        setCases(formattedCases)

        // Utiliser les statistiques calculées par l'API
        setStats(data.stats)
      } else {
        console.error('Erreur API completed-cases:', data.error)
        toast({
          title: "❌ Erreur",
          description: "Impossible de charger les dossiers terminés",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    // La recherche se fait côté client pour simplifier
  }

  const getCompletionBadge = (score: number) => {
    if (score >= 90) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">
        <Star className="w-3 h-3 mr-1" />
        Excellent
      </Badge>
    } else if (score >= 80) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Award className="w-3 h-3 mr-1" />
        Bon
      </Badge>
    } else {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="w-3 h-3 mr-1" />
        Lent
      </Badge>
    }
  }

  const viewSignature = (signature: any) => {
    if (!signature) {
      toast({
        title: "❌ Aucune signature",
        description: "Ce dossier n'a pas de signature enregistrée.",
        variant: "destructive"
      })
      return
    }
    setSelectedSignature(signature)
  }

  const downloadCaseDocuments = async (caseItem: CompletedCase) => {
    try {
      console.log('📦 Téléchargement documents pour dossier:', caseItem.caseNumber);

      // Afficher un toast de début
      toast({
        title: "📦 Préparation des documents",
        description: `Génération du ZIP avec tous les documents de ${caseItem.client.fullName}...`,
      });

      // Créer un ZIP avec tous les documents du client + documents Word avec signatures
      const response = await fetch(`/api/agent/download-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseId: caseItem.id,
          clientId: caseItem.client.id,
          secureToken: caseItem.secureToken,
          includeWordDocuments: true,
          includeSignatures: true,
          generateWordWithSignature: true
        })
      });

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `DOSSIER-COMPLET-${caseItem.client.fullName.replace(/\s+/g, '-')}-${caseItem.caseNumber}-AVEC-SIGNATURES.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Toast de succès avec détails
        toast({
          title: "✅ Documents téléchargés",
          description: `ZIP généré avec succès! Contient: documents Word signés, signatures, métadonnées. Taille: ${(blob.size / 1024).toFixed(2)} KB`,
        });

        console.log('✅ Téléchargement réussi:', {
          client: caseItem.client.fullName,
          taille: `${(blob.size / 1024).toFixed(2)} KB`,
          contenu: 'Documents Word avec signatures + métadonnées'
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur téléchargement:', errorText);

        toast({
          title: "❌ Erreur de téléchargement",
          description: `Impossible de générer le ZIP: ${response.status} ${response.statusText}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erreur téléchargement documents:', error);

      toast({
        title: "❌ Erreur technique",
        description: `Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive"
      });
    }
  }

  const filteredCases = cases.filter(caseItem => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      caseItem.client.fullName.toLowerCase().includes(search) ||
      caseItem.client.email.toLowerCase().includes(search) ||
      caseItem.caseNumber.toLowerCase().includes(search) ||
      (caseItem.insuranceCompany && caseItem.insuranceCompany.toLowerCase().includes(search))
    )
  })

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Terminés</p>
                <p className="text-2xl font-bold text-green-900">{stats.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Cette Semaine</p>
                <p className="text-2xl font-bold text-blue-900">{stats.thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Ce Mois</p>
                <p className="text-2xl font-bold text-purple-900">{stats.thisMonth}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Temps Moyen</p>
                <p className="text-2xl font-bold text-orange-900">{stats.averageTime}j</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Signatures Valides</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.validSignatures}</p>
              </div>
              <Signature className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dossiers Terminés</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadCompletedCases}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email, dossier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Liste des dossiers terminés */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement des dossiers terminés...</span>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun dossier terminé</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Aucun dossier ne correspond à votre recherche.' : 'Aucun dossier n\'a encore été terminé.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((caseItem, index) => (
                <Card key={`${caseItem.id}-${index}`} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{caseItem.client.fullName}</h3>
                            <p className="text-sm text-gray-500">Dossier: {caseItem.caseNumber}</p>
                          </div>
                          {getCompletionBadge(caseItem.completionScore)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{caseItem.client.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Terminé en {caseItem.daysToComplete} jour{caseItem.daysToComplete > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Signature className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {caseItem.signature && caseItem.signature.signedAt
                                ? `Signé le ${new Date(caseItem.signature.signedAt).toLocaleDateString('fr-FR')}`
                                : 'Document signé'
                              }
                            </span>
                          </div>
                        </div>

                        {caseItem.insuranceCompany && (
                          <div className="flex items-center space-x-2 mb-3">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {caseItem.insuranceCompany} - {caseItem.policyType}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Dossier terminé</span>
                          </div>
                          {caseItem.signature && caseItem.signature.isValid && (
                            <div className="flex items-center space-x-2 text-blue-600">
                              <Award className="h-4 w-4" />
                              <span className="text-sm font-medium">Signature validée</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(caseItem.portalUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir portail
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewSignature(caseItem.signature)}
                          disabled={!caseItem.signature}
                          className={caseItem.signature
                            ? "text-blue-600 border-blue-200 hover:bg-blue-50"
                            : "text-gray-400 border-gray-200"
                          }
                        >
                          <Signature className="h-4 w-4 mr-2" />
                          {caseItem.signature ? 'Voir signature' : 'Pas de signature'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCaseDocuments(caseItem)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal pour voir la signature */}
      {selectedSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedSignature(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Signature Client</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSignature(null)}>
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={selectedSignature?.signatureData || '/placeholder-signature.png'}
                  alt="Signature"
                  className="w-full h-32 object-contain border rounded"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Signé le:</strong> {selectedSignature?.signedAt ? new Date(selectedSignature.signedAt).toLocaleString('fr-FR') : 'Date non disponible'}</p>
                <p><strong>Statut:</strong> {selectedSignature?.isValid ? 'Valide' : 'En attente de validation'}</p>
                {selectedSignature?.validatedAt && (
                  <p><strong>Validé le:</strong> {new Date(selectedSignature.validatedAt).toLocaleString('fr-FR')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
