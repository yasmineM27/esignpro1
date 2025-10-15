'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Signature,
  Building,
  Phone,
  Mail,
  RefreshCw,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface CaseItem {
  id: string;
  caseNumber: string;
  status: string;
  overallStatus: string;
  priority: 'high' | 'medium' | 'low';
  secureToken: string;
  client: {
    id: string;
    clientCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
  };
  insuranceCompany: string;
  policyType: string;
  policyNumber: string;
  terminationDate: string;
  reasonForTermination: string;
  hasSignature: boolean;
  signature: {
    id: string;
    signedAt: string;
    isValid: boolean;
    validationStatus: string;
    validatedAt: string;
  } | null;
  documentsCount: number;
  generatedDocsCount: number;
  emailsSent: number;
  totalDocuments: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  daysSinceCreated: number;
  daysSinceUpdated: number;
  portalUrl: string;
}

interface CaseStats {
  total: number;
  pending: number;
  active: number;
  signed: number;
  completed: number;
  withSignature: number;
  highPriority: number;
  avgDaysToComplete: number;
}

export default function AgentCasesManagement() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [stats, setStats] = useState<CaseStats>({
    total: 0,
    pending: 0,
    active: 0,
    signed: 0,
    completed: 0,
    withSignature: 0,
    highPriority: 0,
    avgDaysToComplete: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [insuranceFilter, setInsuranceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCases();
  }, [statusFilter, priorityFilter, insuranceFilter, sortBy, sortOrder]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') {
        loadCases();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        status: statusFilter,
        priority: priorityFilter !== 'all' ? priorityFilter : '',
        insuranceCompany: insuranceFilter !== 'all' ? insuranceFilter : '',
        search: searchTerm,
        sortBy,
        sortOrder,
        limit: '100'
      });

      // Supprimer les paramètres vides
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value) params.delete(key);
      });

      // Utiliser l'API all-cases corrigée
      console.log('🔄 Chargement des dossiers depuis l\'API corrigée...');

      const response = await fetch(`/api/agent/all-cases?${params}`);
      const data = await response.json();

      if (data.success) {
        setCases(data.cases || []);
        setStats(data.stats || {});
        console.log('✅ Dossiers chargés depuis l\'API:', {
          cases: data.cases?.length || 0,
          stats: data.stats
        });
      } else {
        console.error('❌ Erreur API all-cases:', data.error);
        toast({
          title: "Erreur",
          description: data.error || "Impossible de charger les dossiers",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'signed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'signed': return <Signature className="h-4 w-4" />;
      case 'active': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <TrendingUp className="h-4 w-4" />;
      case 'medium': return <Minus className="h-4 w-4" />;
      case 'low': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const selectAllCases = () => {
    if (selectedCases.length === cases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(cases.map(c => c.id));
    }
  };

  const downloadCaseDocuments = async (caseItem: CaseItem) => {
    try {
      console.log('📦 Téléchargement documents pour:', caseItem.client.fullName);

      // Afficher un toast de début
      toast({
        title: "📦 Préparation des documents",
        description: `Génération du ZIP avec documents Word signés pour ${caseItem.client.fullName}...`,
      });

      const response = await fetch(`/api/agent/download-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseId: caseItem.id,
          clientId: caseItem.client.id,
          secureToken: caseItem.secureToken,
          includeWordDocuments: true,
          includeSignatures: true,
          generateWordWithSignature: true
        })
      });

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `DOSSIER-COMPLET-${caseItem.client.fullName.replace(/\s+/g, '-')}-${caseItem.caseNumber}-AVEC-SIGNATURES.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Toast de succès avec détails
        toast({
          title: "✅ Documents téléchargés",
          description: `ZIP généré avec succès! Contient: documents Word signés, signatures, métadonnées. Taille: ${(blob.size / 1024).toFixed(2)} KB`,
        });

        console.log('✅ Téléchargement réussi:', {
          client: caseItem.client.fullName,
          taille: `${(blob.size / 1024).toFixed(2)} KB`,
          contenu: 'Documents Word avec signatures + métadonnées'
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur téléchargement:', errorText);

        toast({
          title: "❌ Erreur de téléchargement",
          description: `Impossible de générer le ZIP: ${response.status} ${response.statusText}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erreur téléchargement documents:', error);

      toast({
        title: "❌ Erreur technique",
        description: `Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive"
      });
    }
  };

  const openClientPortal = (caseItem: CaseItem) => {
    window.open(caseItem.portalUrl, '_blank');
  };

  // Obtenir les compagnies d'assurance uniques pour le filtre
  const uniqueInsuranceCompanies = [...new Set(cases.map(c => c.insuranceCompany).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
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
              <Signature className="h-5 w-5 text-blue-500" />
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Priorité Haute</p>
                <p className="text-2xl font-bold">{stats.highPriority}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avec Signature</p>
                <p className="text-2xl font-bold">{stats.withSignature}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm text-muted-foreground">Délai Moyen</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgDaysToComplete)}j</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Gestion des Dossiers</span>
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grille
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Tableau
              </Button>
              <Button variant="outline" size="sm" onClick={loadCases}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="signed">Signés</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
                <SelectItem value="validated">Validés</SelectItem>
                <SelectItem value="archived">Archivés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>

            <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assurance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes assurances</SelectItem>
                {uniqueInsuranceCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Tri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Plus récents</SelectItem>
                <SelectItem value="created_at-asc">Plus anciens</SelectItem>
                <SelectItem value="updated_at-desc">Dernière MAJ</SelectItem>
                <SelectItem value="case_number-asc">N° dossier A-Z</SelectItem>
                <SelectItem value="priority-desc">Priorité haute</SelectItem>
                <SelectItem value="status-asc">Statut A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions en lot */}
          {selectedCases.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedCases.length} dossier(s) sélectionné(s)
              </span>
              <Button size="sm" variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Télécharger tout
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedCases([])}>
                Désélectionner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vue Grille */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem) => (
            <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCases.includes(caseItem.id)}
                      onChange={() => toggleCaseSelection(caseItem.id)}
                      className="rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{caseItem.caseNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.client.fullName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Badge className={`${getPriorityColor(caseItem.priority)} text-xs`}>
                      {getPriorityIcon(caseItem.priority)}
                      <span className="ml-1 capitalize">{caseItem.priority}</span>
                    </Badge>
                    <Badge className={`${getStatusColor(caseItem.overallStatus)} text-xs`}>
                      {getStatusIcon(caseItem.overallStatus)}
                      <span className="ml-1 capitalize">{caseItem.overallStatus}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informations client */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{caseItem.client.clientCode}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{caseItem.client.email}</span>
                  </div>
                  {caseItem.client.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{caseItem.client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Informations assurance */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center space-x-2 text-sm">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{caseItem.insuranceCompany}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {caseItem.policyType} - {caseItem.policyNumber}
                  </div>
                  {caseItem.terminationDate && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Résiliation: {new Date(caseItem.terminationDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="font-semibold">{caseItem.totalDocuments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Emails</p>
                    <p className="font-semibold">{caseItem.emailsSent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Jours</p>
                    <p className="font-semibold">{caseItem.daysSinceCreated}</p>
                  </div>
                </div>

                {/* Signature */}
                {caseItem.hasSignature && caseItem.signature && caseItem.signature.signedAt && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                    <Signature className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Signé le {new Date(caseItem.signature.signedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {/* Signature sans date */}
                {caseItem.hasSignature && (!caseItem.signature || !caseItem.signature.signedAt) && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                    <Signature className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Document signé
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCaseDocuments(caseItem)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ZIP
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p>Créé: {new Date(caseItem.createdAt).toLocaleDateString('fr-FR')}</p>
                  <p>MAJ: {new Date(caseItem.updatedAt).toLocaleDateString('fr-FR')}</p>
                  {caseItem.completedAt && (
                    <p>Terminé: {new Date(caseItem.completedAt).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vue Tableau */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCases.length === cases.length && cases.length > 0}
                        onChange={selectAllCases}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('case_number')}>
                      <div className="flex items-center space-x-1">
                        <span>Dossier</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left">Client</th>
                    <th className="p-3 text-left">Assurance</th>
                    <th className="p-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                      <div className="flex items-center space-x-1">
                        <span>Statut</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('priority')}>
                      <div className="flex items-center space-x-1">
                        <span>Priorité</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left">Documents</th>
                    <th className="p-3 text-left">Signature</th>
                    <th className="p-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center space-x-1">
                        <span>Créé</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedCases.includes(caseItem.id)}
                          onChange={() => toggleCaseSelection(caseItem.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-semibold">{caseItem.caseNumber}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.client.clientCode}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{caseItem.client.fullName}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.client.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{caseItem.insuranceCompany}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.policyType}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getStatusColor(caseItem.overallStatus)} text-xs`}>
                          {getStatusIcon(caseItem.overallStatus)}
                          <span className="ml-1 capitalize">{caseItem.overallStatus}</span>
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getPriorityColor(caseItem.priority)} text-xs`}>
                          {getPriorityIcon(caseItem.priority)}
                          <span className="ml-1 capitalize">{caseItem.priority}</span>
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>{caseItem.totalDocuments}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {caseItem.hasSignature ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Signé</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">En attente</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-xs">
                          <p>{new Date(caseItem.createdAt).toLocaleDateString('fr-FR')}</p>
                          <p className="text-muted-foreground">{caseItem.daysSinceCreated}j</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openClientPortal(caseItem)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadCaseDocuments(caseItem)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun dossier */}
      {!isLoading && cases.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun dossier trouvé</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || insuranceFilter !== 'all'
                ? 'Aucun dossier ne correspond aux critères de recherche.'
                : 'Aucun dossier n\'a été créé pour le moment.'}
            </p>
            {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || insuranceFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setInsuranceFilter('all');
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
