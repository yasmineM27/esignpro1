"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AdminAuthDiagnostic } from "@/components/admin-auth-diagnostic"
import { Shield, LogIn, Home, TestTube } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function AdminTestPage() {
  const [loginData, setLoginData] = useState({
    email: 'admin@esignpro.ch',
    password: ''
  })
  const [isLogging, setIsLogging] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLogging(true)

    try {
      const response = await fetch('/api/auth/agent-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Connexion réussie",
          description: `Connecté en tant que ${data.user.role}: ${data.user.email}`,
        })
        
        // Recharger la page pour mettre à jour le diagnostic
        window.location.reload()
      } else {
        toast({
          title: "❌ Erreur de connexion",
          description: data.error || 'Identifiants incorrects',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erreur technique",
        description: "Impossible de se connecter au serveur",
        variant: "destructive"
      })
    } finally {
      setIsLogging(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      toast({
        title: "✅ Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès"
      })

      // Recharger la page pour mettre à jour le diagnostic
      window.location.reload()
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <TestTube className="h-8 w-8 text-blue-600" />
              <span>Test Interface Admin</span>
            </h1>
            <p className="text-gray-600">Diagnostic et test d'accès à l'administration</p>
          </div>
          <div className="flex space-x-3">
            <Button asChild variant="outline">
              <Link href="/api-test">
                <TestTube className="h-4 w-4 mr-2" />
                Tests APIs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Link>
            </Button>
          </div>
        </div>

        {/* Diagnostic d'authentification */}
        <AdminAuthDiagnostic />

        {/* Formulaire de connexion de test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LogIn className="h-5 w-5" />
              <span>Connexion Test Admin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Admin</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@esignpro.ch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Entrez le mot de passe admin"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  disabled={isLogging || !loginData.email || !loginData.password}
                  className="flex-1"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isLogging ? 'Connexion...' : 'Se connecter'}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="flex-1"
                >
                  Se déconnecter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">🔍 Diagnostic</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vérifiez l'état de votre authentification</li>
                  <li>• Contrôlez le type de token présent</li>
                  <li>• Validez les permissions admin</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">🧪 Test de Connexion</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Utilisez les identifiants admin</li>
                  <li>• Vérifiez la création du token</li>
                  <li>• Testez l'accès à l'interface admin</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Comptes de Test Disponibles:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-3 rounded border">
                  <Badge className="mb-2">Admin</Badge>
                  <p><strong>Email:</strong> admin@esignpro.ch</p>
                  <p><strong>Rôle:</strong> admin</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <Badge variant="secondary" className="mb-2">Agent</Badge>
                  <p><strong>Email:</strong> agent.test@esignpro.ch</p>
                  <p><strong>Rôle:</strong> agent</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <Badge variant="outline" className="mb-2">Client</Badge>
                  <p><strong>Email:</strong> client.test@esignpro.ch</p>
                  <p><strong>Rôle:</strong> client</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/admin">
                  <div className="text-center">
                    <Shield className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Interface Admin</div>
                    <div className="text-xs text-gray-500">Accéder à l'administration</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/agent">
                  <div className="text-center">
                    <TestTube className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Interface Agent</div>
                    <div className="text-xs text-gray-500">Tester l'espace agent</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/login">
                  <div className="text-center">
                    <LogIn className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Page de Connexion</div>
                    <div className="text-xs text-gray-500">Connexion principale</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
