'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TestUploadPage() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const supportedTypes = [
    { name: 'Images JPEG', mime: 'image/jpeg', ext: '.jpg, .jpeg' },
    { name: 'Images PNG', mime: 'image/png', ext: '.png' },
    { name: 'Documents PDF', mime: 'application/pdf', ext: '.pdf' },
    { name: 'Documents Word (ancien)', mime: 'application/msword', ext: '.doc' },
    { name: 'Documents Word (nouveau)', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx' },
    { name: 'Feuilles Excel (ancien)', mime: 'application/vnd.ms-excel', ext: '.xls' },
    { name: 'Feuilles Excel (nouveau)', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: '.xlsx' },
    { name: 'Fichiers Texte', mime: 'text/plain', ext: '.txt' },
  ];

  const testUpload = async (documentType: string, inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    
    if (!input?.files?.length) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un fichier",
        variant: "destructive",
      });
      return;
    }

    setUploading(documentType);

    const formData = new FormData();
    for (let file of input.files) {
      formData.append('files', file);
    }
    formData.append('token', 'test-token-123');
    formData.append('clientId', 'test-client-456');
    formData.append('documentType', documentType);

    try {
      const response = await fetch('/api/client/upload-separated-documents', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "✅ Succès !",
          description: `${input.files.length} fichier(s) accepté(s) : ${Array.from(input.files).map(f => f.name).join(', ')}`,
        });
      } else {
        toast({
          title: "❌ Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erreur réseau",
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          🧪 Test des Types de Fichiers - eSignPro
        </h1>
        <p className="text-center text-gray-600">
          Cette page permet de tester tous les types de fichiers maintenant supportés par eSignPro.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-green-600">📋 Types de Fichiers Supportés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportedTypes.map((type, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="font-semibold text-green-800">{type.name}</div>
                <div className="text-sm text-green-600 font-mono">{type.ext}</div>
                <div className="text-xs text-gray-500 font-mono">{type.mime}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">🆔 Test Carte d'Identité - RECTO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                id="identity-front"
                multiple
                accept="image/jpeg,image/png,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <Button
                onClick={() => testUpload('identity_front', 'identity-front')}
                disabled={uploading === 'identity_front'}
                className="w-full"
              >
                {uploading === 'identity_front' ? 'Test en cours...' : 'Tester Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">🆔 Test Carte d'Identité - VERSO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                id="identity-back"
                multiple
                accept="image/jpeg,image/png,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <Button
                onClick={() => testUpload('identity_back', 'identity-back')}
                disabled={uploading === 'identity_back'}
                className="w-full"
              >
                {uploading === 'identity_back' ? 'Test en cours...' : 'Tester Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">📄 Test Contrat d'Assurance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                id="insurance-contract"
                multiple
                accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <Button
                onClick={() => testUpload('insurance_contract', 'insurance-contract')}
                disabled={uploading === 'insurance_contract'}
                className="w-full"
              >
                {uploading === 'insurance_contract' ? 'Test en cours...' : 'Tester Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">📎 Test Documents Supplémentaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                id="additional"
                multiple
                accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <Button
                onClick={() => testUpload('additional', 'additional')}
                disabled={uploading === 'additional'}
                className="w-full"
              >
                {uploading === 'additional' ? 'Test en cours...' : 'Tester Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
