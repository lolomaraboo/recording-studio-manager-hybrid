import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EnrichedClientInfo } from "@/components/EnrichedClientInfo";
import { MusicProfileSection } from "@/components/MusicProfileSection";
import {
  Info,
  FolderOpen,
  Music,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Mail,
  Phone,
  Building,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { trpc } from "@/lib/trpc";

interface ClientDetailTabsProps {
  clientId: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  client: any;
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  handleUpdateField: (updates: any) => void;
  clientWithContacts: any;
  addContactMutation: any;
  deleteContactMutation: any;
}

export function ClientDetailTabs({
  clientId,
  activeTab,
  onTabChange,
  client,
  isEditing,
  formData,
  setFormData,
  handleUpdateField,
  clientWithContacts,
  addContactMutation,
  deleteContactMutation,
}: ClientDetailTabsProps) {
  // Fetch related data
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();

  // Filter data by client
  const clientSessions = useMemo(() => {
    return sessions?.filter((s) => s.clientId === clientId) || [];
  }, [sessions, clientId]);

  const clientInvoices = useMemo(() => {
    return invoices?.filter((inv) => inv.clientId === clientId) || [];
  }, [invoices, clientId]);

  const roomMap = useMemo(() => {
    return (
      rooms?.reduce((acc, room) => {
        acc[room.id] = room.name;
        return acc;
      }, {} as Record<number, string>) || {}
    );
  }, [rooms]);

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

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="informations" className="gap-2">
          <Info className="h-4 w-4" />
          Informations
        </TabsTrigger>
        <TabsTrigger value="projets" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Projets
        </TabsTrigger>
        <TabsTrigger value="tracks" className="gap-2">
          <Music className="h-4 w-4" />
          Tracks
        </TabsTrigger>
        <TabsTrigger value="sessions" className="gap-2">
          <Calendar className="h-4 w-4" />
          Sessions
        </TabsTrigger>
        <TabsTrigger value="finances" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Finances
        </TabsTrigger>
      </TabsList>

      {/* Informations Tab - Contains the 3 existing sub-tabs */}
      <TabsContent value="informations" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="info-basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info-basic" className="gap-2">
                  <Users className="h-4 w-4" />
                  Informations
                </TabsTrigger>
                <TabsTrigger value="info-enriched" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Informations Enrichies
                </TabsTrigger>
                <TabsTrigger value="info-music" className="gap-2">
                  <Music className="h-4 w-4" />
                  Profil Musical
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info-basic" className="space-y-4 mt-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Nom</label>
                      <input
                        id="name"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <input
                          id="email"
                          type="email"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Téléphone</label>
                        <input
                          id="phone"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="artistName" className="text-sm font-medium">Nom d'artiste</label>
                      <input
                        id="artistName"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.artistName}
                        onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="address" className="text-sm font-medium">Adresse</label>
                      <textarea
                        id="address"
                        className="w-full px-3 py-2 border rounded-md"
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
              </TabsContent>

              <TabsContent value="info-enriched">
                <EnrichedClientInfo
                  client={formData as any}
                  isEditing={isEditing}
                  onUpdate={handleUpdateField as any}
                  contacts={clientWithContacts?.contacts as any || []}
                  onAddContact={(contact) => {
                    addContactMutation.mutate({
                      clientId: clientId,
                      ...contact,
                    });
                  }}
                  onDeleteContact={(contactId) => {
                    deleteContactMutation.mutate({ id: contactId });
                  }}
                />
              </TabsContent>

              <TabsContent value="info-music">
                <MusicProfileSection
                  client={client}
                  isEditing={isEditing}
                  onUpdate={handleUpdateField}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Projets Tab - Placeholder */}
      <TabsContent value="projets" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Onglet Projets - À implémenter</p>
              <p className="text-sm text-muted-foreground">
                Cette section affichera la liste des projets du client
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tracks Tab - Placeholder */}
      <TabsContent value="tracks" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Onglet Tracks - À implémenter</p>
              <p className="text-sm text-muted-foreground">
                Cette section affichera la liste des tracks du client
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sessions Tab - Keep existing implementation */}
      <TabsContent value="sessions" className="mt-4">
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      </TabsContent>

      {/* Finances Tab - Keep existing invoices, add placeholders for quotes/stats */}
      <TabsContent value="finances" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="invoices">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="invoices">Factures ({clientInvoices.length})</TabsTrigger>
                <TabsTrigger value="quotes">Devis</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
              </TabsList>

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

              <TabsContent value="quotes" className="mt-4">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Devis - À implémenter</p>
                  <p className="text-sm text-muted-foreground">
                    Cette section affichera les devis du client
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Statistiques financières - À implémenter</p>
                  <p className="text-sm text-muted-foreground">
                    Cette section affichera les statistiques financières du client
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
