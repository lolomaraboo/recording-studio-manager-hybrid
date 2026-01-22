import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Music, Mail, Phone, Globe, ArrowLeft, TableIcon, Grid, Columns, Copy, Star, ArrowUp, ArrowDown, ArrowUpDown, Eye, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { TALENT_TYPES, TALENT_TYPE_LABELS, type TalentType } from "@rsm/shared";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ViewMode = 'table' | 'grid' | 'kanban';
type SortField = 'name' | 'talentType' | 'credits' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

/**
 * Copy button for email/phone with toast feedback
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié!`);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 p-0"
      onClick={handleCopy}
      title={`Copier ${label.toLowerCase()}`}
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}

export default function Talents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TalentType | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('talentsViewMode');
    return (saved as ViewMode) || 'table';
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('talentsViewMode', viewMode);
  }, [viewMode]);

  const { data: talents } = trpc.musicians.listWithStats.useQuery(
    selectedType === "all" ? undefined : { talentType: selectedType }
  );

  const { data: stats } = trpc.musicians.getStats.useQuery();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const talentTypeBadgeVariant = (type: TalentType) => {
    switch(type) {
      case TALENT_TYPES.MUSICIAN: return 'default';
      case TALENT_TYPES.ACTOR: return 'secondary';
      default: return 'outline';
    }
  };

  // Client-side search filter
  const filteredTalents = talents?.filter((talent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      talent.name?.toLowerCase().includes(query) ||
      talent.stageName?.toLowerCase().includes(query) ||
      talent.email?.toLowerCase().includes(query) ||
      talent.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            Talents
          </h2>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div>
        <Tabs value={selectedType} onValueChange={(val) => setSelectedType(val as TalentType | "all")}>
          <TabsList>
            <TabsTrigger value="all">
              Tous ({talents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value={TALENT_TYPES.MUSICIAN}>
              {TALENT_TYPE_LABELS[TALENT_TYPES.MUSICIAN]}
            </TabsTrigger>
            <TabsTrigger value={TALENT_TYPES.ACTOR}>
              {TALENT_TYPE_LABELS[TALENT_TYPES.ACTOR]}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Total talents</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Performers VIP</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {stats.vipPerformers}
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Total crédits</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCredits}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-sm">Dernière activité</CardDescription>
              <CardTitle className="text-lg">
                {stats.lastActivityDate ?
                  format(new Date(stats.lastActivityDate), "dd MMM yyyy", { locale: fr })
                  : "Jamais"
                }
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Recherche */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recherche</CardTitle>
          <CardDescription className="text-sm">Filtrer les talents par nom, email ou téléphone</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Rechercher</Label>
              <Input
                placeholder="Nom, nom de scène, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des talents */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Liste des talents</CardTitle>
              <CardDescription className="text-sm">Gérez votre base de données de talents</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <Columns className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table View */}
          {viewMode === 'table' && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-start gap-1 whitespace-nowrap">
                      Nom
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('talentType')}
                  >
                    <div className="flex items-center justify-start gap-1 whitespace-nowrap">
                      Type de talent
                      {sortField === 'talentType' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Instruments / Genres</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('credits')}
                  >
                    <div className="flex items-center justify-start gap-1 whitespace-nowrap">
                      Crédits
                      {sortField === 'credits' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center justify-start gap-1 whitespace-nowrap">
                      Dernière mise à jour
                      {sortField === 'updatedAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTalents?.map((talent) => (
                  <TableRow key={talent.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {talent.name}
                          {talent.creditsCount > 10 && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {talent.stageName && (
                          <div className="text-sm text-muted-foreground">{talent.stageName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={talentTypeBadgeVariant(talent.talentType as TalentType)}>
                        {TALENT_TYPE_LABELS[talent.talentType as TalentType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {talent.instruments && (
                          <div className="flex items-center gap-2">
                            <Music className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {(() => {
                                try {
                                  const parsed = JSON.parse(talent.instruments);
                                  return Array.isArray(parsed) ? parsed.join(", ") : talent.instruments;
                                } catch {
                                  return talent.instruments;
                                }
                              })()}
                            </span>
                          </div>
                        )}
                        {talent.genres && (
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              try {
                                const parsed = JSON.parse(talent.genres);
                                return Array.isArray(parsed) ? parsed.join(", ") : talent.genres;
                              } catch {
                                return talent.genres;
                              }
                            })()}
                          </div>
                        )}
                        {!talent.instruments && !talent.genres && "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {talent.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${talent.email}`} className="hover:underline">
                              {talent.email}
                            </a>
                            <CopyButton text={talent.email} label="Email" />
                          </div>
                        )}
                        {talent.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${talent.phone}`} className="hover:underline">
                              {talent.phone}
                            </a>
                            <CopyButton text={talent.phone} label="Téléphone" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{talent.creditsCount}</div>
                    </TableCell>
                    <TableCell>
                      {talent.updatedAt ? (
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(talent.updatedAt), "dd MMM yyyy", { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/talents/${talent.id}?edit=true`}>
                            <Pencil className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/talents/${talent.id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredTalents || filteredTalents.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6"
                    >
                      <p className="text-sm text-muted-foreground">Aucun talent trouvé</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTalents?.map((talent) => (
                <Card key={talent.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                  <CardHeader className="pb-3 pt-2 px-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {/* Prominent avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={talent.imageUrl ?? undefined} />
                          <AvatarFallback className="text-sm font-semibold">
                            {getInitials(talent.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="truncate">{talent.name}</span>
                            {talent.creditsCount > 10 && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </CardTitle>
                          {talent.stageName && (
                            <CardDescription className="text-sm truncate">
                              {talent.stageName}
                            </CardDescription>
                          )}
                        </div>
                      </div>

                      {/* Type badge */}
                      <div>
                        <Badge variant="outline" className="text-xs w-fit">
                          {TALENT_TYPE_LABELS[talent.talentType as TalentType]}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 pb-2 px-2">
                    <div className="flex-1 space-y-3">
                      {/* Contact info */}
                      {talent.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <a href={`tel:${talent.phone}`} className="hover:underline truncate">
                            {talent.phone}
                          </a>
                          <CopyButton text={talent.phone} label="Téléphone" />
                        </div>
                      )}
                      {talent.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <a href={`mailto:${talent.email}`} className="hover:underline truncate">
                            {talent.email}
                          </a>
                          <CopyButton text={talent.email} label="Email" />
                        </div>
                      )}

                      {/* Stats badges */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {talent.creditsCount} crédits
                        </Badge>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-4 mt-auto">
                      <Button variant="ghost" size="sm" className="flex-1" asChild>
                        <Link to={`/talents/${talent.id}?edit=true`}>
                          <Pencil className="h-3 w-3 mr-1" /> Modifier
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1" asChild>
                        <Link to={`/talents/${talent.id}`}>
                          <Eye className="h-3 w-3 mr-1" /> Voir
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {/* Musicians Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Musiciens
                  </h3>
                  <Badge variant="secondary">
                    {filteredTalents?.filter(t => t.talentType === 'musician').length || 0}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {filteredTalents
                    ?.filter(t => t.talentType === 'musician')
                    .map((talent) => (
                      <Card key={talent.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={talent.imageUrl ?? undefined} />
                              <AvatarFallback className="text-xs font-semibold">
                                {getInitials(talent.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="truncate">{talent.name}</span>
                                {talent.creditsCount > 10 && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                )}
                              </CardTitle>
                              {talent.stageName && (
                                <CardDescription className="text-xs truncate">
                                  {talent.stageName}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-2 pb-2 space-y-3">
                          {/* Full contact section */}
                          <div className="space-y-1 text-xs">
                            {talent.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <a href={`tel:${talent.phone}`} className="hover:underline">
                                  {talent.phone}
                                </a>
                                <CopyButton text={talent.phone} label="Téléphone" />
                              </div>
                            )}
                            {talent.email && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <a href={`mailto:${talent.email}`} className="hover:underline truncate">
                                  {talent.email}
                                </a>
                                <CopyButton text={talent.email} label="Email" />
                              </div>
                            )}
                            {talent.website && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <a href={talent.website} target="_blank" rel="noopener" className="hover:underline truncate">
                                  Site web
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Instruments/Genres */}
                          {(talent.instruments || talent.genres) && (
                            <div className="border-t pt-2 space-y-1 text-xs">
                              {talent.instruments && (
                                <div className="text-muted-foreground">
                                  <strong>Instruments:</strong> {
                                    (() => {
                                      try {
                                        const parsed = JSON.parse(talent.instruments);
                                        return Array.isArray(parsed) ? parsed.join(", ") : talent.instruments;
                                      } catch { return talent.instruments; }
                                    })()
                                  }
                                </div>
                              )}
                              {talent.genres && (
                                <div className="text-muted-foreground">
                                  <strong>Genres:</strong> {
                                    (() => {
                                      try {
                                        const parsed = JSON.parse(talent.genres);
                                        return Array.isArray(parsed) ? parsed.join(", ") : talent.genres;
                                      } catch { return talent.genres; }
                                    })()
                                  }
                                </div>
                              )}
                            </div>
                          )}

                          {/* Workflow indicators */}
                          <div className="space-y-2 text-xs border-t pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Track crédits:</span>
                              <span className="font-medium">{talent.creditsCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Dernière mise à jour:</span>
                              <span className="font-medium">
                                {talent.updatedAt ?
                                  format(new Date(talent.updatedAt), "dd MMM yyyy", { locale: fr })
                                  : "-"
                                }
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button variant="ghost" size="sm" className="flex-1" asChild>
                              <Link to={`/talents/${talent.id}?edit=true`}>
                                <Pencil className="h-3 w-3 mr-1" /> Modifier
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1" asChild>
                              <Link to={`/talents/${talent.id}`}>
                                <Eye className="h-3 w-3 mr-1" /> Voir détails
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {filteredTalents?.filter(t => t.talentType === 'musician').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun musicien
                    </p>
                  )}
                </div>
              </div>

              {/* Actors Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Acteurs
                  </h3>
                  <Badge variant="secondary">
                    {filteredTalents?.filter(t => t.talentType === 'actor').length || 0}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {filteredTalents
                    ?.filter(t => t.talentType === 'actor')
                    .map((talent) => (
                      <Card key={talent.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={talent.imageUrl ?? undefined} />
                              <AvatarFallback className="text-xs font-semibold">
                                {getInitials(talent.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="truncate">{talent.name}</span>
                                {talent.creditsCount > 10 && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                )}
                              </CardTitle>
                              {talent.stageName && (
                                <CardDescription className="text-xs truncate">
                                  {talent.stageName}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-2 pb-2 space-y-3">
                          {/* Full contact section */}
                          <div className="space-y-1 text-xs">
                            {talent.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <a href={`tel:${talent.phone}`} className="hover:underline">
                                  {talent.phone}
                                </a>
                                <CopyButton text={talent.phone} label="Téléphone" />
                              </div>
                            )}
                            {talent.email && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <a href={`mailto:${talent.email}`} className="hover:underline truncate">
                                  {talent.email}
                                </a>
                                <CopyButton text={talent.email} label="Email" />
                              </div>
                            )}
                            {talent.website && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <a href={talent.website} target="_blank" rel="noopener" className="hover:underline truncate">
                                  Site web
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Instruments/Genres */}
                          {(talent.instruments || talent.genres) && (
                            <div className="border-t pt-2 space-y-1 text-xs">
                              {talent.instruments && (
                                <div className="text-muted-foreground">
                                  <strong>Instruments:</strong> {
                                    (() => {
                                      try {
                                        const parsed = JSON.parse(talent.instruments);
                                        return Array.isArray(parsed) ? parsed.join(", ") : talent.instruments;
                                      } catch { return talent.instruments; }
                                    })()
                                  }
                                </div>
                              )}
                              {talent.genres && (
                                <div className="text-muted-foreground">
                                  <strong>Genres:</strong> {
                                    (() => {
                                      try {
                                        const parsed = JSON.parse(talent.genres);
                                        return Array.isArray(parsed) ? parsed.join(", ") : talent.genres;
                                      } catch { return talent.genres; }
                                    })()
                                  }
                                </div>
                              )}
                            </div>
                          )}

                          {/* Workflow indicators */}
                          <div className="space-y-2 text-xs border-t pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Track crédits:</span>
                              <span className="font-medium">{talent.creditsCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Dernière mise à jour:</span>
                              <span className="font-medium">
                                {talent.updatedAt ?
                                  format(new Date(talent.updatedAt), "dd MMM yyyy", { locale: fr })
                                  : "-"
                                }
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button variant="ghost" size="sm" className="flex-1" asChild>
                              <Link to={`/talents/${talent.id}?edit=true`}>
                                <Pencil className="h-3 w-3 mr-1" /> Modifier
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1" asChild>
                              <Link to={`/talents/${talent.id}`}>
                                <Eye className="h-3 w-3 mr-1" /> Voir détails
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {filteredTalents?.filter(t => t.talentType === 'actor').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun acteur
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
