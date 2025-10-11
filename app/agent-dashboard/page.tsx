'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Clock, 
  LogOut, 
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AgentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  last_login: string | null;
  agent: {
    id: string;
    agent_code: string;
    department: string;
    is_supervisor: boolean;
  };
}

interface DashboardStats {
  totalClients: number;
  activeCases: number;
  todaySignatures: number;
  successRate: number;
  totalCases: number;
  completedCases: number;
  monthlyStats: Array<{
    month: string;
    cases: number;
    completed: number;
  }>;
  recentActivity: Array<{
    id: string;
    status: string;
    created_at: string;
  }>;
}

export default function AgentDashboard() {
  const [user, setUser] = useState<AgentUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/agent-login');
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        // Charger les statistiques après l'authentification
        loadStats();
      } else {
        router.push('/agent-login');
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/agent/dashboard-stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Erreur chargement stats:', data.error);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/agent-login', { method: 'DELETE' });
      router.push('/agent-login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Erreur de chargement'}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => router.push('/agent-login')}
            >
              Retour à la connexion
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image 
                src="/images/esignpro-logo.png" 
                alt="eSignPro" 
                width={150} 
                height={45} 
                className="h-10 w-auto"
              />
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard Agent</h1>
                <p className="text-sm text-gray-600">
                  {user.agent.department} • {user.agent.agent_code}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={user.agent.is_supervisor ? "default" : "secondary"}>
                    {user.agent.is_supervisor ? 'Superviseur' : 'Agent'}
                  </Badge>
                  <span className="text-xs text-gray-600">{user.email}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue, {user.first_name} ! 👋
          </h2>
          <p className="text-gray-600">
            Voici un aperçu de votre activité et de vos tâches du jour.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mes Clients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.totalClients || 0
                    )}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dossiers Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.activeCases || 0
                    )}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Signatures Aujourd'hui</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.todaySignatures || 0
                    )}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${stats?.successRate || 0}%`
                    )}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mes Clients</CardTitle>
                  <CardDescription>Gérer mes clients assignés</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/agent/clients">
                  Voir mes clients
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Nouveau Dossier</CardTitle>
                  <CardDescription>Créer un nouveau dossier client</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Créer un dossier
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mes Statistiques</CardTitle>
                  <CardDescription>Performance et analytics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Voir les stats
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Vos dernières actions et notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune activité récente</p>
              <p className="text-sm">Vos actions apparaîtront ici</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
