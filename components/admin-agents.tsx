"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Users, Plus, Edit, Trash2, Shield, Mail, Phone, Calendar, BarChart3, Loader2, AlertCircle, Key } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { ChangePasswordDialog } from "@/components/change-password-dialog"

interface Agent {
  id: string
  agent_code: string
  user_id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  department: string
  role: "agent" | "admin"
  is_supervisor: boolean
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  stats: {
    cases_handled: number
    cases_completed: number
    cases_pending: number
    completion_rate: number
  }
}

interface NewAgentForm {
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  role: string
  is_supervisor: boolean
  password: string
}

export function AdminAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [newAgentForm, setNewAgentForm] = useState<NewAgentForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    role: 'agent',
    is_supervisor: false,
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Charger les agents au montage du composant
  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/agents')
      const data = await response.json()

      if (data.success) {
        setAgents(data.agents)
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Impossible de charger les agents",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur chargement agents:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (is_active: boolean) => {
    return is_active
      ? <Badge className="bg-green-100 text-green-800">Actif</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>
  }

  const getRoleBadge = (role: Agent["role"], is_supervisor: boolean) => {
    if (role === "admin") {
      return <Badge className="bg-purple-100 text-purple-800"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
    }
    if (is_supervisor) {
      return <Badge className="bg-blue-100 text-blue-800"><Users className="h-3 w-3 mr-1" />Superviseur</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Agent</Badge>
  }

  const toggleAgentStatus = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !agent.is_active })
      })

      const data = await response.json()

      if (data.success) {
        setAgents(agents.map(a =>
          a.id === agentId ? { ...a, is_active: !a.is_active } : a
        ))
        toast({
          title: "✅ Succès",
          description: `Agent ${agent.is_active ? 'désactivé' : 'activé'} avec succès`
        })
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors de la mise à jour",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur toggle status:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    }
  }

  const handleCreateAgent = async () => {
    if (!newAgentForm.first_name || !newAgentForm.last_name || !newAgentForm.email || !newAgentForm.department) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgentForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Succès",
          description: "Agent créé avec succès"
        })
        setIsAddDialogOpen(false)
        setNewAgentForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          department: '',
          role: 'agent',
          is_supervisor: false,
          password: ''
        })
        fetchAgents() // Recharger la liste
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors de la création",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur création agent:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setNewAgentForm({
      first_name: agent.first_name,
      last_name: agent.last_name,
      email: agent.email,
      phone: agent.phone || '',
      department: agent.department,
      role: agent.is_supervisor ? 'supervisor' : agent.role,
      is_supervisor: agent.is_supervisor,
      password: '' // Ne pas pré-remplir le mot de passe
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return

    if (!newAgentForm.first_name || !newAgentForm.last_name || !newAgentForm.email || !newAgentForm.department) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const updateData = {
        first_name: newAgentForm.first_name,
        last_name: newAgentForm.last_name,
        email: newAgentForm.email,
        phone: newAgentForm.phone,
        department: newAgentForm.department,
        role: newAgentForm.role,
        is_supervisor: newAgentForm.is_supervisor
      }

      // Ajouter le mot de passe seulement s'il est fourni
      if (newAgentForm.password.trim()) {
        (updateData as any).password = newAgentForm.password
      }

      const response = await fetch(`/api/admin/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Succès",
          description: "Agent mis à jour avec succès"
        })
        setIsEditDialogOpen(false)
        setSelectedAgent(null)
        setNewAgentForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          department: '',
          role: 'agent',
          is_supervisor: false,
          password: ''
        })
        fetchAgents() // Recharger la liste
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors de la mise à jour",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur mise à jour agent:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'agent ${agent.full_name} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/agents/${agent.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Succès",
          description: "Agent supprimé avec succès"
        })
        fetchAgents() // Recharger la liste
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors de la suppression",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur suppression agent:', error)
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    }
  }

  const handleChangePassword = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsPasswordDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center">
              <Users className="mr-3 h-6 w-6" />
              Gestion des Agents ({agents.length})
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-blue-600 hover:bg-blue-50">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un Nouvel Agent</DialogTitle>
                  <DialogDescription>
                    Créer un nouveau compte agent avec les permissions appropriées
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        placeholder="Prénom"
                        value={newAgentForm.first_name}
                        onChange={(e) => setNewAgentForm({...newAgentForm, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        placeholder="Nom"
                        value={newAgentForm.last_name}
                        onChange={(e) => setNewAgentForm({...newAgentForm, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@esignpro.ch"
                      value={newAgentForm.email}
                      onChange={(e) => setNewAgentForm({...newAgentForm, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      placeholder="+41 79 xxx xx xx"
                      value={newAgentForm.phone}
                      onChange={(e) => setNewAgentForm({...newAgentForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Département *</Label>
                    <Select value={newAgentForm.department} onValueChange={(value) => setNewAgentForm({...newAgentForm, department: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Résiliations">Résiliations</SelectItem>
                        <SelectItem value="Souscriptions">Souscriptions</SelectItem>
                        <SelectItem value="Sinistres">Sinistres</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={newAgentForm.role} onValueChange={(value) => setNewAgentForm({...newAgentForm, role: value, is_supervisor: value === 'supervisor'})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="supervisor">Superviseur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mot de passe (laissez vide pour générer automatiquement)"
                      value={newAgentForm.password}
                      onChange={(e) => setNewAgentForm({...newAgentForm, password: e.target.value})}
                    />
                    <p className="text-xs text-gray-500">
                      Si vide, un mot de passe temporaire sera généré automatiquement
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                      Annuler
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleCreateAgent}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer Agent'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog de modification */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Modifier l'Agent</DialogTitle>
                  <DialogDescription>
                    Modifier les informations de l'agent {selectedAgent?.full_name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirstName">Prénom *</Label>
                      <Input
                        id="editFirstName"
                        placeholder="Prénom"
                        value={newAgentForm.first_name}
                        onChange={(e) => setNewAgentForm({...newAgentForm, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editLastName">Nom *</Label>
                      <Input
                        id="editLastName"
                        placeholder="Nom"
                        value={newAgentForm.last_name}
                        onChange={(e) => setNewAgentForm({...newAgentForm, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email *</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      placeholder="email@esignpro.ch"
                      value={newAgentForm.email}
                      onChange={(e) => setNewAgentForm({...newAgentForm, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPhone">Téléphone</Label>
                    <Input
                      id="editPhone"
                      placeholder="+41 79 xxx xx xx"
                      value={newAgentForm.phone}
                      onChange={(e) => setNewAgentForm({...newAgentForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDepartment">Département *</Label>
                    <Select value={newAgentForm.department} onValueChange={(value) => setNewAgentForm({...newAgentForm, department: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Résiliations">Résiliations</SelectItem>
                        <SelectItem value="Souscriptions">Souscriptions</SelectItem>
                        <SelectItem value="Sinistres">Sinistres</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRole">Rôle</Label>
                    <Select value={newAgentForm.role} onValueChange={(value) => setNewAgentForm({...newAgentForm, role: value, is_supervisor: value === 'supervisor'})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="supervisor">Superviseur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPassword">Nouveau mot de passe</Label>
                    <Input
                      id="editPassword"
                      type="password"
                      placeholder="Laissez vide pour conserver l'actuel"
                      value={newAgentForm.password}
                      onChange={(e) => setNewAgentForm({...newAgentForm, password: e.target.value})}
                    />
                    <p className="text-xs text-gray-500">
                      Laissez vide pour conserver le mot de passe actuel
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                      Annuler
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleUpdateAgent}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        'Mettre à jour'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog de changement de mot de passe */}
            <ChangePasswordDialog
              isOpen={isPasswordDialogOpen}
              onClose={() => {
                setIsPasswordDialogOpen(false)
                setSelectedAgent(null)
              }}
              user={selectedAgent ? {
                id: selectedAgent.user_id,
                email: selectedAgent.email,
                full_name: selectedAgent.full_name,
                role: selectedAgent.role
              } : null}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Chargement des agents...</span>
            </div>
          ) : (
            <>
              {/* Agents Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.first_name} {agent.last_name}</div>
                            <div className="text-sm text-gray-500">Code: {agent.agent_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {agent.email}
                            </div>
                            {agent.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {agent.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{agent.department}</TableCell>
                        <TableCell>{getRoleBadge(agent.role, agent.is_supervisor)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(agent.is_active)}
                            <Switch
                              checked={agent.is_active}
                              onCheckedChange={() => toggleAgentStatus(agent.id)}
                              size="sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <BarChart3 className="h-3 w-3 mr-1 text-gray-400" />
                              {agent.stats.cases_handled} dossiers
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              {agent.stats.completion_rate}% réussite
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {agent.last_login
                              ? new Date(agent.last_login).toLocaleDateString('fr-CH')
                              : 'Jamais connecté'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAgent(agent)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleChangePassword(agent)}
                            >
                              <Key className="h-3 w-3 mr-1" />
                              Mot de passe
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteAgent(agent)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {agents.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun agent trouvé</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
