"use client"

import { DemoWorkflow } from "@/components/demo-workflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  CheckCircle, 
  FileText, 
  Download,
  Signature,
  Mail,
  User
} from "lucide-react"

export default function DemoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Démonstration Workflow</h1>
          <p className="text-gray-600">
            Testez le workflow complet de création de dossier avec signature automatique
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <Zap className="h-4 w-4 mr-1" />
          Demo Interactive
        </Badge>
      </div>

      {/* Fonctionnalités testées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Fonctionnalités Testées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Création Client</h3>
                <p className="text-sm text-gray-600">Nouveau client avec données complètes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium">Génération Documents</h3>
                <p className="text-sm text-gray-600">Documents Word automatiques</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-medium">Envoi Email</h3>
                <p className="text-sm text-gray-600">Lien de signature sécurisé</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Signature className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-medium">Signature Client</h3>
                <p className="text-sm text-gray-600">Signature électronique simulée</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <Download className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium">Documents Signés</h3>
                <p className="text-sm text-gray-600">ZIP avec Word + signatures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <h3 className="font-medium">Workflow Complet</h3>
                <p className="text-sm text-gray-600">Test end-to-end automatisé</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium">Cliquez sur "Lancer la Démonstration"</h4>
                <p className="text-sm text-gray-600">Le système va automatiquement exécuter toutes les étapes</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium">Suivez le progrès en temps réel</h4>
                <p className="text-sm text-gray-600">Chaque étape sera marquée comme terminée avec les détails</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium">Vérifiez le fichier ZIP téléchargé</h4>
                <p className="text-sm text-gray-600">Le ZIP contiendra les documents Word avec signatures appliquées</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Composant de démonstration */}
      <DemoWorkflow />

      {/* Informations techniques */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">APIs Testées</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>/api/client/create-case</code> - Création client</li>
                <li>• <code>/api/generate-word-document</code> - Génération Word</li>
                <li>• <code>/api/client/send-email</code> - Envoi email</li>
                <li>• <code>/api/client/save-signature</code> - Sauvegarde signature</li>
                <li>• <code>/api/agent/download-documents</code> - Téléchargement ZIP</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Contenu du ZIP</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>informations-dossier.json</code> - Métadonnées</li>
                <li>• <code>signatures/</code> - Images des signatures</li>
                <li>• <code>documents-word-avec-signatures/</code> - Word signés</li>
                <li>• <code>documents-client/</code> - Documents uploadés</li>
                <li>• <code>documents-generes/</code> - Autres documents</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
