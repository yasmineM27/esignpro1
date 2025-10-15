"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, User } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'agent' | 'client'
}

export function DynamicNav() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      // Essayer d'abord l'API agent-login
      let response = await fetch('/api/auth/agent-login', {
        method: 'GET',
        credentials: 'include'
      })

      let data = await response.json()

      // Si échec avec agent-login, essayer user-login
      if (!data.success) {
        response = await fetch('/api/auth/user-login', {
          method: 'GET',
          credentials: 'include'
        })
        data = await response.json()
      }

      if (data.success && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Déconnexion réussie",
          description: "Vous avez été déconnecté avec succès"
        })
        
        setUser(null)
        // Rediriger vers la page de connexion
        window.location.href = '/login'
      } else {
        throw new Error(data.error || 'Erreur de déconnexion')
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      })
    }
  }

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin'
      case 'agent':
        return '/agent'
      case 'client':
        return '/client-dashboard'
      default:
        return '/login'
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <nav className="flex items-center space-x-6">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </nav>
    )
  }

  if (user) {
    return (
      <nav className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{user.first_name} {user.last_name}</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {user.role}
          </span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={getDashboardLink(user.role)}>
            Tableau de bord
          </Link>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </nav>
    )
  }

  return (
    <nav className="flex items-center space-x-6">
      <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
        Espace Agent
      </Link>
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          Connexion
        </Link>
      </Button>
    </nav>
  )
}
