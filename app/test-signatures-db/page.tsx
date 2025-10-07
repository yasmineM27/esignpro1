'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSignature, User, AlertCircle, CheckCircle, Database } from 'lucide-react';

interface SignatureInfo {
  clientId: string;
  clientName: string;
  clientEmail: string;
  signatures: Array<{
    id: string;
    signature_name: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
  }>;
}

export default function TestSignaturesDBPage() {
  const [signatures, setSignatures] = useState<SignatureInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSignatures = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test/signatures-status');
      const data = await response.json();
      
      if (data.success) {
        setSignatures(data.signatures);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSignatures();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          🔍 Test des Signatures en Base de Données
        </h1>
        <p className="text-center text-gray-600">
          Cette page permet de vérifier l'état des signatures stockées dans la base de données.
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <Button onClick={loadSignatures} disabled={isLoading}>
          <Database className="h-4 w-4 mr-2" />
          {isLoading ? 'Chargement...' : 'Actualiser les données'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Erreur :</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Chargement des signatures...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Résumé des Signatures ({signatures.length} clients)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {signatures.filter(s => s.signatures.length > 0).length}
                  </div>
                  <div className="text-sm text-green-600">Clients avec signature</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {signatures.filter(s => s.signatures.length === 0).length}
                  </div>
                  <div className="text-sm text-orange-600">Clients sans signature</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {signatures.reduce((total, s) => total + s.signatures.length, 0)}
                  </div>
                  <div className="text-sm text-blue-600">Total signatures</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {signatures.map((client) => (
              <Card key={client.clientId} className={`${
                client.signatures.length > 0 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-orange-200 bg-orange-50'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        client.signatures.length > 0 
                          ? 'bg-green-100' 
                          : 'bg-orange-100'
                      }`}>
                        <User className={`h-5 w-5 ${
                          client.signatures.length > 0 
                            ? 'text-green-600' 
                            : 'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.clientName}</h3>
                        <p className="text-sm text-gray-600">{client.clientEmail}</p>
                        <p className="text-xs text-gray-500">ID: {client.clientId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {client.signatures.length > 0 ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {client.signatures.length} signature(s)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Aucune signature
                        </Badge>
                      )}
                    </div>
                  </div>

                  {client.signatures.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Signatures disponibles :</h4>
                      {client.signatures.map((sig) => (
                        <div key={sig.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                          <div>
                            <span className="font-medium">{sig.signature_name}</span>
                            {sig.is_default && (
                              <Badge variant="secondary" className="ml-2 text-xs">Par défaut</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={sig.is_active ? "default" : "secondary"}>
                              {sig.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(sig.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {signatures.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune donnée de signature trouvée</p>
                  <p className="text-sm">Vérifiez que la base de données contient des clients avec signatures</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
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
