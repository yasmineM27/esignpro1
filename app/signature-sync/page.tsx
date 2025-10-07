'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Users, FileSignature, ArrowRight } from 'lucide-react';

interface SignatureAnalysis {
  stats: {
    totalCaseSignatures: number;
    totalClientSignatures: number;
    clientsWithCaseSignatures: number;
    clientsWithClientSignatures: number;
    clientsNeedingMigration: number;
    clientsWithBoth: number;
  };
  clientsNeedingMigration: Array<{
    clientId: string;
    clientName: string;
    clientCode: string;
    email: string;
    signaturesWithData: number;
    mostRecentSignature: {
      id: string;
      caseNumber: string;
      signedAt: string;
      createdAt: string;
    };
  }>;
}

export default function SignatureSyncPage() {
  const [analysis, setAnalysis] = useState<SignatureAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/migrate-case-signatures-to-client');
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data);
      } else {
        console.error('Erreur analyse:', data.error);
      }
    } catch (error) {
      console.error('Erreur chargement analyse:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateAllSignatures = async () => {
    try {
      setMigrating(true);
      const response = await fetch('/api/migrate-case-signatures-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate_all_needed' })
      });
      
      const data = await response.json();
      setMigrationResults(data);
      
      if (data.success) {
        // Recharger l'analyse après migration
        await loadAnalysis();
      }
    } catch (error) {
      console.error('Erreur migration:', error);
    } finally {
      setMigrating(false);
    }
  };

  const migrateSingleSignature = async (clientId: string, signatureId: string) => {
    try {
      const response = await fetch('/api/migrate-case-signatures-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'migrate_client_signature',
          clientId,
          signatureId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recharger l'analyse après migration
        await loadAnalysis();
      }
      
      return data;
    } catch (error) {
      console.error('Erreur migration individuelle:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Analyse des signatures en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Synchronisation des Signatures</h1>
          <p className="text-muted-foreground mt-2">
            Résolution des incohérences entre signatures de dossiers et signatures clients
          </p>
        </div>
        <Button onClick={loadAnalysis} variant="outline">
          Actualiser l'analyse
        </Button>
      </div>

      {/* Statistiques globales */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileSignature className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Signatures Dossiers</p>
                  <p className="text-2xl font-bold">{analysis.stats.totalCaseSignatures}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Signatures Clients</p>
                  <p className="text-2xl font-bold">{analysis.stats.totalClientSignatures}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Clients Synchronisés</p>
                  <p className="text-2xl font-bold">{analysis.stats.clientsWithBoth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">À Migrer</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analysis.stats.clientsNeedingMigration}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Clients avec Dossiers</p>
                  <p className="text-2xl font-bold">{analysis.stats.clientsWithCaseSignatures}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileSignature className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Clients avec Signatures</p>
                  <p className="text-2xl font-bold">{analysis.stats.clientsWithClientSignatures}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Problème identifié */}
      {analysis && analysis.stats.clientsNeedingMigration > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Problème détecté :</strong> {analysis.stats.clientsNeedingMigration} client(s) 
            ont des signatures dans leurs dossiers mais pas de signatures réutilisables. 
            Cela cause l'incohérence que vous observez entre "Mes Clients" et "Terminés".
          </AlertDescription>
        </Alert>
      )}

      {/* Action de migration globale */}
      {analysis && analysis.stats.clientsNeedingMigration > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowRight className="h-5 w-5" />
              <span>Migration Automatique</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Migrer automatiquement les signatures de dossiers vers des signatures clients réutilisables 
              pour résoudre l'incohérence.
            </p>
            <Button 
              onClick={migrateAllSignatures}
              disabled={migrating}
              className="w-full"
            >
              {migrating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Migration en cours...
                </>
              ) : (
                <>
                  Migrer toutes les signatures ({analysis.stats.clientsNeedingMigration})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Résultats de migration */}
      {migrationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {migrationResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Résultats de Migration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{migrationResults.message}</p>
            
            {migrationResults.migrations && (
              <div className="space-y-2">
                {migrationResults.migrations.map((migration: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{migration.clientName}</span>
                    <Badge variant={migration.status === 'success' ? 'default' : 'destructive'}>
                      {migration.status === 'success' ? 'Migré' : 'Erreur'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Liste détaillée des clients à migrer */}
      {analysis && analysis.clientsNeedingMigration.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clients Nécessitant une Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.clientsNeedingMigration.map((client) => (
                <div key={client.clientId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{client.clientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {client.email} • Code: {client.clientCode}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {client.signaturesWithData} signature(s) disponible(s)
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    Signature la plus récente du dossier {client.mostRecentSignature.caseNumber}
                    {client.mostRecentSignature.signedAt && (
                      <span> • Signée le {new Date(client.mostRecentSignature.signedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => migrateSingleSignature(client.clientId, client.mostRecentSignature.id)}
                    variant="outline"
                  >
                    Migrer cette signature
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message de succès */}
      {analysis && analysis.stats.clientsNeedingMigration === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Parfait !</strong> Toutes les signatures sont synchronisées. 
            Il n'y a plus d'incohérence entre "Mes Clients" et "Terminés".
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
