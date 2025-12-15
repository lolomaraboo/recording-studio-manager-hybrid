import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link, useNavigate } from "react-router-dom";
import { Users, ArrowLeft, Plus, Mail, Check, X, Trash2, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Team() {
  const navigate = useNavigate();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "engineer" | "viewer">("viewer");
  const [permissions, setPermissions] = useState({
    canManageClients: false,
    canManageSessions: false,
    canManageEquipment: false,
    canManageInvoices: false,
    canViewReports: false,
  });

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    if (storedOrgId) {
      setSelectedOrgId(parseInt(storedOrgId));
    } else {
      navigate("/select-organization");
    }
  }, [navigate]);

  const { data: members, isLoading: loadingMembers, refetch: refetchMembers } = trpc.organizations.getMembers.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  const { data: invitations, isLoading: loadingInvitations, refetch: refetchInvitations } = trpc.invitations.list.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  const createInvitationMutation = trpc.invitations.create.useMutation({
    onSuccess: () => {
      toast.success("Invitation envoyée avec succès");
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("viewer");
      setPermissions({
        canManageClients: false,
        canManageSessions: false,
        canManageEquipment: false,
        canManageInvoices: false,
        canViewReports: false,
      });
      refetchInvitations();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelInvitationMutation = trpc.invitations.cancel.useMutation({
    onSuccess: () => {
      toast.success("Invitation annulée");
      refetchInvitations();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = trpc.organizations.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Membre retiré de l'équipe");
      refetchMembers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInvite = () => {
    if (!selectedOrgId) return;

    createInvitationMutation.mutate({
      organizationId: selectedOrgId,
      email: inviteEmail,
      role: inviteRole,
      ...permissions,
    });
  };

  const handleCancelInvitation = (invitationId: number) => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette invitation ?")) {
      cancelInvitationMutation.mutate({ invitationId });
    }
  };

  const handleRemoveMember = (memberId: number) => {
    if (!selectedOrgId) return;
    if (confirm("Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?")) {
      removeMemberMutation.mutate({
        organizationId: selectedOrgId,
        memberId,
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      owner: { variant: "destructive", label: "Propriétaire" },
      admin: { variant: "default", label: "Administrateur" },
      engineer: { variant: "secondary", label: "Ingénieur" },
      viewer: { variant: "outline", label: "Observateur" },
    };

    const config = variants[role] || variants.viewer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: any }> = {
      pending: { variant: "secondary", label: "En attente", icon: Clock },
      accepted: { variant: "default", label: "Acceptée", icon: Check },
      declined: { variant: "outline", label: "Refusée", icon: X },
      cancelled: { variant: "destructive", label: "Annulée", icon: X },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Gestion d'équipe</h1>
            </div>
          </div>
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Inviter un membre
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Membres ({members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Mail className="mr-2 h-4 w-4" />
              Invitations ({invitations?.filter(i => i.status === "pending").length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Membres de l'équipe</CardTitle>
                <CardDescription>
                  Gérez les membres de votre organisation et leurs permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : members && members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membre</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Depuis</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.userName || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">{item.userEmail || "N/A"}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(item.role)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.canManageClients && (
                                <Badge variant="outline" className="text-xs">Clients</Badge>
                              )}
                              {item.canManageSessions && (
                                <Badge variant="outline" className="text-xs">Sessions</Badge>
                              )}
                              {item.canManageEquipment && (
                                <Badge variant="outline" className="text-xs">Équipement</Badge>
                              )}
                              {item.canManageInvoices && (
                                <Badge variant="outline" className="text-xs">Factures</Badge>
                              )}
                              {item.canViewReports && (
                                <Badge variant="outline" className="text-xs">Rapports</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.joinedAt ? format(new Date(item.joinedAt), "dd MMM yyyy", { locale: fr }) : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.role !== "owner" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun membre dans l'équipe
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Invitations en attente</CardTitle>
                <CardDescription>
                  Gérez les invitations envoyées aux nouveaux membres
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInvitations ? (
                  <div className="flex justify-center py-8">
                    <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : invitations && invitations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Invité par</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.email}</TableCell>
                          <TableCell>{getRoleBadge(item.role)}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.inviterName || "N/A"}</TableCell>
                          <TableCell>
                            {format(new Date(item.createdAt), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelInvitation(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune invitation en attente
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour ajouter un nouveau membre à votre équipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="membre@exemple.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Observateur</SelectItem>
                  <SelectItem value="engineer">Ingénieur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clients" className="text-sm font-normal">Gérer les clients</Label>
                  <Switch
                    id="clients"
                    checked={permissions.canManageClients}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, canManageClients: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sessions" className="text-sm font-normal">Gérer les sessions</Label>
                  <Switch
                    id="sessions"
                    checked={permissions.canManageSessions}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, canManageSessions: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="equipment" className="text-sm font-normal">Gérer l'équipement</Label>
                  <Switch
                    id="equipment"
                    checked={permissions.canManageEquipment}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, canManageEquipment: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="invoices" className="text-sm font-normal">Gérer les factures</Label>
                  <Switch
                    id="invoices"
                    checked={permissions.canManageInvoices}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, canManageInvoices: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reports" className="text-sm font-normal">Voir les rapports</Label>
                  <Switch
                    id="reports"
                    checked={permissions.canViewReports}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, canViewReports: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || createInvitationMutation.isPending}>
              {createInvitationMutation.isPending ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
    </AppLayout>
  );
}
