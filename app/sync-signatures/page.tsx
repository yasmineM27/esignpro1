'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Zap, RefreshCw } from 'lucide-react';

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    totalCaseSignatures: number;
    clientsWithExistingSignatures: number;
    clientsNeedingMigration: number;
    migrationsPerformed: number;
    migrationErrors: number;
  };
  results: Array<{
    clientName: string;
    clientId: string;
    status: 'success' | 'error';
    error?: string;
    signatureName?: string;
    migratedFrom?: string;
    totalCaseSignatures?: number;
    newSignatureId?: string;
  }>;
}

export default function SyncSignaturesPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const performSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      console.log('🔄 Démarrage synchronisation forcée...');

      const response = await fetch('/api/force-signature-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setSyncResult(data);

      if (data.success) {
        console.log('✅ Synchronisation réussie:', data.message);
      } else {
        console.error('❌ Erreur synchronisation:', data.error);
      }

    } catch (error) {
      console.error('💥 Erreur réseau:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion au serveur';
      setSyncResult({
        success: false,
        message: errorMessage,
        stats: {
          totalCaseSignatures: 0,
          clientsWithExistingSignatures: 0,
          clientsNeedingMigration: 0,
          migrationsPerformed: 0,
          migrationErrors: 1
        },
        results: [{
          clientName: 'Erreur réseau',
          clientId: 'error',
          status: 'error',
          error: errorMessage
        }]
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🔄 Synchronisation des Signatures</h1>
        <p className="text-muted-foreground mb-6">
          Résoudre l'incohérence entre "Mes Clients" et "Terminés"
        </p>

        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Problème détecté :</strong> Certains clients ont des signatures dans leurs dossiers terminés 
            mais n'apparaissent pas avec "Signature disponible" dans "Mes Clients". 
            Cette synchronisation va corriger automatiquement ce problème.
          </AlertDescription>
        </Alert>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Synchronisation Automatique</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cette action va automatiquement créer des signatures réutilisables 
              pour tous les clients qui ont signé des dossiers mais n'ont pas 
              encore de signature dans "Mes Clients".
            </p>
            
            <Button 
              onClick={performSync}
              disabled={syncing}
              className="w-full"
              size="lg"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Synchroniser Maintenant
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Résultats de synchronisation */}
      {syncResult && (
        <div className="space-y-4">
          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {syncResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Résultats de la Synchronisation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-lg">{syncResult.message}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {syncResult.stats.totalCaseSignatures}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Signatures de dossiers
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {syncResult.stats.clientsWithExistingSignatures}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Déjà synchronisés
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {syncResult.stats.clientsNeedingMigration}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    À synchroniser
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {syncResult.stats.migrationsPerformed}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Synchronisés
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {syncResult.stats.migrationErrors}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Erreurs
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails des migrations */}
          {syncResult.results && syncResult.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Détails des Migrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncResult.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{result.clientName}</div>
                        {result.status === 'success' && result.migratedFrom && (
                          <div className="text-sm text-muted-foreground">
                            Migré depuis le dossier {result.migratedFrom}
                            {result.totalCaseSignatures && result.totalCaseSignatures > 1 && (
                              <span> ({result.totalCaseSignatures} signatures disponibles)</span>
                            )}
                          </div>
                        )}
                        {result.status === 'error' && result.error && (
                          <div className="text-sm text-red-600">
                            Erreur: {result.error}
                          </div>
                        )}
                      </div>

                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status === 'success' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Synchronisé
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Erreur
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message de succès complet */}
          {syncResult.success && syncResult.stats && syncResult.stats.migrationsPerformed > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Synchronisation réussie !</strong>
                {syncResult.stats.migrationsPerformed} client(s) ont maintenant leurs signatures
                synchronisées. Vous devriez maintenant voir "Signature disponible" pour ces clients
                dans "Mes Clients".
              </AlertDescription>
            </Alert>
          )}

          {/* Message si aucune migration nécessaire */}
          {syncResult.success && syncResult.stats && syncResult.stats.migrationsPerformed === 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Aucune action nécessaire !</strong>
                Toutes les signatures sont déjà synchronisées entre "Mes Clients" et "Terminés".
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
