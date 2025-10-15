"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  User,
  Plus,
  Check,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileSignature,
  Users
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
  dateOfBirth: string
  address: string
  city: string
  postalCode: string
  country: string
  policyNumber: string
  insuranceCompany: string
  hasSignature: boolean
  signatureCount: number
  createdAt: string
  updatedAt: string
  displayText: string
  signatureStatus: string
}

interface ClientSelectionProps {
  onClientSelected: (client: Client) => void
  onNewClientRequested: () => void
  selectedClientId?: string
  showCreateNew?: boolean
}

export function ClientSelection({
  onClientSelected,
  onNewClientRequested,
  selectedClientId,
  showCreateNew = true
}: ClientSelectionProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Debounced search function
  const searchClients = useCallback(async (search: string) => {
    if (search.length < 2) {
      setClients([])
      setShowResults(false)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        search: search,
        limit: '10',
        includeSignatureStatus: 'true'
      })

      const response = await fetch(`/api/agent/client-selection?${params}`)
      const data = await response.json()

      if (data.success) {
        setClients(data.clients || [])
        setStats(data.stats)
        setShowResults(true)

        // Show warning if in fallback mode
        if (data.fallbackMode && data.warning) {
          toast({
            title: "Mode de compatibilité",
            description: data.warning,
            variant: "default"
          })
        }
      } else {
        console.error('Erreur recherche clients:', data.error)
        toast({
          title: "Erreur",
          description: "Erreur lors de la recherche des clients",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur API recherche clients:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion lors de la recherche",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Debounce search - also trigger when filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchClients(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchClients])

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setShowResults(false)
    setSearchTerm(client.displayText)
    onClientSelected(client)

    toast({
      title: client.hasSignature ? "✅ Client avec signature sélectionné" : "⚠️ Client sans signature sélectionné",
      description: client.hasSignature
        ? `${client.fullName} - Signature disponible pour les documents Word`
        : `${client.fullName} - Aucune signature disponible. Le client devra signer manuellement.`,
      variant: client.hasSignature ? "default" : "destructive"
    })
  }



  // Handle new client creation
  const handleNewClient = () => {
    setSelectedClient(null)
    setSearchTerm('')
    setShowResults(false)
    onNewClientRequested()
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedClient(null)
    setSearchTerm('')
    setShowResults(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sélection du Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Label htmlFor="client-search">Rechercher un client existant</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="client-search"
                type="text"
                placeholder="Nom, prénom, email ou code client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {selectedClient && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1 h-8 w-8 p-0"
                  onClick={clearSelection}
                >
                  ×
                </Button>
              )}
            </div>
          </div>

          {/* Filter Options */}


          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Recherche en cours...</span>
            </div>
          )}

          {/* Search Results */}
          {showResults && !isLoading && (
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Résultats de recherche</h4>
                  {stats && (
                    <Badge variant="outline" className="text-xs">
                      {clients.length} résultat(s) • {stats.withSignature} avec signature
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {clients.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucun client trouvé</p>
                    <p className="text-xs">
                      Essayez avec d'autres termes de recherche
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-3 border rounded-lg transition-all ${
                          client.hasSignature
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer hover:bg-green-100 hover:border-green-300 rounded p-2 -m-2"
                            onClick={() => handleClientSelect(client)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <User className={`h-4 w-4 ${client.hasSignature ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className="font-medium">{client.fullName}</span>
                              {client.hasSignature ? (
                                <Badge className="text-xs bg-green-600 text-white">
                                  <FileSignature className="h-3 w-3 mr-1" />
                                  ✓ Signature disponible
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Aucune signature
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                              {client.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {client.phone}
                                </div>
                              )}
                              {client.dateOfBirth && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span className="text-xs">Né(e) le {new Date(client.dateOfBirth).toLocaleDateString('fr-FR')}</span>
                                </div>
                              )}
                              {client.policyNumber && (
                                <div className="flex items-center gap-1">
                                  <FileSignature className="h-3 w-3" />
                                  <span className="text-xs">Police: {client.policyNumber}</span>
                                </div>
                              )}
                              {client.address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {client.address}, {client.postalCode} {client.city}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right text-xs text-gray-500">
                              <div>Code: {client.clientCode}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(client.createdAt).toLocaleDateString('fr-CH')}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Client Display */}
          {selectedClient && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900">Client sélectionné</h4>
                      <p className="text-sm text-green-700">{selectedClient.fullName}</p>
                      <p className="text-xs text-green-600">{selectedClient.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {selectedClient.hasSignature ? (
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create New Client Option */}
          {showCreateNew && (
            <>
              <Separator />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Client introuvable ?
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleNewClient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un nouveau client
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
