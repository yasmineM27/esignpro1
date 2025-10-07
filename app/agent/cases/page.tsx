'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AgentCasesManagement from '@/components/agent-cases-management';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Filter,
  Download,
  Settings,
  RefreshCw
} from 'lucide-react';

export default function CasesPage() {
  const [activeView, setActiveView] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/agent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour Agent
                </Link>
              </Button>
              <Image 
                src="/images/esignpro-logo.png" 
                alt="eSignPro" 
                width={150} 
                height={45} 
                className="h-10 w-auto" 
              />
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">Gestion des Dossiers</h1>
                <p className="text-sm text-gray-500">Vue d'ensemble et gestion complète</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <FileText className="h-3 w-3 mr-1" />
                Dossiers Actifs
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-sm p-1">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Tous</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>En Attente</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Actifs</span>
              </TabsTrigger>
              <TabsTrigger value="signed" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Signés</span>
              </TabsTrigger>
              <TabsTrigger value="priority" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Priorité</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Tous les Dossiers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgentCasesManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span>Dossiers en Attente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Dossiers en attente de signature ou de documents
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Envoyer Rappels
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </div>
                  {/* Le composant AgentCasesManagement avec filtre pending */}
                  <div className="mt-4">
                    <AgentCasesManagement />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Dossiers Actifs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Dossiers avec documents uploadés, en cours de traitement
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtres Avancés
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Valider Sélection
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <AgentCasesManagement />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Dossiers Signés</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Dossiers avec signature électronique validée
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger Tout
                      </Button>
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Générer Rapport
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <AgentCasesManagement />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="priority" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  <span>Dossiers Prioritaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Dossiers marqués comme priorité haute ou urgents
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Marquer Urgent
                      </Button>
                      <Button size="sm" variant="destructive">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Action Immédiate
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <AgentCasesManagement />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Dossiers ce Mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">127</div>
                  <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Signature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-xs text-muted-foreground">+5% vs mois dernier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Délai Moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2j</div>
                  <p className="text-xs text-muted-foreground">-0.8j vs mois dernier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8/5</div>
                  <p className="text-xs text-muted-foreground">+0.2 vs mois dernier</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analyse Détaillée</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Graphiques et analyses détaillées des performances
                  </p>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Graphiques à implémenter</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
