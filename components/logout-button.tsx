"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
  showIcon?: boolean
  redirectTo?: string
}

export function LogoutButton({ 
  variant = "outline", 
  size = "sm", 
  className = "",
  showIcon = true,
  redirectTo = "/login"
}: LogoutButtonProps) {
  
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
        
        // Rediriger vers la page spécifiée
        window.location.href = redirectTo
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

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      Déconnexion
    </Button>
  )
}
