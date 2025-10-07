"use client"

import { useState } from "react"
import { ClientForm } from "@/components/client-form"
import { AgentNavigation } from "@/components/agent-navigation"
import { AgentStats } from "@/components/agent-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AgentClientsDynamic } from "@/components/agent-clients-dynamic"
import { AgentPendingDynamic } from "@/components/agent-pending-dynamic"
import { AgentCompletedDynamic } from "@/components/agent-completed-dynamic"
import { AgentArchiveDynamic } from "@/components/agent-archive-dynamic"
import { AgentAnalyticsDynamic } from "@/components/agent-analytics-dynamic"
import { AgentSettingsDynamic } from "@/components/agent-settings-dynamic"
import { AgentDocumentsHistory } from "@/components/agent-documents-history"
import { DemoWorkflow } from "@/components/demo-workflow"
import AgentCasesManagement from "@/components/agent-cases-management"

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("new-case")

  const renderMainContent = () => {
    switch (activeTab) {
      case "new-case":
        return (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Nouveau Dossier de Résiliation</CardTitle>
              <CardDescription className="text-blue-100">
                Saisissez les informations du client pour générer automatiquement les documents de résiliation
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <ClientForm />
            </CardContent>
          </Card>
        )
      case "clients":
        return <AgentClientsDynamic />
      case "cases":
        return <AgentCasesManagement />
      case "pending":
        return <AgentPendingDynamic />
      case "completed":
        return <AgentCompletedDynamic />
      case "archive":
        return <AgentArchiveDynamic />
      case "documents":
        return <AgentDocumentsHistory />
      case "analytics":
        return <AgentAnalyticsDynamic />
      case "demo":
        return <DemoWorkflow />
      case "settings":
        return <AgentSettingsDynamic />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Agent Header */}
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
                <h1 className="text-xl font-semibold text-gray-900">Espace Agent</h1>
                <p className="text-sm text-gray-600">Gestion des dossiers clients</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Agent: Wael Hamda</p>
                <p className="text-xs text-gray-600">ID: WH001</p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">WH</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <AgentNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <AgentStats />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
