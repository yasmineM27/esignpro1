"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, FileText, Mail, Eye, Users, FileSignature, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { ClientSelection } from "./client-selection"
import { MultiTemplateGenerator } from "./multi-template-generator"

interface PersonInfo {
  nom: string
  prenom: string
  dateNaissance: string
  numeroPolice: string
}

interface ClientData {
  // Informations principales du client
  nom: string
  prenom: string
  dateNaissance: string
  numeroPolice: string
  email: string
  telephone: string

  // Adresse séparée
  adresse: string
  npa: string
  ville: string

  // Type de formulaire et destinataire
  typeFormulaire: 'resiliation' | 'souscription' | 'modification' | 'autre'
  destinataire: string
  lieuDate: string

  // Personnes supplémentaires (famille)
  personnes: PersonInfo[]

  // Dates spécifiques
  dateLamal: string
  dateLCA: string

  // Champs calculés/legacy (pour compatibilité)
  nomPrenom: string
  npaVille: string
}

export function ClientForm() {
  const { toast } = useToast()

  // Client selection state
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [showClientSelection, setShowClientSelection] = useState(true)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null)

  const [clientData, setClientData] = useState<ClientData>({
    // Informations principales du client
    nom: "",
    prenom: "",
    dateNaissance: "",
    numeroPolice: "",
    email: "",
    telephone: "",

    // Adresse séparée
    adresse: "",
    npa: "",
    ville: "",

    // Type de formulaire et destinataire
    typeFormulaire: 'resiliation' as const,
    destinataire: "",
    lieuDate: new Date().toLocaleDateString('fr-CH'),

    // Personnes supplémentaires (famille)
    personnes: [],

    // Dates spécifiques
    dateLamal: "",
    dateLCA: "",

    // Champs calculés/legacy (pour compatibilité)
    nomPrenom: "",
    npaVille: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isDownloadingWord, setIsDownloadingWord] = useState(false)
  const [isSavingWithSignature, setIsSavingWithSignature] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [secureToken, setSecureToken] = useState<string | null>(null)

  const [showMultiTemplateGenerator, setShowMultiTemplateGenerator] = useState(false)

  // Handle client selection
  const handleClientSelected = (client: any) => {
    setSelectedClient(client)
    setShowClientSelection(false)
    setShowNewClientForm(false)

    // Pre-fill form with client data
    setClientData(prev => ({
      ...prev,
      nom: client.lastName,
      prenom: client.firstName,
      email: client.email,
      telephone: client.phone || "",
      adresse: client.address || "",
      npa: client.postalCode || "",
      ville: client.city || "",
      nomPrenom: client.fullName,
      npaVille: `${client.postalCode || ""} ${client.city || ""}`.trim(),
      dateNaissance: client.dateOfBirth || ""
    }))

    setClientId(client.id)
  }

  const handleNewClientRequested = () => {
    setSelectedClient(null)
    setShowClientSelection(false)
    setShowNewClientForm(true)
    setCurrentCaseId(null)

    // Clear form
    setClientData({
      nom: "",
      prenom: "",
      dateNaissance: "",
      numeroPolice: "",
      email: "",
      telephone: "",
      adresse: "",
      npa: "",
      ville: "",
      typeFormulaire: 'resiliation' as const,
      destinataire: "",
      lieuDate: new Date().toLocaleDateString('fr-CH'),
      personnes: [],
      dateLamal: "",
      dateLCA: "",
      nomPrenom: "",
      npaVille: "",
    })
  }

  const handleBackToClientSelection = () => {
    setShowClientSelection(true)
    setShowNewClientForm(false)
    setShowMultiTemplateGenerator(false)
    setSelectedClient(null)
    setCurrentCaseId(null)
  }

  // Fonction pour calculer les champs legacy automatiquement
  const updateCalculatedFields = (data: Partial<ClientData>) => {
    const updatedData = { ...clientData, ...data }

    // Calculer nomPrenom
    if (updatedData.nom && updatedData.prenom) {
      updatedData.nomPrenom = `${updatedData.prenom} ${updatedData.nom}`
    }

    // Calculer npaVille
    if (updatedData.npa && updatedData.ville) {
      updatedData.npaVille = `${updatedData.npa} ${updatedData.ville}`
    }

    return updatedData
  }

  // Fonction helper pour mettre à jour les données client
  const updateClientData = (updates: Partial<ClientData>) => {
    const updatedData = updateCalculatedFields(updates)
    setClientData(updatedData)
  }

  const addPerson = () => {
    if (clientData.personnes.length < 4) {
      updateClientData({
        personnes: [...clientData.personnes, { nom: "", prenom: "", dateNaissance: "", numeroPolice: "" }],
      })
    }
  }

  const removePerson = (index: number) => {
    const newPersonnes = clientData.personnes.filter((_, i) => i !== index)
    updateClientData({ personnes: newPersonnes })
  }

  const updatePerson = (index: number, field: keyof PersonInfo, value: string) => {
    const newPersonnes = [...clientData.personnes]
    newPersonnes[index] = { ...newPersonnes[index], [field]: value }
    updateClientData({ personnes: newPersonnes })
  }

  const downloadWordDocument = async () => {
    setIsDownloadingWord(true)

    try {
      const response = await fetch("/api/generate-word-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientData,
          clientId: selectedClient?.id || clientId,
          caseId: secureToken, // Le token sert aussi d'ID de cas
          includeSignature: true
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du document")
      }

      // Télécharger le fichier
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Resiliation_${clientData.nom}_${clientData.prenom}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Document téléchargé",
        description: "Le document Word a été généré et téléchargé avec succès.",
      })

    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      toast({
        title: "Erreur",
        description: "Impossible de générer le document Word.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingWord(false)
    }
  }

  // Handle save with signature for existing clients
  const handleSaveWithSignature = async () => {
    if (!selectedClient || !selectedClient.hasSignature) {
      toast({
        title: "❌ Aucune signature disponible",
        description: `Ce client n'a pas de signature enregistrée.`,
        variant: "destructive"
      })
      return
    }

    setIsSavingWithSignature(true)

    try {
      console.log('🔄 Début sauvegarde avec signature:', {
        clientId: selectedClient.id,
        clientName: selectedClient.fullName,
        hasSignature: selectedClient.hasSignature,
        formData: {
          nom: clientData.nom,
          prenom: clientData.prenom,
          email: clientData.email
        }
      })

      // Créer un vrai dossier avec signature via l'API qui fonctionne
      console.log('📁 Création dossier réel avec signature via client-selection...');
      const response = await fetch('/api/agent/client-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_case_for_client',
          clientId: selectedClient.id,
          caseData: {
            insuranceCompany: clientData.compagnieAssurance || 'Non spécifiée',
            policyNumber: clientData.numeroPolice || `POL-${Date.now()}`,
            policyType: 'resiliation',
            terminationDate: clientData.dateResiliation || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            reasonForTermination: clientData.motifResiliation || 'Demande client'
          }
        })
      })

      const data = await response.json()

      console.log('📥 Réponse API:', {
        status: response.status,
        success: data.success,
        error: data.error,
        data: data
      })

      if (data.success) {
        toast({
          title: "✅ Dossier sauvegardé avec signature !",
          description: `Dossier créé pour ${selectedClient.fullName} avec signature automatiquement appliquée.`,
          variant: "default"
        })

        // Mettre à jour les IDs pour les autres actions
        setCurrentCaseId(data.caseId)

        console.log('🎉 Dossier créé avec succès:', {
          caseId: data.caseId,
          message: data.message,
          success: data.success
        })
        setSecureToken(data.secureToken)

        // Optionnel : rediriger vers le générateur de templates
        setCurrentCaseId(data.caseId)
        setShowMultiTemplateGenerator(true)

      } else {
        // Afficher l'erreur détaillée dans la console ET dans le toast
        console.error('❌ ERREUR API DÉTAILLÉE:', {
          status: response.status,
          error: data.error,
          fullResponse: data
        });

        const detailedError = `${data.error || 'Erreur inconnue'} (Status: ${response.status})`;

        toast({
          title: "❌ Erreur de sauvegarde détaillée",
          description: detailedError,
          variant: "destructive"
        });

        throw new Error(detailedError)
      }
    } catch (error) {
      console.error('💥 ERREUR COMPLÈTE sauvegarde avec signature:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined,
        clientId: selectedClient?.id,
        clientName: selectedClient?.fullName
      })

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

      // Toast avec plus de détails
      toast({
        title: "❌ Erreur de sauvegarde",
        description: `Client: ${selectedClient?.fullName || 'Inconnu'} - ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsSavingWithSignature(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let caseResult;

      if (selectedClient) {
        // Create case for existing client
        const response = await fetch("/api/agent/client-selection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: 'create_case_for_client',
            clientId: selectedClient.id,
            caseData: {
              insuranceCompany: clientData.destinataire,
              policyNumber: clientData.numeroPolice,
              policyType: clientData.typeFormulaire,
              terminationDate: clientData.dateLamal || clientData.dateLCA,
              reasonForTermination: 'Résiliation à l\'échéance'
            },
            agentId: '550e8400-e29b-41d4-a716-446655440001' // UUID de l'agent par défaut
          }),
        })

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Erreur lors de la création du dossier')
        }

        caseResult = result.case
        setCurrentCaseId(caseResult.id)
        setSecureToken(caseResult.secureToken)

        // Show multi-template generator for existing client
        setShowMultiTemplateGenerator(true)

        toast({
          title: "Dossier créé avec succès",
          description: `Dossier ${caseResult.caseNumber} créé pour ${selectedClient.fullName}`,
        })

        return; // Exit early for existing client workflow

      } else {
        // Original workflow for new clients
        const generateResponse = await fetch("/api/generate-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clientData),
        })

        if (!generateResponse.ok) {
          throw new Error(`Erreur HTTP ${generateResponse.status}: ${generateResponse.statusText}`)
        }

        const generateResult = await generateResponse.json()

        if (!generateResult.success) {
          throw new Error(generateResult.error || generateResult.message || 'Erreur lors de la génération du document')
        }

        setGeneratedDocument(generateResult.documentContent)
        setClientId(generateResult.secureToken) // Utiliser le token sécurisé
        setCurrentCaseId(generateResult.caseId)

        console.log('✅ Document généré et dossier créé:', {
          caseId: generateResult.caseId,
          caseNumber: generateResult.caseNumber,
          secureToken: generateResult.secureToken
        })

        const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientEmail: clientData.email,
          clientName: `${clientData.prenom} ${clientData.nom}`,
          clientId: generateResult.secureToken, // Passer le token sécurisé
          documentContent: generateResult.documentContent,
          caseId: generateResult.caseId,
          caseNumber: generateResult.caseNumber,
          secureToken: generateResult.secureToken
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('❌ Erreur envoi email:', errorText);

        // En mode développement, continuer même si l'email échoue
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Mode développement: Continuons malgré l\'erreur email');
          toast({
            title: "⚠️ Mode Développement",
            description: "Document généré avec succès. Email simulé (erreur ignorée en dev).",
            variant: "default"
          });

          // Simuler une réponse réussie et continuer
          setSecureToken(generateResult.secureToken);

          return;
        } else {
          throw new Error(`Erreur envoi email: ${errorText}`);
        }
      }

      const emailResult = await emailResponse.json();

      if (!emailResult.success) {
        // En mode développement, continuer même si l'email échoue
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Mode développement: Email échoué mais on continue');
          toast({
            title: "⚠️ Mode Développement",
            description: "Document généré. Email simulé (service email non configuré).",
            variant: "default"
          });

          setSecureToken(generateResult.secureToken);

          return;
        }

        throw new Error(emailResult.error || emailResult.message || 'Erreur lors de l\'envoi de l\'email');
      }

      // Store the secure token for the portal link
      setSecureToken(emailResult.secureToken);

      const actualRecipient = process.env.NODE_ENV === 'development' ? (process.env.TEST_CLIENT_EMAIL || 'yasminemassaoudi27@gmail.com') : clientData.email;

      toast({
        title: "Dossier créé avec succès",
        description: process.env.NODE_ENV === 'development'
          ? `Document généré. Email de test envoyé à ${actualRecipient} (au lieu de ${clientData.email}). Lien portail: ${emailResult.portalLink}`
          : `Document généré et email envoyé à ${clientData.email}. Lien portail: ${emailResult.portalLink}`,
      });


      }

    } catch (error) {
      console.error("[v0] Error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du dossier.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setClientData({
      nom: "",
      prenom: "",
      dateNaissance: "",
      numeroPolice: "",
      email: "",
      telephone: "",
      adresse: "",
      npa: "",
      ville: "",
      typeFormulaire: 'resiliation',
      destinataire: "",
      lieuDate: new Date().toLocaleDateString('fr-CH'),
      personnes: [],
      dateLamal: "",
      dateLCA: "",
      nomPrenom: "",
      npaVille: "",
    })
    setGeneratedDocument(null)
    setClientId(null)
    setSecureToken(null)

  }

  // Show client selection first
  if (showClientSelection) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Création de Dossier - Étape 1/2
            </CardTitle>
          </CardHeader>
        </Card>

        <ClientSelection
          onClientSelected={handleClientSelected}
          onNewClientRequested={handleNewClientRequested}
        />
      </div>
    )
  }

  // Pour les clients existants avec signature, envoyer directement l'email
  // sans afficher l'étape 2/2
  if (showMultiTemplateGenerator && selectedClient && currentCaseId) {
    // Si le client a une signature, envoyer directement l'email
    if (selectedClient.hasSignature) {
      // Envoyer l'email automatiquement et revenir à la sélection
      React.useEffect(() => {
        const sendEmailDirectly = async () => {
          try {
            setIsLoading(true)

            // Envoyer l'email de notification pour nouveau dossier
            const emailResponse = await fetch('/api/agent/send-documents-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                caseId: currentCaseId,
                clientEmail: selectedClient.email,
                clientName: selectedClient.fullName,
                agentId: 'current-agent' // L'API récupérera l'agent depuis le token
              })
            })

            const emailData = await emailResponse.json()

            if (emailData.success) {
              toast({
                title: "✅ Email envoyé !",
                description: `Notification envoyée à ${selectedClient.fullName} pour le nouveau dossier avec signature existante`,
              })
            } else {
              throw new Error(emailData.error || 'Erreur envoi email')
            }
          } catch (error) {
            console.error('Erreur envoi email direct:', error)
            toast({
              title: "Erreur",
              description: "Erreur lors de l'envoi de l'email",
              variant: "destructive"
            })
          } finally {
            setIsLoading(false)
            // Revenir à la sélection client
            handleBackToClientSelection()
          }
        }

        sendEmailDirectly()
      }, []) // Exécuter une seule fois au montage

      // Afficher un message de traitement pendant l'envoi
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Envoi de la notification...
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">
                  Envoi de l'email de notification à <strong>{selectedClient.fullName}</strong>
                  <br />
                  <span className="text-sm">Le dossier sera créé avec la signature existante</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Si pas de signature, afficher l'étape 2/2 normale
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Génération de Documents - Étape 2/2
              </CardTitle>
              <Button variant="outline" onClick={handleBackToClientSelection}>
                ← Retour à la sélection
              </Button>
            </div>
          </CardHeader>
        </Card>

        <MultiTemplateGenerator
          clientId={selectedClient.id}
          caseId={currentCaseId}
          clientName={selectedClient.fullName}
          clientHasSignature={selectedClient.hasSignature}
          agentId="550e8400-e29b-41d4-a716-446655440001" // UUID de l'agent par défaut
          onDocumentsGenerated={(documents) => {
            toast({
              title: "Documents générés",
              description: `${documents.length} document(s) généré(s) avec succès`,
            })
          }}
        />
      </div>
    )
  }



  return (
    <div className="space-y-6">
      {/* Header for new client form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouveau Client - Création de Dossier
            </CardTitle>
            <Button variant="outline" onClick={handleBackToClientSelection}>
              ← Retour à la sélection
            </Button>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations du demandeur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              Informations du Demandeur
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          {/* Nom et Prénom séparés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={clientData.prenom}
                onChange={(e) => updateClientData({ prenom: e.target.value })}
                placeholder="Jean"
                required
              />
            </div>
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={clientData.nom}
                onChange={(e) => updateClientData({ nom: e.target.value })}
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          {/* Date de naissance et numéro de police */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateNaissance">Date de Naissance *</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={clientData.dateNaissance}
                onChange={(e) => updateClientData({ dateNaissance: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="numeroPolice">Numéro de Police d'Assurance *</Label>
              <Input
                id="numeroPolice"
                value={clientData.numeroPolice}
                onChange={(e) => updateClientData({ numeroPolice: e.target.value })}
                placeholder="POL-123456789"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email du Client *</Label>
            <Input
              id="email"
              type="email"
              value={clientData.email}
              onChange={(e) => updateClientData({ email: e.target.value })}
              placeholder="client@example.com"
              required
            />
          </div>

          {/* Téléphone */}
          <div>
            <Label htmlFor="telephone">Téléphone du Client</Label>
            <Input
              id="telephone"
              type="tel"
              value={clientData.telephone}
              onChange={(e) => updateClientData({ telephone: e.target.value })}
              placeholder="+41 XX XXX XX XX"
            />
          </div>

          {/* Adresse */}
          <div>
            <Label htmlFor="adresse">Adresse *</Label>
            <Input
              id="adresse"
              value={clientData.adresse}
              onChange={(e) => updateClientData({ adresse: e.target.value })}
              placeholder="Rue de la Paix 123"
              required
            />
          </div>

          {/* NPA et Ville séparés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="npa">NPA *</Label>
              <Input
                id="npa"
                value={clientData.npa}
                onChange={(e) => updateClientData({ npa: e.target.value })}
                placeholder="1000"
                required
              />
            </div>
            <div>
              <Label htmlFor="ville">Ville *</Label>
              <Input
                id="ville"
                value={clientData.ville}
                onChange={(e) => updateClientData({ ville: e.target.value })}
                placeholder="Lausanne"
                required
              />
            </div>
            <div>
              <Label htmlFor="lieuDate">Lieu et Date *</Label>
              <Input
                id="lieuDate"
                value={clientData.lieuDate}
                onChange={(e) => updateClientData({ lieuDate: e.target.value })}
                placeholder="Lausanne, le 19 septembre 2025"
                required
              />
            </div>
          </div>

          {/* Type de formulaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="typeFormulaire">Type de Formulaire *</Label>
              <select
                id="typeFormulaire"
                value={clientData.typeFormulaire}
                onChange={(e) => updateClientData({ typeFormulaire: e.target.value as ClientData['typeFormulaire'] })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="resiliation">Résiliation</option>
                <option value="souscription">Souscription</option>
                <option value="modification">Modification</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <Label htmlFor="destinataire">Destinataire (Compagnie d'Assurance) *</Label>
              <Input
                id="destinataire"
                value={clientData.destinataire}
                onChange={(e) => updateClientData({ destinataire: e.target.value })}
                placeholder="Assura, CSS, Groupe Mutuel..."
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personnes assurées supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-700">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Personnes Assurées Supplémentaires (Famille)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPerson}
              disabled={clientData.personnes.length >= 4}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter Personne
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {clientData.personnes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune personne supplémentaire ajoutée.</p>
              <p className="text-sm">Le demandeur principal est déjà inclus dans le document.</p>
            </div>
          ) : (
            clientData.personnes.map((personne, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Personne {index + 1}</h4>
                {clientData.personnes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePerson(index)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`nom-${index}`}>Nom *</Label>
                  <Input
                    id={`nom-${index}`}
                    value={personne.nom}
                    onChange={(e) => updatePerson(index, "nom", e.target.value)}
                    placeholder="Dupont"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`prenom-${index}`}>Prénom *</Label>
                  <Input
                    id={`prenom-${index}`}
                    value={personne.prenom}
                    onChange={(e) => updatePerson(index, "prenom", e.target.value)}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`dateNaissance-${index}`}>Date de Naissance *</Label>
                  <Input
                    id={`dateNaissance-${index}`}
                    type="date"
                    value={personne.dateNaissance}
                    onChange={(e) => updatePerson(index, "dateNaissance", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`numeroPolice-${index}`}>Numéro de Police *</Label>
                  <Input
                    id={`numeroPolice-${index}`}
                    value={personne.numeroPolice}
                    onChange={(e) => updatePerson(index, "numeroPolice", e.target.value)}
                    placeholder="123456789"
                    required
                  />
                </div>
              </div>
            </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dates de résiliation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700">Dates de Résiliation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateLamal">Date de résiliation LAMal *</Label>
              <Input
                id="dateLamal"
                type="date"
                value={clientData.dateLamal}
                onChange={(e) => updateClientData({ dateLamal: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateLCA">Date de résiliation LCA complémentaires *</Label>
              <Input
                id="dateLCA"
                type="date"
                value={clientData.dateLCA}
                onChange={(e) => updateClientData({ dateLCA: e.target.value })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {/* Bouton pour télécharger le document Word */}
        <Button
          type="button"
          size="lg"
          onClick={downloadWordDocument}
          disabled={isDownloadingWord || !clientData.nom || !clientData.prenom}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3"
        >
          {isDownloadingWord ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Génération...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Télécharger Document Word
            </>
          )}
        </Button>

        {/* Bouton pour prévisualiser */}


        {/* Bouton pour sauvegarder avec signature (clients existants uniquement) */}
        {selectedClient && selectedClient.hasSignature && (
          <Button
            type="button"
            size="lg"
            onClick={handleSaveWithSignature}
            disabled={isSavingWithSignature || !clientData.nom || !clientData.prenom}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
          >
            {isSavingWithSignature ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder avec Signature
              </>
            )}
          </Button>
        )}

        {/* Bouton principal pour générer et envoyer */}
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Traitement en cours...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Générer et Envoyer l'Email
            </>
          )}
        </Button>
      </div>
      </form>
    </div>
  )
}
