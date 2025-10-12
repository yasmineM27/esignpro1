"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarInitial } from "@/components/ui/avatar"

interface AgentInfo {
  id: string
  first_name: string
  last_name: string
  email: string
  agent_code: string
  department?: string
  is_supervisor: boolean
}

interface DynamicAgentNavbarProps {
  showBackButton?: boolean
  title?: string
  subtitle?: string
}

export function DynamicAgentNavbar({ 
  showBackButton = true, 
  title = "Espace Agent",
  subtitle = "Gestion des dossiers clients"
}: DynamicAgentNavbarProps) {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgentInfo()
  }, [])

  const fetchAgentInfo = async () => {
    try {
      const response = await fetch('/api/auth/agent-info', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAgentInfo(data.agent)
      } else {
        console.error('Erreur récupération info agent:', response.statusText)
      }
    } catch (error) {
      console.error('Erreur réseau:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Rediriger vers la page de connexion
      window.location.href = '/login'
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`
  }

  if (loading) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Accueil
                  </Link>
                </Button>
              )}
              <Image src="/images/esignpro-logo.png" alt="eSignPro" width={150} height={45} className="h-10 w-auto" />
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Accueil
                </Link>
              </Button>
            )}
            <Image src="/images/esignpro-logo.png" alt="eSignPro" width={150} height={45} className="h-10 w-auto" />
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>
          
          {agentInfo ? (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Agent: {getFullName(agentInfo.first_name, agentInfo.last_name)}
                  {agentInfo.is_supervisor && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Superviseur
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-600">ID: {agentInfo.agent_code}</p>
                {agentInfo.department && (
                  <p className="text-xs text-gray-500">{agentInfo.department}</p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">
                      <span className="text-red-600 font-semibold">
                        {getInitials(agentInfo.first_name, agentInfo.last_name)}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getFullName(agentInfo.first_name, agentInfo.last_name)}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {agentInfo.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/agent/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/agent/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-red-600">Non connecté</p>
                <p className="text-xs text-gray-600">Veuillez vous connecter</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">
                  Connexion
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
