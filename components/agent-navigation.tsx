"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Users,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  Archive,
  FileText,
  Download,
  Play,
  Info,
  RefreshCw
} from "lucide-react"

interface AgentNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

interface NavigationStats {
  clients: number
  pending: number
  completed: number
  archive: number
  total: number
  draft: number
  email_sent: number
  documents_uploaded: number
  signed: number
  validated: number
}

export function AgentNavigation({ activeTab, onTabChange }: AgentNavigationProps) {
  const [stats, setStats] = useState<NavigationStats>({
    clients: 0,
    pending: 0,
    completed: 0,
    archive: 0,
    total: 0,
    draft: 0,
    email_sent: 0,
    documents_uploaded: 0,
    signed: 0,
    validated: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadNavigationStats = async () => {
    try {
      setIsLoading(true)

      // Essayer d'abord la nouvelle API dédiée (simplifiée)
      try {
        console.log('🔄 Tentative API navigation-stats...')
        const response = await fetch('/api/agent/navigation-stats')

        if (response.ok) {
          const data = await response.json()

          if (data.success) {
            setStats({
              clients: data.stats.clients || 0,
              pending: data.stats.pending || 0,
              completed: data.stats.completed || 0,
              archive: data.stats.archive || 0,
              total: data.stats.total || 0,
              draft: data.stats.draft || 0,
              email_sent: data.stats.email_sent || 0,
              documents_uploaded: data.stats.documents_uploaded || 0,
              signed: data.stats.signed || 0,
              validated: data.stats.validated || 0
            })
            console.log('✅ Statistiques navigation chargées depuis API dédiée:', data.stats)
            return
          } else {
            console.warn('⚠️ API navigation-stats retourne success=false:', data.error)
          }
        } else {
          console.warn('⚠️ API navigation-stats HTTP error:', response.status)
        }
      } catch (apiError) {
        console.warn('⚠️ API navigation-stats exception:', apiError.message)
      }

      // Fallback : utiliser l'API all-cases corrigée
      console.log('🔄 Utilisation de l\'API all-cases corrigée...')

      try {
        const casesResponse = await fetch('/api/agent/all-cases?status=all&limit=100')
        const casesData = await casesResponse.json()

        if (casesData.success && casesData.cases) {
          const cases = casesData.cases
          const stats = casesData.stats || {}

          setStats({
            clients: 0, // TODO: Calculer depuis les données
            pending: stats.pending || 0,
            completed: stats.completed || 0,
            archive: 0,
            total: stats.total || cases.length,
            draft: cases.filter(c => c.status === 'draft').length,
            email_sent: cases.filter(c => c.status === 'email_sent').length,
            documents_uploaded: cases.filter(c => c.status === 'documents_uploaded').length,
            signed: stats.signed || 0,
            validated: cases.filter(c => c.status === 'validated').length
          })

          console.log('✅ Statistiques navigation chargées depuis all-cases API:', {
            total: cases.length,
            stats
          })
        } else {
          console.error('❌ Erreur API all-cases:', casesData.error)
          throw new Error(casesData.error || 'API all-cases failed')
        }
      } catch (error) {
        console.error('❌ Erreur fallback all-cases:', error)

        // Dernier fallback : données par défaut
        console.log('⚠️ Utilisation de données par défaut')
        setStats({
          clients: 0,
          pending: 0,
          completed: 0,
          archive: 0,
          total: 0,
          draft: 0,
          email_sent: 0,
          documents_uploaded: 0,
          signed: 0,
          validated: 0
        })
      }
    } catch (error) {
      console.error('Erreur chargement stats navigation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les statistiques pour les badges
  useEffect(() => {
    loadNavigationStats()

    // Recharger toutes les 2 minutes pour avoir des données plus fraîches
    const interval = setInterval(loadNavigationStats, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Rafraîchir aussi quand l'onglet devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Onglet redevenu visible, rafraîchissement des stats...')
        loadNavigationStats()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const navigationItems = [
    {
      id: "new-case",
      label: "Nouveau Dossier",
      icon: Plus,
      description: "Créer un nouveau dossier",
      count: null
    },
    {
      id: "clients",
      label: "Mes Clients",
      icon: Users,
      description: `${stats.clients} clients enregistrés`,
      count: stats.clients > 0 ? stats.clients : null
    },
    {
      id: "pending",
      label: "En Attente",
      icon: Clock,
      description: stats.pending > 0 ? `${stats.pending} dossiers en attente` : "Aucun dossier en attente",
      count: stats.pending > 0 ? stats.pending : null,
      urgent: stats.pending > 0
    },
    {
      id: "cases",
      label: "Dossiers",
      icon: FileText,
      description: `${stats.total} dossiers au total`,
      count: stats.total > 0 ? stats.total : null,
      featured: true,
      breakdown: {
        draft: stats.draft,
        email_sent: stats.email_sent,
        documents_uploaded: stats.documents_uploaded,
        signed: stats.signed,
        completed: stats.completed,
        validated: stats.validated
      }
    },
    {
      id: "completed",
      label: "Terminés",
      icon: CheckCircle,
      description: stats.completed > 0 ? `${stats.completed} dossiers terminés` : "Aucun dossier terminé",
      count: stats.completed > 0 ? stats.completed : null
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      description: stats.archive > 0 ? `${stats.archive} dossiers archivés` : "Aucun dossier archivé",
      count: stats.archive > 0 ? stats.archive : null
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      description: "Historique des documents",
      count: null
    },
    {
      id: "analytics",
      label: "Statistiques",
      icon: BarChart3,
      description: "Analyses et rapports",
      count: null
    },
    {
      id: "demo",
      label: "Démonstration",
      icon: Play,
      description: "Test workflow complet",
      count: null
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: Settings,
      description: "Configuration",
      count: null
    },
  ]

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Navigation</CardTitle>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={loadNavigationStats}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Rafraîchir les statistiques"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <nav className="space-y-1 px-4 pb-4">
          {navigationItems.map((item) => {
            const isActive = activeTab === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start px-4 py-3 h-auto ${
                  isActive
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : item.featured
                      ? "text-blue-700 hover:bg-blue-50 border border-blue-200 bg-blue-50/50"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => onTabChange(item.id)}
                title={item.id === 'cases' && item.breakdown ?
                  `Répartition des dossiers:\n• Brouillons: ${item.breakdown.draft}\n• Email envoyé: ${item.breakdown.email_sent}\n• Documents reçus: ${item.breakdown.documents_uploaded}\n• Signés: ${item.breakdown.signed}\n• Terminés: ${item.breakdown.completed}\n• Validés: ${item.breakdown.validated}`
                  : item.description}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium flex items-center space-x-1">
                        <span>{item.label}</span>
                        {item.id === 'cases' && item.breakdown && (
                          <Info className="h-3 w-3 opacity-50" />
                        )}
                      </div>
                      <div className={`text-xs ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.count && (
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      className={`${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : item.urgent
                            ? "bg-red-100 text-red-800 border-red-200 animate-pulse"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}
                    >
                      {item.count}
                    </Badge>
                  )}
                </div>
              </Button>
            )
          })}
        </nav>

        {/* Indicateur de mise à jour */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Dernière mise à jour</span>
            <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
