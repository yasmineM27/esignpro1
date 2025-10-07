"use client"

import React, { useState } from "react"
import { AgentNavigation } from "@/components/agent-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  Search, 
  Filter, 
  FileSignature, 
  FolderOpen, 
  Plus,
  Eye,
  Download,
  Calendar,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: string
  clientCode: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  hasSignature: boolean
  signatureCount: number
  totalCases: number
  completedCases: number
  lastCaseActivity: string
  clientCreatedAt: string
}

interface ClientStats {
  total: number
  withSignature: number
  withoutSignature: number
  activeClients: number
  newThisMonth: number
}

export default function AgentClientsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_signature' | 'without_signature'>('all')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDetails, setShowClientDetails] = useState(false)

  // Load clients data
  const loadClients = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        includeSignatureStatus: 'true',
        limit: '50'
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (filterStatus === 'with_signature') {
        params.append('onlyWithSignature', 'true')
      }

      const response = await fetch(`/api/agent/client-selection?${params}`)
      const data = await response.json()

      if (data.success) {
        // Transform data to match our interface
        const transformedClients = data.clients.map((client: any) => ({
          id: client.id,
          clientCode: client.clientCode,
          firstName: client.firstName,
          lastName: client.lastName,
          fullName: client.fullName,
          email: client.email,
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          postalCode: client.postalCode || '',
          hasSignature: client.hasSignature,
          signatureCount: client.signatureCount,
          totalCases: Math.floor(Math.random() * 10) + 1, // Mock data
          completedCases: Math.floor(Math.random() * 5), // Mock data
          lastCaseActivity: client.updatedAt,
          clientCreatedAt: client.createdAt
        }))

        setClients(transformedClients)
        
        // Calculate stats
        const clientStats: ClientStats = {
          total: transformedClients.length,
          withSignature: transformedClients.filter((c: Client) => c.hasSignature).length,
          withoutSignature: transformedClients.filter((c: Client) => !c.hasSignature).length,
          activeClients: transformedClients.filter((c: Client) => c.totalCases > 0).length,
          newThisMonth: transformedClients.filter((c: Client) => {
            const createdDate = new Date(c.clientCreatedAt)
            const now = new Date()
            return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
          }).length
        }
        
        setStats(clientStats)
      } else {
        console.error('Erreur chargement clients:', data.error)
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des clients",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur API clients:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load clients on component mount
  React.useEffect(() => {
    loadClients()
  }, [searchTerm, filterStatus])

  const handleSearch = () => {
    loadClients()
  }

  const viewClientDetails = async (client: Client) => {
    try {
      const response = await fetch(`/api/agent/client-selection?clientId=${client.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_client_details',
          clientId: client.id
        })
      })

      const data = await response.json()
      if (data.success) {
        setSelectedClient({ ...client, ...data.client })
        setShowClientDetails(true)
      }
    } catch (error) {
      console.error('Erreur récupération détails client:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la récupération des détails",
        variant: "destructive"
      })
    }
  }

  const downloadClientDocuments = async (client: Client) => {
    try {
      toast({
        title: "📦 Préparation de l'archive complète",
        description: `Création du ZIP avec tous les documents et signatures de ${client.fullName}...`,
        variant: "default"
      })

      // Appeler la nouvelle API pour créer et télécharger le ZIP complet
      const response = await fetch('/api/client/download-all-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: client.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du ZIP')
      }

      // Télécharger le fichier ZIP
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${client.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_documents_complets.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "✅ Archive téléchargée !",
        description: `Archive complète de ${client.fullName} avec tous les documents et signatures`,
        variant: "default"
      })

    } catch (error) {
      console.error('Erreur téléchargement documents:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      toast({
        title: "❌ Erreur de téléchargement",
        description: `Impossible de créer l'archive pour ${client.fullName}. ${errorMessage}`,
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (client: Client) => {
    if (client.hasSignature) {
      return (
        <Badge className="bg-green-600">
          <FileSignature className="h-3 w-3 mr-1" />
          Signature disponible
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="border-orange-300 text-orange-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Aucune signature
        </Badge>
      )
    }
  }

  const getActivityStatus = (lastActivity: string) => {
    const daysSince = Math.floor((new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSince <= 7) {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Récent</Badge>
    } else if (daysSince <= 30) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Modéré</Badge>
    } else {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Ancien</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AgentNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                Gestion des Clients
              </h1>
              <p className="text-gray-600 mt-2">
                Vue d'ensemble de tous vos clients et de leurs dossiers
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileSignature className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avec Signature</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.withSignature}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Sans Signature</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.withoutSignature}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Clients Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Nouveaux ce mois</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, email ou code client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                >
                  Tous
                </Button>
                <Button
                  variant={filterStatus === 'with_signature' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('with_signature')}
                  size="sm"
                >
                  <FileSignature className="h-4 w-4 mr-1" />
                  Avec signature
                </Button>
                <Button
                  variant={filterStatus === 'without_signature' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('without_signature')}
                  size="sm"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Sans signature
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Liste des Clients</span>
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Chargement des clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun client trouvé</p>
                <p className="text-sm">Essayez de modifier vos critères de recherche</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{client.fullName}</h3>
                            <p className="text-sm text-gray-500">Code: {client.clientCode}</p>
                          </div>
                          {getStatusBadge(client)}
                          {getActivityStatus(client.lastCaseActivity)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {client.phone}
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {client.address}, {client.postalCode} {client.city}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-4 w-4" />
                            {client.totalCases} dossier(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {client.completedCases} terminé(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Client depuis {new Date(client.clientCreatedAt).toLocaleDateString('fr-CH')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewClientDetails(client)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadClientDocuments(client)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Documents
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
