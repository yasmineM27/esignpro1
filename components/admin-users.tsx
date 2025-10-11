'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Key
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'client' | 'agent' | 'admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  // Relations optionnelles
  agent?: {
    id: string;
    agent_code: string;
    department: string;
    is_supervisor: boolean;
  };
  client?: {
    id: string;
    client_code: string;
  };
}

interface NewUserForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'client' | 'agent' | 'admin';
  password: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'client',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Impossible de charger les utilisateurs",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: User["role"], agent?: User["agent"]) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case "agent":
        if (agent?.is_supervisor) {
          return <Badge className="bg-blue-100 text-blue-800"><UserCheck className="h-3 w-3 mr-1" />Superviseur</Badge>;
        }
        return <Badge className="bg-gray-100 text-gray-800"><Users className="h-3 w-3 mr-1" />Agent</Badge>;
      case "client":
        return <Badge className="bg-green-100 text-green-800">Client</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getStatusBadge = (is_active: boolean) => {
    return is_active 
      ? <Badge className="bg-green-100 text-green-800">Actif</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active })
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_active: !u.is_active } : u
        ));
        toast({
          title: "✅ Succès",
          description: `Utilisateur ${user.is_active ? 'désactivé' : 'activé'} avec succès`
        });
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors de la mise à jour",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur toggle status:', error);
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.first_name || !newUserForm.last_name || !newUserForm.email) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "✅ Succès",
          description: "Utilisateur créé avec succès"
        });
        setIsAddDialogOpen(false);
        setNewUserForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'client',
          password: ''
        });
        fetchUsers(); // Recharger la liste
      } else {
        toast({
          title: "❌ Erreur",
          description: data.error || "Erreur lors de la création",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      toast({
        title: "❌ Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.agent?.agent_code && user.agent.agent_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center">
              <Users className="mr-3 h-6 w-6" />
              Gestion des Utilisateurs ({filteredUsers.length})
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-purple-600 hover:bg-purple-50">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un Nouvel Utilisateur</DialogTitle>
                  <DialogDescription>
                    Créer un nouveau compte utilisateur
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input 
                        id="firstName" 
                        placeholder="Prénom" 
                        value={newUserForm.first_name}
                        onChange={(e) => setNewUserForm({...newUserForm, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Nom" 
                        value={newUserForm.last_name}
                        onChange={(e) => setNewUserForm({...newUserForm, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="email@example.com" 
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      placeholder="+41 79 xxx xx xx" 
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={newUserForm.role} onValueChange={(value: any) => setNewUserForm({...newUserForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
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
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
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
                      className="bg-purple-600 hover:bg-purple-700" 
                      onClick={handleCreateUser}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer Utilisateur'
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
                setIsPasswordDialogOpen(false);
                setSelectedUser(null);
              }}
              user={selectedUser ? {
                id: selectedUser.id,
                email: selectedUser.email,
                full_name: `${selectedUser.first_name} ${selectedUser.last_name}`,
                role: selectedUser.role
              } : null}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou code agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Chargement des utilisateurs...</span>
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-gray-500">
                              {user.agent?.agent_code && `Code: ${user.agent.agent_code}`}
                              {user.client?.client_code && `Code: ${user.client.client_code}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role, user.agent)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(user.is_active)}
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={() => toggleUserStatus(user.id)}
                              size="sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {user.last_login 
                              ? new Date(user.last_login).toLocaleDateString('fr-CH')
                              : 'Jamais connecté'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleChangePassword(user)}
                            >
                              <Key className="h-3 w-3 mr-1" />
                              Mot de passe
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
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

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
