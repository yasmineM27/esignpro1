"use client"

import { AuthTest } from "@/components/auth-test"
import { LogoutButton } from "@/components/logout-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test d'Authentification</h1>
            <p className="text-gray-600">Vérifiez le fonctionnement du système de logout</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Accueil
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test d'état d'authentification */}
          <AuthTest />

          {/* Test des boutons de logout */}
          <Card>
            <CardHeader>
              <CardTitle>Boutons de Déconnexion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Bouton Standard</h4>
                <LogoutButton />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Bouton Ghost</h4>
                <LogoutButton variant="ghost" />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Bouton Sans Icône</h4>
                <LogoutButton showIcon={false} />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Redirection Personnalisée</h4>
                <LogoutButton redirectTo="/" className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Liens de test */}
          <Card>
            <CardHeader>
              <CardTitle>Liens de Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  Page de Connexion
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/agent">
                  Espace Agent
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin">
                  Espace Admin
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/client-dashboard">
                  Espace Client
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions de Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-green-600">✅ Fonctionnalités Ajoutées:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Logout fonctionnel dans tous les espaces</li>
                  <li>Persistance de session avec vérification automatique</li>
                  <li>Navigation dynamique sur la page d'accueil</li>
                  <li>Protection des routes admin</li>
                  <li>Composants réutilisables pour l'authentification</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-600">🔄 Test de Persistance:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Connectez-vous à un espace</li>
                  <li>Actualisez la page (F5)</li>
                  <li>Vous devriez rester connecté</li>
                  <li>Cliquez "Déconnexion" pour tester le logout</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
