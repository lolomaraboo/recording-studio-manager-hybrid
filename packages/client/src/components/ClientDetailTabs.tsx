import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  SiSpotify,
  SiApplemusic,
  SiYoutube,
  SiSoundcloud,
  SiBandcamp,
  SiTidal,
  SiAmazonmusic,
} from "react-icons/si";
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
  Globe,
  Users,
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
  companies: any[];
  members: any[];
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
  companies,
  members,
}: ClientDetailTabsProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch related data
  const { data: sessions } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: quotes } = trpc.quotes.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();
  const { data: allClients = [] } = trpc.clients.list.useQuery({ limit: 100 });

  // Helper function to find a client by name in all clients
  const findClientByName = (name: string): number | null => {
    if (!name) return null;

    // Remove email from manager contact if present (e.g., "Miss Becky Rogahn <email@...>")
    const cleanName = name.replace(/<[^>]+>/, '').trim();

    // Search in all clients by name or artistName
    const foundClient = allClients.find((c: any) =>
      c.name?.toLowerCase() === cleanName.toLowerCase() ||
      c.artistName?.toLowerCase() === cleanName.toLowerCase()
    );

    return foundClient?.id || null;
  };

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
              <div className="space-y-0.5">
                  {isEditing ? (
                    <>
                      {/* Nom complet */}
                      <div className="space-y-0.5">
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
                            <div className="space-y-0.5">
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

                            <div className="space-y-0.5">
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
                            <div className="space-y-0.5">
                              <label htmlFor="middleName" className="text-sm font-medium">Nom du milieu</label>
                              <input
                                id="middleName"
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.middleName || ""}
                                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label htmlFor="lastName" className="text-sm font-medium">Nom</label>
                              <input
                                id="lastName"
                                className="w-full px-3 py-2 border rounded-md"
                                value={formData.lastName || ""}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
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
                      <div className="space-y-0.5">
                        <label htmlFor="artistName" className="text-sm font-medium">Nom d'artiste</label>
                        <input
                          id="artistName"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.artistName || ""}
                          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                        />
                      </div>

                      {/* Emails multiples */}
                      <div className="space-y-0.5">
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
                        <div className="space-y-0.5">
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
                      <div className="space-y-0.5">
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
                        <div className="space-y-0.5">
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
                      <div className="space-y-0.5">
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
                        <div className="text-sm">
                          <span className="font-semibold">
                            {[client.prefix, client.firstName, client.middleName, client.lastName, client.suffix]
                              .filter(Boolean)
                              .join(" ")}
                          </span>
                        </div>
                      )}

                      {client.artistName && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{client.artistName}</p>
                        </div>
                      )}

                      {/* Affichage de l'email simple (legacy) */}
                      {client.email && (!client.emails || client.emails.length === 0) && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                            {client.email}
                          </a>
                        </div>
                      )}

                      {/* Affichage des emails multiples */}
                      {(client.emails && client.emails.length > 0) && (
                        <div className="space-y-0.5">
                          {client.emails.map((email: any, index: number) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${email.email}`} className="text-sm hover:underline">
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
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                            {client.phone}
                          </a>
                        </div>
                      )}

                      {/* Affichage des téléphones multiples */}
                      {(client.phones && client.phones.length > 0) && (
                        <div className="space-y-0.5">
                          {client.phones.map((phone: any, index: number) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${phone.number}`} className="text-sm hover:underline">
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
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm whitespace-pre-wrap">{client.address}</p>
                        </div>
                      )}

                      {/* Structured Address Fields */}
                      {(client.street || client.city || client.postalCode || client.region || client.country) && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="text-sm">
                            {client.street && <div>{client.street}</div>}
                            <div>
                              {[client.postalCode, client.city].filter(Boolean).join(' ')}
                            </div>
                            {client.region && <div>{client.region}</div>}
                            {client.country && <div>{client.country}</div>}
                          </div>
                        </div>
                      )}

                      {/* Birthday */}
                      {client.birthday && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">
                            {new Date(client.birthday).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {/* Gender */}
                      {client.gender && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <p className="text-base capitalize">{client.gender}</p>
                        </div>
                      )}

                      {/* Websites */}
                      {(client.websites && client.websites.length > 0) && (
                        <div className="space-y-0.5">
                          {client.websites.map((website: any, index: number) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={website.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                              >
                                {website.url}
                              </a>
                              <span className="text-sm text-muted-foreground">
                                ({website.type})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Music Streaming Platforms */}
                      {(client.spotifyUrl || client.appleMusicUrl || client.youtubeUrl || client.soundcloudUrl ||
                        client.bandcampUrl || client.deezerUrl || client.tidalUrl || client.amazonMusicUrl ||
                        client.audiomackUrl || client.beatportUrl || client.otherPlatformsUrl) && (
                        <div className="pt-2 border-t mt-2">
                          <h4 className="text-sm font-semibold mb-1.5 text-foreground">Plateformes de streaming</h4>
                          <div className="space-y-0.5">
                            {client.spotifyUrl && (
                              <div className="flex items-center gap-1.5">
                                <SiSpotify className="h-4 w-4 text-[#1DB954]" />
                                <a href={client.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Spotify
                                </a>
                              </div>
                            )}
                            {client.appleMusicUrl && (
                              <div className="flex items-center gap-1.5">
                                <SiApplemusic className="h-4 w-4 text-[#FA243C]" />
                                <a href={client.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Apple Music
                                </a>
                              </div>
                            )}
                            {client.youtubeUrl && (
                              <div className="flex items-center gap-1.5">
                                <SiYoutube className="h-4 w-4 text-[#FF0000]" />
                                <a href={client.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  YouTube
                                </a>
                              </div>
                            )}
                            {client.soundcloudUrl && (
                              <div className="flex items-center gap-1.5">
                                <SiSoundcloud className="h-4 w-4 text-[#FF5500]" />
                                <a href={client.soundcloudUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  SoundCloud
                                </a>
                              </div>
                            )}
                            {client.bandcampUrl && (
                              <div className="flex items-center gap-1.5">
                                <SiBandcamp className="h-4 w-4 text-[#629AA9]" />
                                <a href={client.bandcampUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Bandcamp
                                </a>
                              </div>
                            )}
                            {client.deezerUrl && (
                              <div className="flex items-center gap-1.5">
                                <Music className="h-4 w-4 text-[#FF0092]" />
                                <a href={client.deezerUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Deezer
                                </a>
                              </div>
                            )}
                            {client.tidalUrl && (
                              <div className="flex items-center gap-1.5">
                                <SiTidal className="h-4 w-4 text-[#000000] dark:text-white" />
                                <a href={client.tidalUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Tidal
                                </a>
                              </div>
                            )}
                            {client.amazonMusicUrl && (
                              <div className="flex items-center gap-1.5">
                                <SiAmazonmusic className="h-4 w-4 text-[#00A8E1]" />
                                <a href={client.amazonMusicUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Amazon Music
                                </a>
                              </div>
                            )}
                            {client.audiomackUrl && (
                              <div className="flex items-center gap-1.5">
                                <Music className="h-4 w-4 text-[#FFA200]" />
                                <a href={client.audiomackUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Audiomack
                                </a>
                              </div>
                            )}
                            {client.beatportUrl && (
                              <div className="flex items-center gap-1.5">
                                <Music className="h-4 w-4 text-[#94D500]" />
                                <a href={client.beatportUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline font-medium">
                                  Beatport
                                </a>
                              </div>
                            )}
                            {client.otherPlatformsUrl && (
                              <div className="flex items-start gap-1.5">
                                <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="text-base whitespace-pre-wrap">{client.otherPlatformsUrl}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Industry Information */}
                      {(client.recordLabel || client.distributor || client.managerContact || client.publisher || client.performanceRightsSociety) && (
                        <div className="pt-2 border-t mt-2">
                          <h4 className="text-sm font-semibold mb-1.5 text-foreground">Informations professionnelles</h4>
                          <div className="space-y-0.5">
                            {client.recordLabel && (() => {
                              const clientId = findClientByName(client.recordLabel);
                              return (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-sm font-semibold min-w-[120px]">Label:</span>
                                  {clientId ? (
                                    <Link to={`/clients/${clientId}`} className="text-sm text-primary hover:underline">
                                      {client.recordLabel}
                                    </Link>
                                  ) : (
                                    <span className="text-sm">{client.recordLabel}</span>
                                  )}
                                </div>
                              );
                            })()}
                            {client.distributor && (() => {
                              const clientId = findClientByName(client.distributor);
                              return (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-sm font-semibold min-w-[120px]">Distributeur:</span>
                                  {clientId ? (
                                    <Link to={`/clients/${clientId}`} className="text-sm text-primary hover:underline">
                                      {client.distributor}
                                    </Link>
                                  ) : (
                                    <span className="text-sm">{client.distributor}</span>
                                  )}
                                </div>
                              );
                            })()}
                            {client.managerContact && (() => {
                              const clientId = findClientByName(client.managerContact);
                              return (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-sm font-semibold min-w-[120px]">Manager:</span>
                                  {clientId ? (
                                    <Link to={`/clients/${clientId}`} className="text-sm text-primary hover:underline">
                                      {client.managerContact}
                                    </Link>
                                  ) : (
                                    <span className="text-sm">{client.managerContact}</span>
                                  )}
                                </div>
                              );
                            })()}
                            {client.publisher && (() => {
                              const clientId = findClientByName(client.publisher);
                              return (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-sm font-semibold min-w-[120px]">Éditeur:</span>
                                  {clientId ? (
                                    <Link to={`/clients/${clientId}`} className="text-sm text-primary hover:underline">
                                      {client.publisher}
                                    </Link>
                                  ) : (
                                    <span className="text-sm">{client.publisher}</span>
                                  )}
                                </div>
                              );
                            })()}
                            {client.performanceRightsSociety && (() => {
                              const clientId = findClientByName(client.performanceRightsSociety);
                              return (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-sm font-semibold min-w-[120px]">Société de droits:</span>
                                  {clientId ? (
                                    <Link to={`/clients/${clientId}`} className="text-sm text-primary hover:underline">
                                      {client.performanceRightsSociety}
                                    </Link>
                                  ) : (
                                    <span className="text-sm">{client.performanceRightsSociety}</span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Career Information */}
                      {(client.yearsActive || client.notableWorks || client.awardsRecognition || client.biography) && (
                        <div className="pt-2 border-t mt-2">
                          <h4 className="text-sm font-semibold mb-1.5 text-foreground">Carrière</h4>
                          <div className="space-y-0.5">
                            {client.yearsActive && (
                              <div className="flex items-start gap-1.5">
                                <span className="text-sm font-semibold min-w-[120px]">Années actives:</span>
                                <span className="text-sm">{client.yearsActive}</span>
                              </div>
                            )}
                            {client.notableWorks && (
                              <div>
                                <h5 className="text-sm font-semibold mb-0.5">Œuvres notables</h5>
                                <p className="text-sm whitespace-pre-wrap">{client.notableWorks}</p>
                              </div>
                            )}
                            {client.awardsRecognition && (
                              <div>
                                <h5 className="text-sm font-semibold mb-0.5">Prix et distinctions</h5>
                                <p className="text-sm whitespace-pre-wrap">{client.awardsRecognition}</p>
                              </div>
                            )}
                            {client.biography && (
                              <div>
                                <h5 className="text-sm font-semibold mb-0.5">Biographie</h5>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{client.biography}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {client.notes && (
                        <div className="pt-2 border-t mt-2">
                          <h4 className="text-sm font-semibold mb-1.5 text-foreground">Notes internes</h4>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/50 p-2 rounded-md">{client.notes}</p>
                        </div>
                      )}

                      {!client.prefix && !client.firstName && !client.lastName && !client.artistName && !client.email && !client.phone && !client.address && (
                        <p className="text-sm text-muted-foreground">Aucune information de contact</p>
                      )}
                    </>
                  )}
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
