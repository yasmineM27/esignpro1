"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

interface LoginCredentials {
  email: string
  password: string
}

// Fonction pour déterminer la redirection selon le rôle
const getRedirectPath = (role: string) => {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'agent':
      return '/agent'
    case 'client':
      return '/client-dashboard'
    default:
      return '/dashboard'
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Essayer d'abord avec l'API user-login (plus flexible)
      let response = await fetch('/api/auth/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      })

      let data = await response.json()

      // Si échec avec user-login, essayer avec agent-login
      if (!data.success && credentials.email.includes('@esignpro.ch')) {
        response = await fetch('/api/auth/agent-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          }),
        })
        data = await response.json()
      }

      if (data.success) {
        // Connexion réussie
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${data.user.first_name} ${data.user.last_name}`,
        })

        // Redirection selon le rôle
        const redirectPath = getRedirectPath(data.user.role)
        router.push(redirectPath)
      } else {
        setError(data.error || 'Email ou mot de passe incorrect')
      }
    } catch (error) {
      console.error('Erreur connexion:', error)
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = (email: string, password: string) => {
    setCredentials({ email, password })
    // Auto-submit after setting credentials
    setTimeout(() => {
      const form = document.getElementById('login-form') as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <Image
            src="/images/esignpro-logo.png"
            alt="eSignPro"
            width={180}
            height={54}
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Connexion Sécurisée</h1>
          <p className="text-gray-600">Accédez à votre espace professionnel</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Se connecter</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form id="login-form" onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                <Shield className="mr-2 h-4 w-4" />
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm text-center text-gray-600 font-medium">Connexion rapide pour la démo :</p>

              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent text-left justify-start"
                  onClick={() => handleQuickLogin("waelha@gmail.com", "admin123")}
                >
                  <Shield className="mr-2 h-4 w-4 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">Administrateur</div>
                    <div className="text-xs text-gray-500">waelha@gmail.com</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent text-left justify-start"
                  onClick={() => handleQuickLogin("agent.test@esignpro.ch", "test123")}
                >
                  <Mail className="mr-2 h-4 w-4 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Agent</div>
                    <div className="text-xs text-gray-500">agent.test@esignpro.ch</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent text-left justify-start"
                  onClick={() => handleQuickLogin("client.test@esignpro.ch", "client123")}
                >
                  <Mail className="mr-2 h-4 w-4 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Client</div>
                    <div className="text-xs text-gray-500">client.test@esignpro.ch</div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 space-y-2">
              <div>
                <Link href="/forgot-password" className="text-red-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div>
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-red-600 hover:underline font-medium">
                  Créer un compte
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Connexion sécurisée SSL • Conforme RGPD</p>
        </div>
      </div>
    </div>
  )
}
