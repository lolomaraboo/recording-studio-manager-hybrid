import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MusicProfileSection } from "@/components/MusicProfileSection";
import { CompanyMembersIndicator } from "@/components/CompanyMembersIndicator";
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
  Mail,
  Phone,
  Building,
  MapPin,
  Upload,
  User,
  Building2,
  Plus,
  Trash2,
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch related data
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: quotes } = trpc.quotes.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();

  const handleUploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      handleUpdateField({ avatarUrl: result.data.url });
      toast.success("Avatar modifié avec succès");
    } catch (error) {
      toast.error("Erreur lors de la modification de l'avatar");
      console.error(error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/client-logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      handleUpdateField({ logoUrl: result.data.url });
      toast.success("Logo modifié avec succès");
    } catch (error) {
      toast.error("Erreur lors de la modification du logo");
      console.error(error);
    } finally {
      setUploadingLogo(false);
    }
  };

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

      {/* Informations Tab - Single view with 2 visual sections */}
      <TabsContent value="informations" className="mt-1 space-y-2">
        {/* Section 1: Informations de Base */}
        <Card>
          <CardContent className="pt-3">
              <div className="space-y-1">
                  {isEditing ? (
                    <>
                      {/* Nom complet */}
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Nom complet</label>
                        <input
                          id="name"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      {/* Champs de nom structuré (pour individus) */}
                      {client.type === "individual" && (
                        <>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="space-y-2">
                              <label htmlFor="prefix" className="text-sm font-medium">Civilité</label>
                              <select
                                id="prefix"
                                value={formData.prefix || ""}
                                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                              >
                                <option value="">-</option>
                                <option value="M.">M.</option>
                                <option value="Mme">Mme</option>
                                <option value="Dr.">Dr.</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label htmlFor="firstName" className="text-sm font-medium">Prénom</label>
                              <input
                                id="firstName"
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.firstName || ""}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="space-y-2">
                              <label htmlFor="middleName" className="text-sm font-medium">Nom du milieu</label>
                              <input
                                id="middleName"
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.middleName || ""}
                                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <label htmlFor="lastName" className="text-sm font-medium">Nom</label>
                              <input
                                id="lastName"
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.lastName || ""}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="suffix" className="text-sm font-medium">Suffixe</label>
                            <input
                              id="suffix"
                              className="w-full px-3 py-2 border rounded-md"
                              value={formData.suffix || ""}
                              onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                              placeholder="Jr., III, etc."
                            />
                          </div>
                        </>
                      )}

                      {/* Nom d'artiste */}
                      <div className="space-y-2">
                        <label htmlFor="artistName" className="text-sm font-medium">Nom d'artiste</label>
                        <input
                          id="artistName"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.artistName || ""}
                          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                        />
                      </div>

                      {/* Emails multiples */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Emails</label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const emails = [...(formData.emails || []), { type: "work", email: "" }];
                              setFormData({ ...formData, emails });
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(formData.emails || []).map((email: any, index: number) => (
                            <div key={index} className="flex gap-2">
                              <select
                                value={email.type}
                                onChange={(e) => {
                                  const emails = [...(formData.emails || [])];
                                  emails[index] = { ...emails[index], type: e.target.value };
                                  setFormData({ ...formData, emails });
                                }}
                                className="w-32 px-3 py-2 border rounded"
                              >
                                <option value="work">Travail</option>
                                <option value="personal">Personnel</option>
                                <option value="other">Autre</option>
                              </select>
                              <input
                                type="email"
                                value={email.email}
                                onChange={(e) => {
                                  const emails = [...(formData.emails || [])];
                                  emails[index] = { ...emails[index], email: e.target.value };
                                  setFormData({ ...formData, emails });
                                }}
                                placeholder="Email"
                                className="flex-1 px-3 py-2 border rounded-md"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const emails = (formData.emails || []).filter((_: any, i: number) => i !== index);
                                  setFormData({ ...formData, emails });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Téléphones multiples */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Téléphones</label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const phones = [...(formData.phones || []), { type: "mobile", number: "" }];
                              setFormData({ ...formData, phones });
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(formData.phones || []).map((phone: any, index: number) => (
                            <div key={index} className="flex gap-2">
                              <select
                                value={phone.type}
                                onChange={(e) => {
                                  const phones = [...(formData.phones || [])];
                                  phones[index] = { ...phones[index], type: e.target.value };
                                  setFormData({ ...formData, phones });
                                }}
                                className="w-32 px-3 py-2 border rounded"
                              >
                                <option value="mobile">Mobile</option>
                                <option value="work">Travail</option>
                                <option value="home">Domicile</option>
                              </select>
                              <input
                                value={phone.number}
                                onChange={(e) => {
                                  const phones = [...(formData.phones || [])];
                                  phones[index] = { ...phones[index], number: e.target.value };
                                  setFormData({ ...formData, phones });
                                }}
                                placeholder="Numéro"
                                className="flex-1 px-3 py-2 border rounded-md"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const phones = (formData.phones || []).filter((_: any, i: number) => i !== index);
                                  setFormData({ ...formData, phones });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Adresse */}
                      <div className="space-y-2">
                        <label htmlFor="address" className="text-sm font-medium">Adresse</label>
                        <textarea
                          id="address"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.address || ""}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Affichage des informations de nom */}
                      {(client.prefix || client.firstName || client.middleName || client.lastName || client.suffix) && (
                        <div className="text-base">
                          <span className="font-semibold">
                            {[client.prefix, client.firstName, client.middleName, client.lastName, client.suffix]
                              .filter(Boolean)
                              .join(" ")}
                          </span>
                        </div>
                      )}

                      {client.artistName && (
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-muted-foreground" />
                          <p className="text-base font-medium">{client.artistName}</p>
                        </div>
                      )}

                      {/* Affichage de l'email simple (legacy) */}
                      {client.email && (!client.emails || client.emails.length === 0) && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="text-base hover:underline">
                            {client.email}
                          </a>
                        </div>
                      )}

                      {/* Affichage des emails multiples */}
                      {(client.emails && client.emails.length > 0) && (
                        <div className="space-y-1">
                          {client.emails.map((email: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <Mail className="h-5 w-5 text-muted-foreground" />
                              <a href={`mailto:${email.email}`} className="text-base hover:underline">
                                {email.email}
                              </a>
                              <span className="text-sm text-muted-foreground">
                                ({email.type === 'work' ? 'Travail' : email.type === 'personal' ? 'Personnel' : 'Autre'})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Affichage du téléphone simple (legacy) */}
                      {client.phone && (!client.phones || client.phones.length === 0) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <a href={`tel:${client.phone}`} className="text-base hover:underline">
                            {client.phone}
                          </a>
                        </div>
                      )}

                      {/* Affichage des téléphones multiples */}
                      {(client.phones && client.phones.length > 0) && (
                        <div className="space-y-1">
                          {client.phones.map((phone: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <Phone className="h-5 w-5 text-muted-foreground" />
                              <a href={`tel:${phone.number}`} className="text-base hover:underline">
                                {phone.number}
                              </a>
                              <span className="text-sm text-muted-foreground">
                                ({phone.type === 'mobile' ? 'Mobile' : phone.type === 'work' ? 'Travail' : 'Domicile'})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {client.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <p className="text-base whitespace-pre-wrap">{client.address}</p>
                        </div>
                      )}

                      {!client.prefix && !client.firstName && !client.lastName && !client.artistName && !client.email && !client.phone && !client.address && (
                        <p className="text-sm text-muted-foreground">Aucune information de contact</p>
                      )}
                    </>
                  )}
                </div>

              <Separator className="my-4" />

              {/* Company Members / Individual Companies Section */}
              <CompanyMembersIndicator
                clientId={clientId}
                clientType={client.type}
                clientName={client.name}
              />

              {/* Profil Musical */}
              <div className="mt-4">
                <MusicProfileSection
                  client={client}
                  isEditing={isEditing}
                  onUpdate={handleUpdateField}
                />
              </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Projets Tab - Placeholder */}
      <TabsContent value="projets" className="mt-2">
        <ProjectsTab clientId={clientId} />
      </TabsContent>

      {/* Tracks Tab */}
      <TabsContent value="tracks" className="mt-2">
        <TracksTab clientId={clientId} />
      </TabsContent>

      {/* Sessions Tab - With 4 view modes */}
      <TabsContent value="sessions" className="mt-2">
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
      <TabsContent value="finances" className="mt-2">
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
