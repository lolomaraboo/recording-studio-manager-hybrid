import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Calendar,
  Music,
  DollarSign,
  Mail,
  Phone,
  Globe,
  User,
  ExternalLink,
} from "lucide-react";
import { TALENT_TYPE_LABELS } from "@rsm/shared";
import { TalentEditForm } from "./TalentEditForm";

interface TalentDetailTabsProps {
  talentId: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  talent: any;
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  handleUpdateField: (updates: any) => void;
}

export function TalentDetailTabs({
  talentId,
  activeTab,
  onTabChange,
  talent,
  isEditing,
  formData,
  setFormData,
  handleUpdateField,
}: TalentDetailTabsProps) {
  // Parse JSON arrays for display
  const parseJsonArray = (jsonString: string | null) => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const instruments = parseJsonArray(talent.instruments);
  const genres = parseJsonArray(talent.genres);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="informations" className="gap-2">
          <Info className="h-4 w-4" />
          Informations
        </TabsTrigger>
        <TabsTrigger value="sessions" className="gap-2">
          <Calendar className="h-4 w-4" />
          Sessions
        </TabsTrigger>
        <TabsTrigger value="projets" className="gap-2">
          <Music className="h-4 w-4" />
          Projets
        </TabsTrigger>
        <TabsTrigger value="finances" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Finances
        </TabsTrigger>
      </TabsList>

      {/* Informations Tab */}
      <TabsContent value="informations" className="mt-2 space-y-2">
        {isEditing ? (
          <TalentEditForm
            formData={formData}
            setFormData={setFormData}
          />
        ) : (
          <Card>
            <CardContent className="pt-3">
              <div className="space-y-0.5">
                {/* Section: Identité */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Identité
                  </h3>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3">
                      <span className="text-sm text-muted-foreground">Nom complet</span>
                      <span className="col-span-2 text-sm">{talent.name}</span>
                    </div>
                    {talent.stageName && (
                      <div className="grid grid-cols-3">
                        <span className="text-sm text-muted-foreground">Nom de scène</span>
                        <span className="col-span-2 text-sm">{talent.stageName}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">{TALENT_TYPE_LABELS[talent.talentType as keyof typeof TALENT_TYPE_LABELS]}</Badge>
                    </div>
                  </div>
                </div>
                <Separator />

                {/* Section: Contact */}
                {(talent.email || talent.phone || talent.website) && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Contact
                      </h3>
                      <div className="grid gap-2">
                        {talent.email && (
                          <div className="grid grid-cols-3">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <a href={`mailto:${talent.email}`} className="col-span-2 text-sm hover:underline">
                              {talent.email}
                            </a>
                          </div>
                        )}
                        {talent.phone && (
                          <div className="grid grid-cols-3">
                            <span className="text-sm text-muted-foreground">Téléphone</span>
                            <a href={`tel:${talent.phone}`} className="col-span-2 text-sm hover:underline">
                              {talent.phone}
                            </a>
                          </div>
                        )}
                        {talent.website && (
                          <div className="grid grid-cols-3">
                            <span className="text-sm text-muted-foreground">Site web</span>
                            <a
                              href={talent.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="col-span-2 text-sm hover:underline flex items-center gap-1"
                            >
                              {talent.website}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Section: Profil Musical */}
                {(instruments.length > 0 || genres.length > 0 || talent.bio) && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Music className="h-4 w-4 text-primary" />
                        Profil Musical
                      </h3>
                      <div className="grid gap-2">
                        {instruments.length > 0 && (
                          <div className="grid grid-cols-3">
                            <span className="text-sm text-muted-foreground">Instruments</span>
                            <span className="col-span-2 text-sm">{instruments.join(", ")}</span>
                          </div>
                        )}
                        {genres.length > 0 && (
                          <div className="grid grid-cols-3">
                            <span className="text-sm text-muted-foreground">Genres</span>
                            <span className="col-span-2 text-sm">{genres.join(", ")}</span>
                          </div>
                        )}
                        {talent.bio && (
                          <div className="grid grid-cols-3">
                            <span className="text-sm text-muted-foreground">Biographie</span>
                            <span className="col-span-2 text-sm whitespace-pre-line">{talent.bio}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Section: Plateformes Streaming */}
                {talent.spotifyUrl && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        Plateformes Streaming
                      </h3>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3">
                          <span className="text-sm text-muted-foreground">Spotify</span>
                          <a
                            href={talent.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 text-sm hover:underline flex items-center gap-1"
                          >
                            Profil Spotify
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Notes */}
                {talent.notes && (
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold mb-1.5 text-foreground">Notes internes</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/50 p-2 rounded-md">
                      {talent.notes}
                    </p>
                  </div>
                )}

                {!talent.name && !talent.email && !talent.phone && (
                  <p className="text-sm text-muted-foreground">Aucune information de contact</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Sessions Tab - Placeholder */}
      <TabsContent value="sessions" className="mt-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Sessions impliquant ce talent à venir dans une future phase.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Projets Tab - Placeholder */}
      <TabsContent value="projets" className="mt-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Projets impliquant ce talent à venir dans une future phase.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Finances Tab - Placeholder */}
      <TabsContent value="finances" className="mt-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Factures liées à ce talent à venir dans une future phase.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
