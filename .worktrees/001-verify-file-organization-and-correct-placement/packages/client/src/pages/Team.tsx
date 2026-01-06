import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  Calendar,
  Search,
  Crown,
  Edit,
  Trash2,
  Ban,
  ArrowLeft,
} from "lucide-react";

// Mock team data
const teamMembers = [
  {
    id: 1,
    name: "Alice Martin",
    email: "alice@studiopro.com",
    role: "owner",
    roleName: "Propriétaire",
    phone: "+33 6 12 34 56 78",
    joinedAt: new Date(2024, 0, 1),
    status: "active",
    avatar: "AM",
  },
  {
    id: 2,
    name: "Bob Dupont",
    email: "bob@studiopro.com",
    role: "admin",
    roleName: "Administrateur",
    phone: "+33 6 23 45 67 89",
    joinedAt: new Date(2024, 2, 15),
    status: "active",
    avatar: "BD",
  },
  {
    id: 3,
    name: "Charlie Bernard",
    email: "charlie@studiopro.com",
    role: "engineer",
    roleName: "Ingénieur son",
    phone: "+33 6 34 56 78 90",
    joinedAt: new Date(2024, 5, 1),
    status: "active",
    avatar: "CB",
  },
  {
    id: 4,
    name: "Diana Leroy",
    email: "diana@studiopro.com",
    role: "assistant",
    roleName: "Assistant",
    phone: "+33 6 45 67 89 01",
    joinedAt: new Date(2024, 8, 10),
    status: "active",
    avatar: "DL",
  },
  {
    id: 5,
    name: "Emma Moreau",
    email: "emma@studiopro.com",
    role: "assistant",
    roleName: "Assistant",
    phone: "+33 6 56 78 90 12",
    joinedAt: new Date(2024, 10, 1),
    status: "inactive",
    avatar: "EM",
  },
];

const roleColors: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  engineer:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  assistant:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeMembers = teamMembers.filter((m) => m.status === "active").length;
  const pendingInvitations = 2; // Mock data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Équipe</h2>
            <p className="text-muted-foreground">
              Gérez les membres de votre studio et leurs permissions
            </p>
          </div>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Inviter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau membre</DialogTitle>
              <DialogDescription>
                Envoyez une invitation par email pour ajouter un membre à votre
                équipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nom@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select defaultValue="assistant">
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="engineer">Ingénieur son</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  Un email d'invitation sera envoyé à cette adresse avec un lien
                  pour créer un compte.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button onClick={() => setIsInviteDialogOpen(false)}>
                Envoyer l'invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Sur {teamMembers.length} membres au total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Invitations en attente
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvitations}</div>
            <p className="text-xs text-muted-foreground">Envoyées cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Propriétaire, Admin, Ingénieur, Assistant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="owner">Propriétaire</SelectItem>
            <SelectItem value="admin">Administrateur</SelectItem>
            <SelectItem value="engineer">Ingénieur son</SelectItem>
            <SelectItem value="assistant">Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de l'équipe</CardTitle>
          <CardDescription>
            {filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{member.name}</h4>
                      {member.role === "owner" && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                      <Badge
                        variant="secondary"
                        className={roleColors[member.role]}
                      >
                        {member.roleName}
                      </Badge>
                      {member.status === "inactive" && (
                        <Badge variant="outline" className="text-orange-600">
                          Inactif
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Depuis{" "}
                        {member.joinedAt.toLocaleDateString("fr-FR", {
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier le rôle
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer un message
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {member.status === "active" ? (
                      <DropdownMenuItem className="text-orange-600">
                        <Ban className="mr-2 h-4 w-4" />
                        Désactiver
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <Shield className="mr-2 h-4 w-4" />
                        Réactiver
                      </DropdownMenuItem>
                    )}
                    {member.role !== "owner" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Retirer de l'équipe
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations en attente</CardTitle>
          <CardDescription>
            Invitations envoyées en attente d'acceptation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">frank@exemple.com</p>
                  <p className="text-xs text-muted-foreground">
                    Invité comme Ingénieur son · Il y a 2 jours
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Renvoyer
                </Button>
                <Button variant="ghost" size="sm">
                  Annuler
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">grace@exemple.com</p>
                  <p className="text-xs text-muted-foreground">
                    Invité comme Assistant · Il y a 5 jours
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Renvoyer
                </Button>
                <Button variant="ghost" size="sm">
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Rôles et permissions</CardTitle>
          <CardDescription>
            Vue d'ensemble des permissions par rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold text-sm">Propriétaire</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Accès complet à toutes les fonctionnalités
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Gestion équipe
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Facturation
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Paramètres
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Toutes données
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-sm">Administrateur</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Gestion complète sauf facturation
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Gestion équipe
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Facturation
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Paramètres
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Toutes données
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-sm">Ingénieur son</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Gestion sessions et projets
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Gestion équipe
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Facturation
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Paramètres
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Sessions & Projets
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <h4 className="font-semibold text-sm">Assistant</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Consultation et tâches basiques
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Gestion équipe
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Facturation
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                    Paramètres
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-600" />
                    Consultation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
