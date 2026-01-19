/**
 * MusicProfileSection.tsx
 * Music profile fields for artist clients (genres, instruments, streaming, industry, career)
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { FLAT_GENRES, FLAT_INSTRUMENTS } from "@/lib/music-presets";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router-dom";
import {
  Music,
  Guitar,
  Radio,
  Briefcase,
  Award,
  ChevronDown,
  ChevronUp,
  Plus,
  ExternalLink,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Client interface with music profile fields
interface Client {
  id: number;
  genres?: string[] | null;
  instruments?: string[] | null;
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
  youtubeUrl?: string | null;
  soundcloudUrl?: string | null;
  bandcampUrl?: string | null;
  deezerUrl?: string | null;
  tidalUrl?: string | null;
  amazonMusicUrl?: string | null;
  audiomackUrl?: string | null;
  beatportUrl?: string | null;
  otherPlatformsUrl?: string | null;
  recordLabel?: string | null;
  distributor?: string | null;
  managerContact?: string | null;
  publisher?: string | null;
  performanceRightsSociety?: string | null;
  yearsActive?: string | null;
  notableWorks?: string | null;
  awardsRecognition?: string | null;
  biography?: string | null;
}

interface MusicProfileSectionProps {
  client: Client;
  isEditing: boolean;
  onUpdate: (data: Partial<Client>) => void;
}

export function MusicProfileSection({ client, isEditing, onUpdate }: MusicProfileSectionProps) {
  // Panel state persistence in localStorage
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    const saved = localStorage.getItem('music-profile-panel-state');
    return saved ? JSON.parse(saved) : false; // Default collapsed
  });

  useEffect(() => {
    localStorage.setItem('music-profile-panel-state', JSON.stringify(isPanelOpen));
  }, [isPanelOpen]);

  // Load all clients to match industry contacts
  const { data: allClients } = trpc.clients.list.useQuery({ limit: 1000 });

  // Helper: Find client ID by name (exact match, case-insensitive)
  const findClientByName = useMemo(() => {
    const clientMap = new Map<string, number>();
    allClients?.forEach(c => {
      clientMap.set(c.name.toLowerCase().trim(), c.id);
    });
    return (name: string | null | undefined): number | null => {
      if (!name) return null;
      return clientMap.get(name.toLowerCase().trim()) || null;
    };
  }, [allClients]);

  // Helper component: Display text or link to client
  const IndustryContactLink = ({ text }: { text: string | null | undefined }) => {
    if (!text) return null;
    const clientId = findClientByName(text);

    if (clientId) {
      return (
        <Link
          to={`/clients/${clientId}`}
          className="text-sm text-foreground hover:text-primary underline underline-offset-4 transition-colors py-2 flex items-center gap-2"
        >
          <span>{text}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </Link>
      );
    }

    return <p className="text-sm text-foreground py-2">{text}</p>;
  };

  return (
    <div className="space-y-6">
      {/* Main View - Instruments and Genres (Always Visible) */}
      <div className="space-y-4">
          {/* Instruments Row */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Guitar className="h-4 w-4" />
              Instruments
            </Label>
            {isEditing ? (
              <MultiSelect
                value={client.instruments || []}
                onChange={(values) => onUpdate({ instruments: values })}
                options={FLAT_INSTRUMENTS.map(i => ({ label: i, value: i }))}
                placeholder="Sélectionner des instruments ou ajouter des personnalisés..."
                creatable
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(client.instruments || []).length > 0 ? (
                  (client.instruments || []).map((instrument: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      <Guitar className="h-3 w-3" />
                      {instrument}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun instrument renseigné</p>
                )}
              </div>
            )}
          </div>

          {/* Genres Row */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4" />
              Genres musicaux
            </Label>
            {isEditing ? (
              <MultiSelect
                value={client.genres || []}
                onChange={(values) => onUpdate({ genres: values })}
                options={FLAT_GENRES.map(g => ({ label: g, value: g }))}
                placeholder="Sélectionner des genres ou ajouter des personnalisés..."
                creatable
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(client.genres || []).length > 0 ? (
                  (client.genres || []).map((genre: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {genre}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun genre renseigné</p>
                )}
              </div>
            )}
          </div>
      </div>

      {/* Expandable Panel - Informations Musicales (Streaming, Industry, Career) */}
      <Collapsible open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-8 w-8 text-primary" />
                  Informations Musicales
                </CardTitle>
                {isPanelOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <CardDescription>
                Plateformes de streaming, contacts industrie, informations de carrière
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-4">
              {/* Streaming Platforms Section */}
              {(() => {
                const streamingFields = [
                  { key: 'spotifyUrl', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...' },
                  { key: 'appleMusicUrl', label: 'Apple Music', placeholder: 'https://music.apple.com/artist/...' },
                  { key: 'youtubeUrl', label: 'YouTube', placeholder: 'https://youtube.com/...' },
                  { key: 'soundcloudUrl', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
                  { key: 'bandcampUrl', label: 'Bandcamp', placeholder: 'https://artistname.bandcamp.com' },
                  { key: 'deezerUrl', label: 'Deezer', placeholder: 'https://deezer.com/artist/...' },
                  { key: 'tidalUrl', label: 'Tidal', placeholder: 'https://tidal.com/artist/...' },
                  { key: 'amazonMusicUrl', label: 'Amazon Music', placeholder: 'https://music.amazon.com/...' },
                  { key: 'audiomackUrl', label: 'Audiomack', placeholder: 'https://audiomack.com/...' },
                  { key: 'beatportUrl', label: 'Beatport', placeholder: 'https://beatport.com/artist/...' },
                ];
                const hasStreamingData = isEditing || streamingFields.some(f => client[f.key as keyof Client]) || client.otherPlatformsUrl;

                if (!hasStreamingData) return null;

                return (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      Plateformes de streaming
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {streamingFields
                        .filter(({ key }) => isEditing || client[key as keyof Client])
                        .map(({ key, label, placeholder }) => {
                          const value = (client[key as keyof Client] as string) || "";
                          return (
                            <div key={key}>
                              <Label className="text-xs">{label}</Label>
                              {isEditing ? (
                                <Input
                                  value={value}
                                  onChange={(e) => onUpdate({ [key]: e.target.value })}
                                  placeholder={placeholder}
                                  className="text-sm"
                                />
                              ) : value ? (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary underline underline-offset-4 transition-colors"
                                >
                                  <span className="truncate">{value}</span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ) : null}
                            </div>
                          );
                        })}
                      {(isEditing || client.otherPlatformsUrl) && (
                        <div className="col-span-2">
                          <Label className="text-xs">Autres plateformes</Label>
                          {isEditing ? (
                            <Textarea
                              value={client.otherPlatformsUrl || ""}
                              onChange={(e) => onUpdate({ otherPlatformsUrl: e.target.value })}
                              placeholder="URLs supplémentaires (une par ligne)"
                              rows={2}
                              className="text-sm"
                            />
                          ) : client.otherPlatformsUrl ? (
                            <div className="space-y-1">
                              {client.otherPlatformsUrl.split('\n').filter(url => url.trim()).map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary underline underline-offset-4 transition-colors"
                                >
                                  <span className="truncate">{url.trim()}</span>
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Industry Contacts Section */}
              {(() => {
                const hasIndustryData = isEditing ||
                  client.recordLabel ||
                  client.distributor ||
                  client.managerContact ||
                  client.publisher ||
                  client.performanceRightsSociety;

                if (!hasIndustryData) return null;

                return (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Contacts industrie
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(isEditing || client.recordLabel) && (
                        <div>
                          <Label className="text-xs">Label</Label>
                          {isEditing ? (
                            <Input
                              value={client.recordLabel || ""}
                              onChange={(e) => onUpdate({ recordLabel: e.target.value })}
                              placeholder="Nom du label"
                              className="text-sm"
                            />
                          ) : (
                            <IndustryContactLink text={client.recordLabel} />
                          )}
                        </div>
                      )}
                      {(isEditing || client.distributor) && (
                        <div>
                          <Label className="text-xs">Distributeur</Label>
                          {isEditing ? (
                            <Input
                              value={client.distributor || ""}
                              onChange={(e) => onUpdate({ distributor: e.target.value })}
                              placeholder="Nom du distributeur"
                              className="text-sm"
                            />
                          ) : (
                            <IndustryContactLink text={client.distributor} />
                          )}
                        </div>
                      )}
                      {(isEditing || client.managerContact) && (
                        <div>
                          <Label className="text-xs">Manager</Label>
                          {isEditing ? (
                            <Input
                              value={client.managerContact || ""}
                              onChange={(e) => onUpdate({ managerContact: e.target.value })}
                              placeholder="Nom et contact du manager"
                              className="text-sm"
                            />
                          ) : (
                            <IndustryContactLink text={client.managerContact} />
                          )}
                        </div>
                      )}
                      {(isEditing || client.publisher) && (
                        <div>
                          <Label className="text-xs">Éditeur</Label>
                          {isEditing ? (
                            <Input
                              value={client.publisher || ""}
                              onChange={(e) => onUpdate({ publisher: e.target.value })}
                              placeholder="Nom de l'éditeur"
                              className="text-sm"
                            />
                          ) : (
                            <IndustryContactLink text={client.publisher} />
                          )}
                        </div>
                      )}
                      {(isEditing || client.performanceRightsSociety) && (
                        <div className="col-span-2">
                          <Label className="text-xs">Société de gestion collective (SACEM, SOCAN, BMI, etc.)</Label>
                          {isEditing ? (
                            <Input
                              value={client.performanceRightsSociety || ""}
                              onChange={(e) => onUpdate({ performanceRightsSociety: e.target.value })}
                              placeholder="Nom de la société"
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm text-foreground py-2">{client.performanceRightsSociety}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Career Information Section */}
              {(() => {
                const hasCareerData = isEditing ||
                  client.yearsActive ||
                  client.notableWorks ||
                  client.awardsRecognition ||
                  client.biography;

                if (!hasCareerData) return null;

                return (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Informations de carrière
                    </h4>
                    <div className="space-y-3">
                      {(isEditing || client.yearsActive) && (
                        <div>
                          <Label className="text-xs">Années d'activité</Label>
                          {isEditing ? (
                            <Input
                              value={client.yearsActive || ""}
                              onChange={(e) => onUpdate({ yearsActive: e.target.value })}
                              placeholder="ex: 2015-présent ou 2010-2018"
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm text-foreground py-2">{client.yearsActive}</p>
                          )}
                        </div>
                      )}
                      {(isEditing || client.notableWorks) && (
                        <div>
                          <Label className="text-xs">Œuvres notables</Label>
                          {isEditing ? (
                            <Textarea
                              value={client.notableWorks || ""}
                              onChange={(e) => onUpdate({ notableWorks: e.target.value })}
                              placeholder="Albums, singles, collaborations marquantes..."
                              rows={2}
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap py-2">{client.notableWorks}</p>
                          )}
                        </div>
                      )}
                      {(isEditing || client.awardsRecognition) && (
                        <div>
                          <Label className="text-xs">Prix et reconnaissances</Label>
                          {isEditing ? (
                            <Textarea
                              value={client.awardsRecognition || ""}
                              onChange={(e) => onUpdate({ awardsRecognition: e.target.value })}
                              placeholder="Prix, nominations, distinctions..."
                              rows={2}
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap py-2">{client.awardsRecognition}</p>
                          )}
                        </div>
                      )}
                      {(isEditing || client.biography) && (
                        <div>
                          <Label className="text-xs">Biographie</Label>
                          {isEditing ? (
                            <Textarea
                              value={client.biography || ""}
                              onChange={(e) => onUpdate({ biography: e.target.value })}
                              placeholder="Histoire de l'artiste, parcours musical..."
                              rows={4}
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap py-2">{client.biography}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Empty State - Quick Add Buttons (when no data and not editing) */}
      {!isEditing && (client.genres || []).length === 0 && (client.instruments || []).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Aucune information musicale renseignée
            </p>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ genres: [] })}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter genres
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ instruments: [] })}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter instruments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
