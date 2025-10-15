"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Users, Settings, Clock, FileText, BarChart3, Shield } from "lucide-react"
import { AdminAgents } from "@/components/admin-agents"
import { AdminUsers } from "@/components/admin-users"
import { AdminSettings } from "@/components/admin-settings"

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [stats, setStats] = useState({
    activeAgents: 0,
    totalDocuments: 0,
    todaySignatures: 0,
    averageTime: '0min'
  })
  const [loading, setLoading] = useState(true)

  // Récupérer les statistiques au chargement
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats')
        const result = await response.json()

        if (result.success) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Erreur récupération statistiques:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Accueil
                </Link>
              </Button>
              <Image src="/images/esignpro-logo.png" alt="eSignPro" width={150} height={45} className="h-10 w-auto" />
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">Administration</h1>
                <p className="text-sm text-gray-600">Gestion système et configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Système Opérationnel
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Admin: Système</p>
                <p className="text-xs text-gray-600">Accès complet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agents Actifs</p>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.activeAgents}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents Traités</p>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments.toLocaleString()}</p>
                  )}
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Signatures Aujourd'hui</p>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.todaySignatures}</p>
                  )}
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Temps Moyen</p>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.averageTime}</p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm">
          <Button
            variant={activeSection === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("dashboard")}
            className={activeSection === "dashboard" ? "bg-gray-900 text-white" : ""}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Tableau de Bord
          </Button>
          <Button
            variant={activeSection === "agents" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("agents")}
            className={activeSection === "agents" ? "bg-gray-900 text-white" : ""}
          >
            <Users className="mr-2 h-4 w-4" />
            Agents
          </Button>
          <Button
            variant={activeSection === "users" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("users")}
            className={activeSection === "users" ? "bg-gray-900 text-white" : ""}
          >
            <Users className="mr-2 h-4 w-4" />
            Utilisateurs
          </Button>

          <Button
            variant={activeSection === "settings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("settings")}
            className={activeSection === "settings" ? "bg-gray-900 text-white" : ""}
          >
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
        </div>

        {/* Content based on active section */}
        {activeSection === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection("agents")}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Gestion des Agents</CardTitle>
                    <CardDescription>Comptes, permissions, statistiques</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Gérer les Agents
                </Button>
              </CardContent>
            </Card>



            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection("settings")}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Paramètres Système</CardTitle>
                    <CardDescription>Configuration générale</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Paramètres
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "agents" && <AdminAgents />}
        {activeSection === "users" && <AdminUsers />}
        {activeSection === "settings" && <AdminSettings />}
      </div>
    </div>
  )
}
