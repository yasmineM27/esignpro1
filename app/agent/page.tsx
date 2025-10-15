"use client"

import { useState } from "react"
import { ClientForm } from "@/components/client-form"
import { AgentNavigation } from "@/components/agent-navigation"
import { AgentStats } from "@/components/agent-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentClientsDynamic } from "@/components/agent-clients-dynamic"
import { AgentPendingDynamic } from "@/components/agent-pending-dynamic"
import { AgentCompletedDynamic } from "@/components/agent-completed-dynamic"
import { AgentArchiveDynamic } from "@/components/agent-archive-dynamic"
import { AgentAnalyticsDynamic } from "@/components/agent-analytics-dynamic"
import { AgentSettingsDynamic } from "@/components/agent-settings-dynamic"
import { AgentDocumentsHistory } from "@/components/agent-documents-history"
import { DemoWorkflow } from "@/components/demo-workflow"
import AgentCasesManagement from "@/components/agent-cases-management"
import DocumentGenerator from "@/components/document-generator"
import { DynamicAgentNavbar } from "@/components/dynamic-agent-navbar"
import { AgentAuthWrapper } from "@/components/agent-auth-wrapper"

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
    
      case "analytics":
        return <AgentAnalyticsDynamic />
    
      case "settings":
        return <AgentSettingsDynamic />
      default:
        return null
    }
  }

  return (
    <AgentAuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* 🆕 NAVBAR DYNAMIQUE - Informations agent récupérées automatiquement */}
        <DynamicAgentNavbar
          showBackButton={true}
          title="Espace Agent"
          subtitle="Gestion des dossiers clients"
        />

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
    </AgentAuthWrapper>
  )
}
