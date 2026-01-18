/**
 * MusicProfileSection.tsx
 * Music profile fields for artist clients (genres, instruments, streaming, industry, career)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { FLAT_GENRES, FLAT_INSTRUMENTS } from "@/lib/music-presets";
import {
  Music,
  Guitar,
  Radio,
  Briefcase,
  Award,
  ChevronDown,
  ChevronUp,
  Plus,
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

  return (
    <div className="space-y-6">
      {/* Main View - Genres and Instruments with Icons (Always Visible) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            Profil Musical
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
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
        </CardContent>
      </Card>

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
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Plateformes de streaming
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
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
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <Input
                        value={(client[key as keyof Client] as string) || ""}
                        onChange={(e) => onUpdate({ [key]: e.target.value })}
                        placeholder={placeholder}
                        disabled={!isEditing}
                        className="text-sm"
                      />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <Label className="text-xs">Autres plateformes</Label>
                    <Textarea
                      value={client.otherPlatformsUrl || ""}
                      onChange={(e) => onUpdate({ otherPlatformsUrl: e.target.value })}
                      placeholder="URLs supplémentaires (une par ligne)"
                      disabled={!isEditing}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Industry Contacts Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Contacts industrie
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={client.recordLabel || ""}
                      onChange={(e) => onUpdate({ recordLabel: e.target.value })}
                      placeholder="Nom du label"
                      disabled={!isEditing}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Distributeur</Label>
                    <Input
                      value={client.distributor || ""}
                      onChange={(e) => onUpdate({ distributor: e.target.value })}
                      placeholder="Nom du distributeur"
                      disabled={!isEditing}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Manager</Label>
                    <Input
                      value={client.managerContact || ""}
                      onChange={(e) => onUpdate({ managerContact: e.target.value })}
                      placeholder="Nom et contact du manager"
                      disabled={!isEditing}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Éditeur</Label>
                    <Input
                      value={client.publisher || ""}
                      onChange={(e) => onUpdate({ publisher: e.target.value })}
                      placeholder="Nom de l'éditeur"
                      disabled={!isEditing}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Société de gestion collective (SACEM, SOCAN, BMI, etc.)</Label>
                    <Input
                      value={client.performanceRightsSociety || ""}
                      onChange={(e) => onUpdate({ performanceRightsSociety: e.target.value })}
                      placeholder="Nom de la société"
                      disabled={!isEditing}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Career Information Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Informations de carrière
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Années d'activité</Label>
                    <Input
                      value={client.yearsActive || ""}
                      onChange={(e) => onUpdate({ yearsActive: e.target.value })}
                      placeholder="ex: 2015-présent ou 2010-2018"
                      disabled={!isEditing}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Œuvres notables</Label>
                    <Textarea
                      value={client.notableWorks || ""}
                      onChange={(e) => onUpdate({ notableWorks: e.target.value })}
                      placeholder="Albums, singles, collaborations marquantes..."
                      disabled={!isEditing}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Prix et reconnaissances</Label>
                    <Textarea
                      value={client.awardsRecognition || ""}
                      onChange={(e) => onUpdate({ awardsRecognition: e.target.value })}
                      placeholder="Prix, nominations, distinctions..."
                      disabled={!isEditing}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Biographie</Label>
                    <Textarea
                      value={client.biography || ""}
                      onChange={(e) => onUpdate({ biography: e.target.value })}
                      placeholder="Histoire de l'artiste, parcours musical..."
                      disabled={!isEditing}
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
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
