"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff, RefreshCw } from "lucide-react"

interface ChangePasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    email: string
    full_name: string
    role: string
  } | null
}

export function ChangePasswordDialog({ isOpen, onClose, user }: ChangePasswordDialogProps) {
  const { toast } = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    onClose()
  }

  const generateTempPassword = async () => {
    try {
      const response = await fetch('/api/admin/change-password?length=10')
      const data = await response.json()
      
      if (data.success) {
        setNewPassword(data.temporary_password)
        setConfirmPassword(data.temporary_password)
        toast({
          title: "🔑 Mot de passe généré",
          description: "Un mot de passe temporaire a été généré"
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la génération du mot de passe",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    // Validation
    if (!newPassword || !confirmPassword) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "❌ Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "❌ Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          new_password: newPassword
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "✅ Succès",
          description: `Mot de passe mis à jour pour ${user.full_name}`
        })
        handleClose()
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors de la mise à jour",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🔑 Changer le Mot de Passe</DialogTitle>
          <DialogDescription>
            Modifier le mot de passe pour <strong>{user.full_name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Entrez le nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-6 w-6 p-0"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateTempPassword}
                  className="h-6 w-6 p-0"
                  title="Générer un mot de passe"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirmez le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Conseils :</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Minimum 6 caractères</li>
              <li>• Utilisez le bouton 🔄 pour générer un mot de passe sécurisé</li>
              <li>• L'utilisateur devra utiliser ce nouveau mot de passe pour se connecter</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Changer le Mot de Passe'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
