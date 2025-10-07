'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function TestCasesSimple() {
  const [isLoading, setIsLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    signed: 0,
    completed: 0
  });

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      
      // Simuler des données pour test
      setTimeout(() => {
        const mockCases = [
          {
            id: '1',
            caseNumber: 'CASE-2024-001',
            client: { fullName: 'Jean Dupont', email: 'jean@example.com' },
            status: 'pending',
            priority: 'high',
            insuranceCompany: 'AXA',
            createdAt: new Date().toISOString(),
            hasSignature: false
          },
          {
            id: '2',
            caseNumber: 'CASE-2024-002',
            client: { fullName: 'Marie Martin', email: 'marie@example.com' },
            status: 'signed',
            priority: 'medium',
            insuranceCompany: 'Allianz',
            createdAt: new Date().toISOString(),
            hasSignature: true
          }
        ];

        setCases(mockCases);
        setStats({
          total: mockCases.length,
          pending: mockCases.filter(c => c.status === 'pending').length,
          active: mockCases.filter(c => c.status === 'active').length,
          signed: mockCases.filter(c => c.status === 'signed').length,
          completed: mockCases.filter(c => c.status === 'completed').length
        });
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Erreur test:', error);
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'signed': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Titre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Test - Gestion des Dossiers</span>
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Signés</p>
                <p className="text-2xl font-bold">{stats.signed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Terminés</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des dossiers */}
      <Card>
        <CardHeader>
          <CardTitle>Dossiers de Test</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Chargement des dossiers...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem: any) => (
                <div key={caseItem.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{caseItem.caseNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.client.fullName} - {caseItem.client.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.insuranceCompany}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getPriorityColor(caseItem.priority)}>
                        {caseItem.priority}
                      </Badge>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                      {caseItem.hasSignature && (
                        <Badge className="bg-green-100 text-green-800">
                          Signé
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Button onClick={loadCases} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Voir Tous
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
