'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import SignatureCanvas from '@/components/signature-canvas';
import ClientPortalUpload from '@/components/client-portal-upload';
import {
  FileText,
  Signature,
  Check,
  X,
  Edit,
  Trash2,
  Shield,
  Clock,
  User,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react';

interface CaseData {
  id: string;
  case_number: string;
  secure_token: string;
  status: string;
  insurance_company: string;
  policy_number: string;
  policy_type?: string;
  termination_date?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface DocumentData {
  id: string;
  documenttype: string;
  filename: string;
  status: string;
  uploaddate: string;
}

interface ClientSignature {
  id: string;
  signature_data: string;
  signature_name: string;
  created_at: string;
  is_active: boolean;
}

interface EnhancedClientPortalProps {
  caseData: CaseData;
  documents: DocumentData[];
  token: string;
}

const CGU_TEXT = `
**Conditions Générales d'Utilisation du Système de Signature à Distance eSignpro**

**1. Présentation et Définitions**
Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation du système de signature électronique à distance, développé sous la marque eSignpro. Ce système est la propriété de Opsio Sàrl et est utilisé exclusivement par elle-même.

**2. Objet du service**
Le système de signature eSignpro permet à l'utilisateur de procéder à une signature unique, valable pour un ensemble de documents préalablement sélectionnés par un conseiller.

**3. Acceptation des CGU**
En signant électroniquement via la plateforme eSignpro, l'Utilisateur accepte expressément les présentes Conditions Générales.

**4. Documents concernés**
• Lettre de résiliation de l'assurance de base suisse (Lamal)
• Lettre de résiliation d'assurance complémentaire (LCA)
• Procès-verbal d'entretien
• Document Article 45
• Formulaire d'ouverture de compte de libre passage auprès de la Fondation Lemania
• Lettre de transfert des avoirs LPP et de libre passage vers Lemania
• Procuration pour la recherche d'un emploi (recherche active)
• Procuration pour la recherche d'avoirs de libre passage et LPP

**5. Sécurité, confidentialité et conformité**
La plateforme eSignpro intègre des standards élevés de cybersécurité avec connexion sécurisée par chiffrement SSL/TLS.

**6. Valeur légale de la signature**
La signature électronique a la même valeur juridique qu'une signature manuscrite, conformément à la législation suisse.

**7. Responsabilités**
L'Utilisateur s'engage à fournir des informations exactes et à vérifier le contenu des documents avant signature.

**8. Archivage et conservation**
Les documents signés sont archivés de manière sécurisée pour une période légale de 10 ans.

**9. Droit applicable**
Les présentes CGU sont régies par le droit suisse.
`;

export default function EnhancedClientPortal({ caseData, documents, token }: EnhancedClientPortalProps) {
  const [clientSignature, setClientSignature] = useState<ClientSignature | null>(null);
  const [loading, setLoading] = useState(true);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [showCguModal, setShowCguModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isEditingSignature, setIsEditingSignature] = useState(false);

  // Récupérer la signature du client au chargement
  useEffect(() => {
    fetchClientSignature();
  }, []);

  const fetchClientSignature = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client-portal/signature?token=${token}`);
      const data = await response.json();
      
      if (data.success && data.signature) {
        setClientSignature(data.signature);
      }
    } catch (error) {
      console.error('Erreur récupération signature:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSignature = async () => {
    if (!clientSignature) return;

    try {
      const response = await fetch(`/api/client-portal/signature`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureId: clientSignature.id, token })
      });

      const data = await response.json();

      if (data.success) {
        setClientSignature(null);
        toast({
          title: "✅ Signature supprimée",
          description: "Votre signature a été supprimée avec succès.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de supprimer la signature.",
        variant: "destructive"
      });
    }
  };

  const handleSaveSignature = async (signatureData: string, signatureName: string) => {
    try {
      const method = isEditingSignature ? 'PUT' : 'POST';
      const body = isEditingSignature
        ? { signatureId: clientSignature?.id, token, signatureData, signatureName }
        : { token, signatureData, signatureName };

      const response = await fetch(`/api/client-portal/signature`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setClientSignature(data.signature);
        setShowSignatureModal(false);
        setIsEditingSignature(false);
        setCguAccepted(false);
        toast({
          title: "✅ Signature sauvegardée",
          description: isEditingSignature
            ? "Votre signature a été mise à jour avec succès."
            : "Votre signature a été créée avec succès.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de sauvegarder la signature.",
        variant: "destructive"
      });
    }
  };

  const handleEditSignature = () => {
    setIsEditingSignature(true);
    setShowSignatureModal(true);
  };

  const handleCancelSignature = () => {
    setShowSignatureModal(false);
    setIsEditingSignature(false);
    setCguAccepted(false);
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      'draft': { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
      'email_sent': { label: 'En attente de documents', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'documents_uploaded': { label: 'Documents reçus', color: 'bg-blue-100 text-blue-800', icon: FileText },
      'signed': { label: 'Signé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'completed': { label: 'Terminé', color: 'bg-emerald-100 text-emerald-800', icon: Check },
      'validated': { label: 'Validé', color: 'bg-emerald-100 text-emerald-800', icon: Check }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
  };

  const getProgressPercentage = (status: string, documentsCount: number): number => {
    if (status === 'completed' || status === 'validated') return 100;
    if (status === 'signed') return 90;
    if (status === 'documents_uploaded' && documentsCount > 0) return 70;
    if (status === 'email_sent') return 30;
    if (status === 'draft') return 10;
    return 10;
  };

  const statusInfo = getStatusDisplay(caseData.status);
  const StatusIcon = statusInfo.icon;
  const progress = getProgressPercentage(caseData.status, documents.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 mr-3" />
              <div>
                <CardTitle className="text-3xl font-bold">eSignpro</CardTitle>
                <p className="text-blue-100 mt-1">Signature électronique sécurisée</p>
              </div>
            </div>
            <h1 className="text-2xl font-semibold">
              Bonjour {caseData.client_name}
            </h1>
            <p className="text-blue-100">
              Finalisation de votre dossier {caseData.case_number}
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations du dossier */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Informations du dossier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barre de progression */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progression</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Statut */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Statut:</span>
                  <Badge className={statusInfo.color}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>

                {/* Détails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Assurance</p>
                      <p className="font-medium">{caseData.insurance_company}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Police</p>
                      <p className="font-medium">{caseData.policy_number}</p>
                    </div>
                  </div>
                  {caseData.termination_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Date de résiliation</p>
                        <p className="font-medium">
                          {new Date(caseData.termination_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upload de Documents */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload de Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientPortalUpload token={token} initialDocuments={documents} />
              </CardContent>
            </Card>
          </div>

          {/* Section Signature */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Signature className="h-5 w-5 mr-2" />
                  Ma Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Chargement...</p>
                  </div>
                ) : clientSignature ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <img 
                          src={clientSignature.signature_data} 
                          alt="Ma signature" 
                          className="max-w-full h-20 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Signature créée le {new Date(clientSignature.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditSignature}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deleteSignature}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="py-8">
                      <Signature className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">
                        Aucune signature enregistrée
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => setShowCguModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Signature className="h-4 w-4 mr-2" />
                      Créer ma signature
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations de sécurité */}
            <Card className="shadow-lg border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Shield className="h-5 w-5 mr-2" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Connexion sécurisée SSL/TLS
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Signature conforme à la loi suisse
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Archivage sécurisé 10 ans
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal CGU */}
        <Dialog open={showCguModal} onOpenChange={setShowCguModal}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Conditions Générales d'Utilisation
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96 pr-4">
              <div className="whitespace-pre-line text-sm text-gray-700">
                {CGU_TEXT}
              </div>
            </ScrollArea>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cgu-accept" 
                  checked={cguAccepted}
                  onCheckedChange={setCguAccepted}
                />
                <label htmlFor="cgu-accept" className="text-sm font-medium">
                  J'accepte les Conditions Générales d'Utilisation
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCguModal(false)}>
                  Annuler
                </Button>
                <Button 
                  disabled={!cguAccepted}
                  onClick={() => {
                    setShowCguModal(false);
                    setShowSignatureModal(true);
                  }}
                >
                  Continuer vers la signature
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Signature */}
        <Dialog open={showSignatureModal} onOpenChange={handleCancelSignature}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditingSignature ? 'Modifier ma signature' : 'Créer ma signature électronique'}
              </DialogTitle>
            </DialogHeader>
            <SignatureCanvas
              onSave={handleSaveSignature}
              onCancel={handleCancelSignature}
              existingSignature={isEditingSignature ? clientSignature : null}
              isEditing={isEditingSignature}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
