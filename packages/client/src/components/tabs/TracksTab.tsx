import { Link } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ListMusic, LayoutGrid, Table2, Music, Settings } from 'lucide-react';
import { useTabPreferences } from '@/hooks/useTabPreferences';

interface TracksTabProps {
  clientId: number;
}

type ViewMode = 'liste' | 'cards' | 'table';

const STATUS_LABELS: Record<string, string> = {
  recording: 'Enregistrement',
  editing: 'Édition',
  mixing: 'Mixage',
  mastering: 'Mastering',
  completed: 'Terminé',
};

const STATUS_COLORS: Record<string, string> = {
  recording: 'bg-blue-500',
  editing: 'bg-yellow-500',
  mixing: 'bg-orange-500',
  mastering: 'bg-purple-500',
  completed: 'bg-green-500',
};

const ALL_COLUMNS = ["titre", "projet", "artistes", "durée", "statut", "version"];

export function TracksTab({ clientId }: TracksTabProps) {
  // Use preferences hook for database-backed state
  const { preferences, updatePreferences, resetPreferences } = useTabPreferences(
    "client-detail-tracks",
    {
      viewMode: "liste",
      visibleColumns: ["titre", "projet", "artistes", "durée", "statut", "version"],
      columnOrder: ["titre", "projet", "artistes", "durée", "statut", "version"],
    }
  );

  // Query tracks
  const { data: tracks = [], isLoading } = trpc.clients.getTracks.useQuery({
    clientId,
  });

  // Helper to format duration (seconds to MM:SS)
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Empty state
  if (!isLoading && tracks.length === 0) {
    return (
      <div className="py-12 text-center">
        <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Aucune track pour ce client</p>
        <Link to={`/tracks/new?clientId=${clientId}`}>
          <Button>Créer une track</Button>
        </Link>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Chargement des tracks...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View mode toggle & Customization */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={preferences.viewMode === 'liste' ? 'default' : 'outline'}
          onClick={() => updatePreferences({ viewMode: 'liste' })}
        >
          <ListMusic className="h-4 w-4 mr-2" />
          Liste
        </Button>
        <Button
          size="sm"
          variant={preferences.viewMode === 'cards' ? 'default' : 'outline'}
          onClick={() => updatePreferences({ viewMode: 'cards' })}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Cards
        </Button>
        <Button
          size="sm"
          variant={preferences.viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => updatePreferences({ viewMode: 'table' })}
        >
          <Table2 className="h-4 w-4 mr-2" />
          Table
        </Button>

        {/* Customization Dropdown (for Table mode) */}
        {preferences.viewMode === "table" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Personnaliser
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={preferences.visibleColumns.includes(col)}
                  onCheckedChange={(checked) => {
                    const updated = checked
                      ? [...preferences.visibleColumns, col]
                      : preferences.visibleColumns.filter((c) => c !== col);
                    updatePreferences({ visibleColumns: updated });
                  }}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetPreferences}>
                Réinitialiser
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mode 1: Liste avec audio player (default) */}
      {preferences.viewMode === 'liste' && (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="border rounded-lg p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
            >
              {/* Audio player (compact mode) */}
              {track.fileUrl && (
                <div className="flex-shrink-0">
                  <AudioPlayer
                    src={track.fileUrl}
                    compact={true}
                    showTime={false}
                    showVolume={false}
                    className="w-[200px]"
                  />
                </div>
              )}

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <Link to={`/tracks/${track.id}`}>
                  <p className="font-medium hover:underline cursor-pointer truncate">
                    {track.title}
                  </p>
                </Link>
                <p className="text-sm text-muted-foreground truncate">
                  {track.projectTitle} • {track.composer || 'Artiste inconnu'} •{' '}
                  {formatDuration(track.duration)}
                </p>
              </div>

              {/* Status badge */}
              <div className="flex-shrink-0">
                <Badge className={STATUS_COLORS[track.status] || 'bg-gray-500'}>
                  {STATUS_LABELS[track.status] || track.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode 2: Cards visuelles */}
      {preferences.viewMode === 'cards' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <Card key={track.id} className="p-4 space-y-3">
              {/* Artwork placeholder (would use track.coverUrl if available) */}
              <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                <Music className="h-12 w-12 text-muted-foreground" />
              </div>

              {/* Title */}
              <Link to={`/tracks/${track.id}`}>
                <h3 className="font-medium hover:underline cursor-pointer truncate">
                  {track.title}
                </h3>
              </Link>

              {/* Artists */}
              <p className="text-sm text-muted-foreground truncate">
                {track.composer || 'Artiste inconnu'}
              </p>

              {/* Duration and status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatDuration(track.duration)}
                </span>
                <Badge className={STATUS_COLORS[track.status] || 'bg-gray-500'}>
                  {STATUS_LABELS[track.status] || track.status}
                </Badge>
              </div>

              {/* Audio player */}
              {track.fileUrl && (
                <AudioPlayer
                  src={track.fileUrl}
                  compact={true}
                  showTime={true}
                  showVolume={false}
                />
              )}

              {/* Project parent link */}
              <p className="text-xs text-muted-foreground truncate">
                Projet: {track.projectTitle}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Mode 3: Table simple (metadata) */}
      {preferences.viewMode === 'table' && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {preferences.visibleColumns.includes("titre") && <TableHead>Titre</TableHead>}
                {preferences.visibleColumns.includes("projet") && <TableHead>Projet</TableHead>}
                {preferences.visibleColumns.includes("artistes") && <TableHead>Artistes</TableHead>}
                {preferences.visibleColumns.includes("durée") && <TableHead>Durée</TableHead>}
                {preferences.visibleColumns.includes("statut") && <TableHead>Statut</TableHead>}
                {preferences.visibleColumns.includes("version") && <TableHead>Version</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.id}>
                  {preferences.visibleColumns.includes("titre") && (
                    <TableCell className="font-medium">
                      <Link to={`/tracks/${track.id}`}>
                        <span className="hover:underline cursor-pointer">
                          {track.title}
                        </span>
                      </Link>
                    </TableCell>
                  )}
                  {preferences.visibleColumns.includes("projet") && <TableCell>{track.projectTitle}</TableCell>}
                  {preferences.visibleColumns.includes("artistes") && <TableCell>{track.composer || 'Inconnu'}</TableCell>}
                  {preferences.visibleColumns.includes("durée") && <TableCell>{formatDuration(track.duration)}</TableCell>}
                  {preferences.visibleColumns.includes("statut") && (
                    <TableCell>
                      <Badge className={STATUS_COLORS[track.status] || 'bg-gray-500'}>
                        {STATUS_LABELS[track.status] || track.status}
                      </Badge>
                    </TableCell>
                  )}
                  {preferences.visibleColumns.includes("version") && (
                    <TableCell>
                      <div className="flex gap-1 text-xs">
                        {track.demoUrl && (
                          <Badge variant="outline" className="text-xs">
                            Demo
                          </Badge>
                        )}
                        {track.roughMixUrl && (
                          <Badge variant="outline" className="text-xs">
                            Rough
                          </Badge>
                        )}
                        {track.finalMixUrl && (
                          <Badge variant="outline" className="text-xs">
                            Final
                          </Badge>
                        )}
                        {track.masterUrl && (
                          <Badge variant="outline" className="text-xs">
                            Master
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Link to={`/tracks/${track.id}`}>
                      <Button size="sm" variant="ghost">
                        Voir
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
