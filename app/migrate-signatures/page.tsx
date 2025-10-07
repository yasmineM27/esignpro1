'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  FileSignature,
  Users,
  Zap
} from 'lucide-react';

interface MigrationStatus {
  oldSignatures: number;
  newSignatures: number;
  needsMigration: boolean;
  message: string;
}

interface MigrationResult {
  migrated: number;
  existing: number;
  errors: number;
  details: {
    migratedSignatures: Array<{
      clientId: string;
      clientName: string;
      signatureId: string;
    }>;
    errors: Array<{
      client: string;
      error: string;
    }>;
  };
}

export default function MigrateSignaturesPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/migrate-signatures');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || 'Erreur lors de la vérification');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const runMigration = async () => {
    setIsMigrating(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/migrate-signatures', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        // Actualiser le statut après migration
        await checkStatus();
      } else {
        setError(data.error || 'Erreur lors de la migration');
      }
    } catch (err) {
      setError('Erreur de connexion lors de la migration');
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          🔄 Migration des Signatures
        </h1>
        <p className="text-center text-gray-600">
          Migration des signatures de l'ancienne table vers la nouvelle structure
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Erreur :</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statut actuel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            État Actuel des Signatures
            <Button
              onClick={checkStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Vérification en cours...</span>
            </div>
          ) : status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSignature className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Ancienne Table</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-800">{status.oldSignatures}</div>
                  <div className="text-sm text-orange-600">signatures dans "signatures"</div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Nouvelle Table</span>
                  </div>
                  <div className="text-2xl font-bold text-green-800">{status.newSignatures}</div>
                  <div className="text-sm text-green-600">signatures dans "client_signatures"</div>
                </div>
              </div>

              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Ancienne: {status.oldSignatures}
                  </Badge>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Nouvelle: {status.newSignatures}
                  </Badge>
                </div>
              </div>

              <Alert className={status.needsMigration ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{status.needsMigration ? "Migration nécessaire" : "Migration complète"} :</strong> {status.message}
                </AlertDescription>
              </Alert>

              {status.needsMigration && (
                <div className="text-center pt-4">
                  <Button
                    onClick={runMigration}
                    disabled={isMigrating}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Zap className={`h-5 w-5 mr-2 ${isMigrating ? 'animate-pulse' : ''}`} />
                    {isMigrating ? 'Migration en cours...' : 'Lancer la Migration'}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Résultats de migration */}
      {result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Résultats de la Migration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">{result.migrated}</div>
                  <div className="text-sm text-green-600">Signatures migrées</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">{result.existing}</div>
                  <div className="text-sm text-blue-600">Déjà existantes</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-800">{result.errors}</div>
                  <div className="text-sm text-red-600">Erreurs</div>
                </div>
              </div>

              {result.details.migratedSignatures.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Signatures migrées avec succès :</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.details.migratedSignatures.map((sig, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{sig.clientName}</span>
                        <Badge variant="secondary" className="text-xs">{sig.signatureId.slice(0, 8)}...</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.details.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Erreurs de migration :</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.details.errors.map((err, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm bg-red-50 p-2 rounded">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <div className="font-medium">{err.client}</div>
                          <div className="text-red-600">{err.error}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button
          onClick={() => window.location.href = '/agent'}
          variant="outline"
        >
          ← Retour au Dashboard Agent
        </Button>
      </div>
    </div>
  );
}
