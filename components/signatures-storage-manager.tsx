'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { 
  FileImage, 
  Download, 
  Trash2, 
  RefreshCw, 
  Search, 
  Database, 
  HardDrive,
  CheckCircle,
  XCircle,
  Upload,
  Eye
} from 'lucide-react'

interface SignatureStorageData {
  id: string
  signature_name: string
  client_name: string
  client_code: string
  client_email: string
  created_at: string
  is_default: boolean
  is_active: boolean
  storage_path: string | null
  storage_available: boolean
  storage_file_info: {
    name: string
    size: number
    created_at: string
    updated_at: string
  } | null
  download_url: string | null
}

interface SignaturesStorageManagerProps {
  clientId: string
  clientName?: string
}

export default function SignaturesStorageManager({ 
  clientId, 
  clientName = "Client" 
}: SignaturesStorageManagerProps) {
  const [signatures, setSignatures] = useState<SignatureStorageData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    with_storage: 0,
    without_storage: 0
  })
  
  const { toast } = useToast()

  // Charger les signatures
  const loadSignatures = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agent/manage-signatures-storage?clientId=${clientId}&action=list`)
      const data = await response.json()

      if (data.success) {
        setSignatures(data.signatures)
        setStats({
          total: data.count.database,
          with_storage: data.count.with_storage,
          without_storage: data.count.database - data.count.with_storage
        })
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors du chargement des signatures",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur chargement signatures:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors du chargement des signatures",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Synchroniser les signatures vers le storage
  const syncSignatures = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/agent/manage-signatures-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, action: 'sync' })
      })
      
      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Synchronisation terminée",
          description: `${data.results.uploaded} signatures uploadées, ${data.results.skipped} ignorées, ${data.results.errors} erreurs`
        })
        await loadSignatures() // Recharger
      } else {
        toast({
          title: "❌ Erreur de synchronisation",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  // Supprimer une signature du storage
  const deleteFromStorage = async (signatureId: string, signatureName: string) => {
    if (!confirm(`Supprimer la signature "${signatureName}" du storage ?`)) return

    try {
      const response = await fetch('/api/agent/manage-signatures-storage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureId })
      })
      
      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Signature supprimée",
          description: `"${signatureName}" supprimée du storage`
        })
        await loadSignatures() // Recharger
      } else {
        toast({
          title: "❌ Erreur de suppression",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      })
    }
  }

  // Télécharger une signature
  const downloadSignature = (signature: SignatureStorageData) => {
    if (signature.download_url) {
      window.open(signature.download_url, '_blank')
    }
  }

  // Filtrer les signatures
  const filteredSignatures = signatures.filter(sig =>
    sig.signature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sig.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    loadSignatures()
  }, [clientId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement des signatures...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Signatures dans Supabase Storage
          </CardTitle>
          <CardDescription>
            Gestion des signatures de {clientName} dans le storage cloud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Total DB: <strong>{stats.total}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-green-500" />
              <span className="text-sm">Avec Storage: <strong>{stats.with_storage}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Sans Storage: <strong>{stats.without_storage}</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une signature..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              onClick={loadSignatures} 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button 
              onClick={syncSignatures} 
              disabled={syncing || stats.without_storage === 0}
            >
              <Upload className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Synchroniser ({stats.without_storage})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des signatures */}
      <div className="grid gap-4">
        {filteredSignatures.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              {searchTerm ? 'Aucune signature trouvée pour cette recherche' : 'Aucune signature trouvée'}
            </CardContent>
          </Card>
        ) : (
          filteredSignatures.map((signature) => (
            <Card key={signature.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{signature.signature_name}</h3>
                      {signature.is_default && (
                        <Badge variant="default">Par défaut</Badge>
                      )}
                      {signature.storage_available ? (
                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Storage
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-orange-700 bg-orange-100">
                          <XCircle className="h-3 w-3 mr-1" />
                          DB seulement
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Client: {signature.client_name} ({signature.client_code})</div>
                      <div>Créée: {new Date(signature.created_at).toLocaleString('fr-FR')}</div>
                      {signature.storage_file_info && (
                        <div>
                          Fichier: {signature.storage_file_info.name} 
                          ({Math.round(signature.storage_file_info.size / 1024)} KB)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {signature.download_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSignature(signature)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    )}
                    {signature.download_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSignature(signature)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    )}
                    {signature.storage_available && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteFromStorage(signature.id, signature.signature_name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
