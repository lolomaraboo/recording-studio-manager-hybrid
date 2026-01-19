import { useState, useEffect } from 'react';
import { Link } from 'wouter';
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
import { ListMusic, LayoutGrid, Table2, Music } from 'lucide-react';

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

export function TracksTab({ clientId }: TracksTabProps) {
  // State for view mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('tracks-view-mode');
    return (saved as ViewMode) || 'liste';
  });

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('tracks-view-mode', viewMode);
  }, [viewMode]);

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
        <Link href={`/tracks/new?clientId=${clientId}`}>
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
      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={viewMode === 'liste' ? 'default' : 'outline'}
          onClick={() => setViewMode('liste')}
        >
          <ListMusic className="h-4 w-4 mr-2" />
          Liste
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'cards' ? 'default' : 'outline'}
          onClick={() => setViewMode('cards')}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Cards
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
        >
          <Table2 className="h-4 w-4 mr-2" />
          Table
        </Button>
      </div>

      {/* Mode 1: Liste avec audio player (default) */}
      {viewMode === 'liste' && (
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
                <Link href={`/tracks/${track.id}`}>
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
      {viewMode === 'cards' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <Card key={track.id} className="p-4 space-y-3">
              {/* Artwork placeholder (would use track.coverUrl if available) */}
              <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                <Music className="h-12 w-12 text-muted-foreground" />
              </div>

              {/* Title */}
              <Link href={`/tracks/${track.id}`}>
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
      {viewMode === 'table' && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Artistes</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell className="font-medium">
                    <Link href={`/tracks/${track.id}`}>
                      <span className="hover:underline cursor-pointer">
                        {track.title}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{track.projectTitle}</TableCell>
                  <TableCell>{track.composer || 'Inconnu'}</TableCell>
                  <TableCell>{formatDuration(track.duration)}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[track.status] || 'bg-gray-500'}>
                      {STATUS_LABELS[track.status] || track.status}
                    </Badge>
                  </TableCell>
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
                  <TableCell>
                    <Link href={`/tracks/${track.id}`}>
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
