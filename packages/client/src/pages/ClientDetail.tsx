import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { NotesHistory } from "@/components/NotesHistory";
import { EnrichedClientInfo } from "@/components/EnrichedClientInfo";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  FileText,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch client data
  const { data: client, isLoading, refetch } = trpc.clients.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch client with contacts (for vCard tab)
  const { data: clientWithContacts } = trpc.clients.getWithContacts.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch related data for history
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();

  // Filter data by client
  const clientSessions = useMemo(() => {
    return sessions?.filter((s) => s.clientId === Number(id)) || [];
  }, [sessions, id]);

  const clientInvoices = useMemo(() => {
    return invoices?.filter((inv) => inv.clientId === Number(id)) || [];
  }, [invoices, id]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSessions = clientSessions.length;
    const totalRevenue = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);
    const paidRevenue = clientInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);
    const pendingRevenue = clientInvoices
      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
      .reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

    const sortedSessions = [...clientSessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    const lastSession = sortedSessions[0];

    return {
      totalSessions,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      lastSession,
    };
  }, [clientSessions, clientInvoices]);

  // Mutations
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client mis à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client supprimé");
      navigate("/clients");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Contact mutations
  const addContactMutation = trpc.clients.addContact.useMutation({
    onSuccess: () => {
      toast.success("Contact ajouté");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteContactMutation = trpc.clients.deleteContact.useMutation({
    onSuccess: () => {
      toast.success("Contact supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    // Existing fields
    name: "",
    email: "",
    phone: "",
    artistName: "",
    address: "",

    // NEW vCard fields
    type: "individual" as "individual" | "company",
    firstName: "",
    lastName: "",
    middleName: "",
    prefix: "",
    suffix: "",
    avatarUrl: "",
    logoUrl: "",
    phones: [] as Array<{type: string; number: string}>,
    emails: [] as Array<{type: string; email: string}>,
    websites: [] as Array<{type: string; url: string}>,
    street: "",
    postalCode: "",
    region: "",
    birthday: "",
    gender: "",
    customFields: [] as Array<{label: string; type: string; value: any}>,
  });

  // Update form when client loads
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email || "",
        phone: client.phone || "",
        artistName: client.artistName || "",
        address: client.address || "",
        type: (client.type as "individual" | "company") || "individual",
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        middleName: client.middleName || "",
        prefix: client.prefix || "",
        suffix: client.suffix || "",
        avatarUrl: client.avatarUrl || "",
        logoUrl: client.logoUrl || "",
        phones: client.phones || [],
        emails: client.emails || [],
        websites: client.websites || [],
        street: client.street || "",
        postalCode: client.postalCode || "",
        region: client.region || "",
        birthday: client.birthday || "",
        gender: client.gender || "",
        customFields: client.customFields || [],
      });
    }
  }, [client]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      data: formData,
    });
  };

  const handleUpdateField = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const getSessionStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      scheduled: { variant: "outline", label: "Programmée" },
      in_progress: { variant: "default", label: "En cours" },
      completed: { variant: "secondary", label: "Terminée" },
      cancelled: { variant: "destructive", label: "Annulée" },
    };

    const config = variants[status] || variants.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      sent: { variant: "outline", label: "Envoyée" },
      paid: { variant: "default", label: "Payée" },
      cancelled: { variant: "destructive", label: "Annulée" },
      overdue: { variant: "destructive", label: "En retard" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const roomMap = useMemo(() => {
    return (
      rooms?.reduce((acc, room) => {
        acc[room.id] = room.name;
        return acc;
      }, {} as Record<number, string>) || {}
    );
  }, [rooms]);

  if (isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold">Client introuvable</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Ce client n'existe pas ou a été supprimé.</p>
              <Button className="mt-4" asChild size="sm">
                <Link to="/clients">Retour aux clients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isVIP = stats.totalRevenue > 10000; // VIP if >10k€ revenue

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              {client.name}
              {isVIP && <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />}
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {/* Stats Row */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sessions totales</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  {stats.totalSessions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {stats.lastSession
                    ? `Dernière: ${format(new Date(stats.lastSession.startTime), "dd MMM yyyy", { locale: fr })}`
                    : "Aucune session"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Revenu total</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {stats.totalRevenue.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  €
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Toutes factures</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Payé</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {stats.paidRevenue.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  €
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Factures réglées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>En attente</CardDescription>
                <CardTitle className="text-3xl text-orange-600">
                  {stats.pendingRevenue.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  €
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">À encaisser</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column - Client Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Informations du client</CardTitle>
                      <CardDescription>Coordonnées et informations de contact</CardDescription>
                    </div>
                    {/* Actions rapides - V2 */}
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} title="Modifier les informations du client">
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="artistName">Nom d'artiste</Label>
                        <Input
                          id="artistName"
                          value={formData.artistName}
                          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {client.artistName && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{client.artistName}</p>
                        </div>
                      )}

                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                            {client.email}
                          </a>
                        </div>
                      )}

                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                            {client.phone}
                          </a>
                        </div>
                      )}

                      {client.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm whitespace-pre-wrap">{client.address}</p>
                        </div>
                      )}

                      {!client.artistName && !client.email && !client.phone && !client.address && (
                        <p className="text-sm text-muted-foreground">Aucune information de contact</p>
                      )}
                    </>
                  )}

                  {/* Informations enrichies - déplacé depuis l'onglet Historique */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-4">Informations enrichies</h3>
                    <EnrichedClientInfo
                      client={formData}
                      isEditing={isEditing}
                      onUpdate={handleUpdateField}
                      contacts={clientWithContacts?.contacts || []}
                      onAddContact={(contact) => {
                        addContactMutation.mutate({
                          clientId: Number(id),
                          ...contact,
                        });
                      }}
                      onDeleteContact={(contactId) => {
                        deleteContactMutation.mutate({ id: contactId });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes History */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Historique daté des notes sur le client</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotesHistory clientId={client.id} />
                </CardContent>
              </Card>

              {/* History Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Historique</CardTitle>
                  <CardDescription>Sessions et factures du client</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="sessions">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sessions">
                        Sessions ({clientSessions.length})
                      </TabsTrigger>
                      <TabsTrigger value="invoices">
                        Factures ({clientInvoices.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sessions" className="mt-4">
                      {clientSessions.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Session</TableHead>
                                <TableHead>Salle</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {clientSessions
                                .sort(
                                  (a, b) =>
                                    new Date(b.startTime).getTime() -
                                    new Date(a.startTime).getTime()
                                )
                                .slice(0, 10)
                                .map((session) => (
                                  <TableRow key={session.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{session.title}</div>
                                        <div className="text-sm text-muted-foreground capitalize">
                                          {session.status}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">{roomMap[session.roomId] || "N/A"}</div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {format(new Date(session.startTime), "dd MMM yyyy", {
                                          locale: fr,
                                        })}
                                      </div>
                                    </TableCell>
                                    <TableCell>{getSessionStatusBadge(session.status)}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" asChild>
                                        <Link to={`/sessions/${session.id}`}>Voir</Link>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium mb-1">Aucune session enregistrée</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="invoices" className="mt-4">
                    {clientInvoices.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Facture #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {clientInvoices
                                .sort(
                                  (a, b) =>
                                    new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
                                )
                                .slice(0, 10)
                                .map((invoice) => (
                                  <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">
                                      {invoice.invoiceNumber}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {format(new Date(invoice.issueDate), "dd MMM yyyy", {
                                          locale: fr,
                                        })}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-semibold">
                                        {parseFloat(invoice.total || "0").toLocaleString("fr-FR", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                        €
                                      </div>
                                    </TableCell>
                                    <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" asChild>
                                        <Link to={`/invoices/${invoice.id}`}>Voir</Link>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium mb-1">Aucune facture émise</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Meta Info */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline" className="capitalize">
                      {client.type === "company" ? "Entreprise" : "Particulier"}
                    </Badge>
                  </div>

                  {isVIP && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Statut</p>
                      <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        Client VIP
                      </Badge>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Membre depuis</p>
                    <p className="text-sm">
                      {format(new Date(client.createdAt), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dernière mise à jour</p>
                    <p className="text-sm">
                      {format(new Date(client.updatedAt), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/sessions/new?clientId=${client.id}`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Nouvelle session
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/invoices/new?clientId=${client.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Nouvelle facture
                    </Link>
                  </Button>
                  {client.email && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`mailto:${client.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer un email
                      </a>
                    </Button>
                  )}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le client</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible et
              supprimera également toutes les sessions et factures associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
