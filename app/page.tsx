import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { Shield, FileText, Users, Clock, ArrowRight, Zap, Lock, Globe } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image src="/images/esignpro-logo.png" alt="eSignPro" width={180} height={54} className="h-12 w-auto" />
              <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                Signature Electronique Securisee
              </Badge>
            </div>
            <nav className="flex items-center space-x-6">
              {/* 🔒 ACCÈS SÉCURISÉ - Redirection vers /login */}
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Espace Agent
              </Link>
              <Link href="/demo" className="text-gray-600 hover:text-gray-900 font-medium">
                Démonstration
              </Link>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">
                  Connexion
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-blue-50/50"></div>
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Conforme SCSE - Legislation Suisse
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-6 text-balance leading-tight">
              Signature Electronique <span className="text-red-600 relative">
                Securisee
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-red-200 rounded-full"></div>
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-4xl mx-auto text-pretty leading-relaxed">
              Plateforme professionnelle de nouvelle generation pour la gestion des resiliations d'assurance
              avec signature electronique securisee, conforme a la legislation suisse et aux standards internationaux
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              {/* 🔒 ACCÈS SÉCURISÉ - Redirection vers /login */}
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg">
                <Link href="/login">
                  <Users className="mr-3 h-6 w-6" />
                  Espace Agent
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-gray-300 hover:border-red-600 hover:text-red-600 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg">
                <Link href="/demo">
                  <FileText className="mr-3 h-6 w-6" />
                  Voir la Demo
                </Link>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">99.9%</div>
                <div className="text-gray-600">Disponibilite</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">&lt; 30s</div>
                <div className="text-gray-600">Temps de signature</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">100%</div>
                <div className="text-gray-600">Conforme SCSE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white"></div>
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Technologie Avancee
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Fonctionnalités Principales</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Une solution complete et innovante pour tous vos besoins de signature electronique professionnelle</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-200 transition-colors">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl mb-3">Securite Maximale</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Conforme SCSE avec chiffrement de bout en bout, authentification forte et audit complet des actions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-3">Automatisation Complete</CardTitle>
                <CardDescription className="text-base leading-relaxed">Remplissage automatique des formulaires, generation de documents et workflow intelligent</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl mb-3">Processus Rapide</CardTitle>
                <CardDescription className="text-base leading-relaxed">Signature en 4 etapes simples avec suivi en temps reel et notifications automatiques</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-3">Templates Configurables</CardTitle>
                <CardDescription className="text-base leading-relaxed">Bibliotheque de modeles personnalisables pour tous types de documents et contrats</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                  <Lock className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl mb-3">Audit Trail</CardTitle>
                <CardDescription className="text-base leading-relaxed">Tracabilite complete avec horodatage, certificats de signature et preuves legales</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-200 transition-colors">
                  <Globe className="h-8 w-8 text-teal-600" />
                </div>
                <CardTitle className="text-xl mb-3">Multi-plateforme</CardTitle>
                <CardDescription className="text-base leading-relaxed">Accessible sur tous appareils avec interface responsive et synchronisation cloud</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Performances Exceptionnelles</h2>
            <p className="text-red-100 text-lg">Des chiffres qui parlent d'eux-memes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-5xl font-bold mb-3 group-hover:scale-110 transition-transform duration-300">99.9%</div>
              <div className="text-red-100 text-lg font-medium">Disponibilite</div>
              <div className="text-red-200 text-sm mt-1">Service 24/7</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-3 group-hover:scale-110 transition-transform duration-300">&lt; 30s</div>
              <div className="text-red-100 text-lg font-medium">Temps de signature</div>
              <div className="text-red-200 text-sm mt-1">Ultra rapide</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-3 group-hover:scale-110 transition-transform duration-300">100%</div>
              <div className="text-red-100 text-lg font-medium">Conforme SCSE</div>
              <div className="text-red-200 text-sm mt-1">Legalement valide</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold mb-3 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-red-100 text-lg font-medium">Support Expert</div>
              <div className="text-red-200 text-sm mt-1">Assistance continue</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/30 to-blue-50/30"></div>
        <div className="mx-auto max-w-5xl px-6 text-center relative">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-8">
            <Shield className="w-4 h-4 mr-2" />
            Solution Professionnelle Certifiee
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
            Pret a <span className="text-red-600">revolutionner</span><br />
            vos processus de signature ?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Rejoignez les milliers de professionnels qui font confiance a eSignPro pour leurs signatures electroniques securisees et conformes
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {/* 🔒 ACCÈS SÉCURISÉ - Redirection vers /login */}
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300 px-10 py-4 text-lg">
              <Link href="/login">
                <Users className="mr-3 h-6 w-6" />
                Commencer maintenant
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-gray-300 hover:border-red-600 hover:text-red-600 shadow-lg hover:shadow-xl transition-all duration-300 px-10 py-4 text-lg">
              <Link href="/demo">
                <FileText className="mr-3 h-6 w-6" />
                Voir la demonstration
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/images/esignpro-logo.png"
                alt="eSignPro"
                width={150}
                height={45}
                className="h-10 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400">Solution de signature electronique securisee pour professionnels</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/features" className="hover:text-white">
                    Fonctionnalites
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white">
                    Securite
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Centre d'aide
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-white">
                    Statut
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Confidentialite
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-white">
                    Conformite
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 eSignPro. Tous droits reserves.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
