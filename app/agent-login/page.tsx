'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck, Mail, Lock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AgentLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    agent_code: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Essayer d'abord avec l'API agent-login
      let response = await fetch('/api/auth/agent-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let data = await response.json();

      // Si échec avec agent-login, essayer avec user-login (plus flexible)
      if (!data.success) {
        response = await fetch('/api/auth/user-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        data = await response.json();
      }

      if (data.success) {
        // Vérifier que l'utilisateur a le bon rôle et rediriger selon le rôle
        if (data.user.role === 'agent') {
          // Rediriger vers l'espace agent
          router.push('/agent');
        } else if (data.user.role === 'admin') {
          // Rediriger vers l'interface admin
          router.push('/admin');
        } else {
          setError('Accès réservé aux agents et administrateurs');
        }
      } else {
        setError(data.error || 'Login ou mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/images/esignpro-logo.png" 
              alt="eSignPro" 
              width={200} 
              height={60} 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Espace Agent</h1>
          <p className="text-gray-600">Connectez-vous à votre compte agent</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center flex items-center justify-center">
              <UserCheck className="mr-2 h-5 w-5 text-blue-600" />
              Connexion Agent
            </CardTitle>
            <CardDescription className="text-center">
              Accédez à votre tableau de bord agent
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@esignpro.ch"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent_code">Code Agent (optionnel)</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="agent_code"
                    type="text"
                    placeholder="Ex: RES123456"
                    value={formData.agent_code}
                    onChange={(e) => handleInputChange('agent_code', e.target.value.toUpperCase())}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Le code agent permet une identification plus rapide
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Problème de connexion ?{' '}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  Contactez le support
                </Link>
              </p>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  Accès réservé aux agents eSignPro
                </p>
                <Link 
                  href="/" 
                  className="text-xs text-blue-600 hover:underline"
                >
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de démo */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-yellow-800 mb-2">🚀 Mode Démo</h3>
            <p className="text-sm text-yellow-700 mb-2">
              Pour tester la connexion, utilisez n'importe quel email d'agent existant avec un mot de passe de 4 caractères minimum.
            </p>
            <div className="text-xs text-yellow-600 space-y-1">
              <p><strong>Exemple:</strong></p>
              <p>• Email: wael.hamda@esignpro.ch</p>
              <p>• Mot de passe: demo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
