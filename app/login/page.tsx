"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

interface LoginCredentials {
  email: string
  password: string
}

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
      let response;
      let data;

      // Si l'email contient @esignpro.ch, essayer d'abord agent-login
      if (credentials.email.includes('@esignpro.ch')) {
        console.log('🔍 Email @esignpro.ch détecté, tentative agent-login...')
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
        console.log('🔍 Résultat agent-login:', data.success ? 'SUCCÈS' : 'ÉCHEC')

        // Si agent-login échoue, essayer user-login
        if (!data.success) {
          console.log('🔍 Agent-login échoué, tentative user-login...')
          response = await fetch('/api/auth/user-login', {
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
          console.log('🔍 Résultat user-login:', data.success ? 'SUCCÈS' : 'ÉCHEC')
        }
      } else {
        // Pour les autres emails, utiliser user-login directement
        console.log('🔍 Email standard, tentative user-login...')
        response = await fetch('/api/auth/user-login', {
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
        console.log('🔍 Résultat user-login:', data.success ? 'SUCCÈS' : 'ÉCHEC')
      }

      if (data.success) {
        console.log('🔍 Données utilisateur reçues:', data.user)
        console.log('🔍 Rôle utilisateur:', data.user.role)

        toast({
          title: "Connexion reussie",
          description: `Bienvenue ${data.user.first_name} ${data.user.last_name}`,
        })

        const redirectPath = getRedirectPath(data.user.role)
        console.log('🔍 Chemin de redirection calculé:', redirectPath)

        // Essayer la redirection avec router.push
        console.log('🔍 Tentative redirection avec router.push...')
        try {
          await router.push(redirectPath)
          console.log('✅ Redirection router.push réussie')
        } catch (error) {
          console.error('❌ Erreur router.push:', error)
          // Fallback avec window.location
          console.log('🔍 Fallback avec window.location...')
          window.location.href = redirectPath
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour a l'accueil
          </Link>
          <Image
            src="/images/esignpro-logo.png"
            alt="eSignPro"
            width={180}
            height={54}
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Connexion Securisee</h1>
          <p className="text-gray-600">Accedez a votre espace professionnel</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Se connecter</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour acceder a votre espace
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
                    placeholder="********"
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

            <div className="text-center text-sm text-gray-600 space-y-2">
              <div>
                <Link href="/forgot-password" className="text-red-600 hover:underline">
                  Mot de passe oublie ?
                </Link>
              </div>
              <div>
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-red-600 hover:underline font-medium">
                  Creer un compte
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Connexion securisee SSL - Conforme RGPD</p>
        </div>
      </div>
    </div>
  )
}
