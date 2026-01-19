import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { EnrichedClientInfo } from "@/components/EnrichedClientInfo";
import { MusicProfileSection } from "@/components/MusicProfileSection";
import { SessionsTab } from "./tabs/SessionsTab";
import { FinancesTab } from "./tabs/FinancesTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { TracksTab } from "./tabs/TracksTab";
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
  const { data: quotes } = trpc.quotes.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();

  // Filter data by client
  const clientSessions = useMemo(() => {
    return sessions?.filter((s) => s.clientId === clientId) || [];
  }, [sessions, clientId]);

  const clientInvoices = useMemo(() => {
    return invoices?.filter((inv) => inv.clientId === clientId) || [];
  }, [invoices, clientId]);

  const clientQuotes = useMemo(() => {
    return quotes?.filter((q) => q.clientId === clientId) || [];
  }, [quotes, clientId]);

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
        <ProjectsTab clientId={clientId} />
      </TabsContent>

      {/* Tracks Tab */}
      <TabsContent value="tracks" className="mt-4">
        <TracksTab clientId={clientId} />
      </TabsContent>

      {/* Sessions Tab - With 4 view modes */}
      <TabsContent value="sessions" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <SessionsTab
              clientId={clientId}
              sessions={clientSessions}
              rooms={rooms || []}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Finances Tab - Stats + Factures/Quotes with view modes */}
      <TabsContent value="finances" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <FinancesTab
              clientId={clientId}
              invoices={clientInvoices}
              quotes={clientQuotes}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
