import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Music,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileUpload } from '@/components/projects/FileUpload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const STATUS_COLORS: Record<string, string> = {
  pre_production: 'bg-blue-100 text-blue-800',
  recording: 'bg-purple-100 text-purple-800',
  mixing: 'bg-orange-100 text-orange-800',
  mastering: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pre_production: 'Pre-Production',
  recording: 'Recording',
  mixing: 'Mixing',
  mastering: 'Mastering',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

const TRACK_STATUS_COLORS: Record<string, string> = {
  writing: 'bg-gray-100 text-gray-800',
  pre_production: 'bg-blue-100 text-blue-800',
  recording: 'bg-purple-100 text-purple-800',
  editing: 'bg-indigo-100 text-indigo-800',
  mixing: 'bg-orange-100 text-orange-800',
  mastering: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

const TYPE_LABELS: Record<string, string> = {
  album: 'Album',
  ep: 'EP',
  single: 'Single',
  compilation: 'Compilation',
  soundtrack: 'Soundtrack',
  other: 'Other',
};

interface Track {
  id: number;
  title: string;
  trackNumber: number | null;
  duration: number | null;
  status: string;
  bpm: number | null;
  key: string | null;
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || '0');
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [deletingTrackId, setDeletingTrackId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Fetch project details
  const { data: project, isLoading } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );

  // Fetch file stats
  const { data: fileStats } = trpc.files.stats.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  // Delete track mutation
  const deleteTrackMutation = trpc.projects.deleteTrack.useMutation({
    onSuccess: () => {
      toast.success('Track deleted');
      utils.projects.get.invalidate({ id: projectId });
      setDeletingTrackId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteTrack = () => {
    if (deletingTrackId) {
      deleteTrackMutation.mutate({ id: deletingTrackId });
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Button variant="link" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const budgetUsedPercent = project.budget && project.spentAmount
    ? (parseFloat(project.spentAmount) / parseFloat(project.budget)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge className={STATUS_COLORS[project.status]}>
                {STATUS_LABELS[project.status] || project.status}
              </Badge>
            </div>
            <p className="text-gray-500">
              {project.clientArtistName || project.clientName} • {TYPE_LABELS[project.projectType]} {project.genre && `• ${project.genre}`}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/projects/${projectId}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tracks</CardTitle>
            <Music className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.tracks?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {project.tracks?.filter((t: Track) => t.status === 'completed').length || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.credits?.length || 0}</div>
            <p className="text-xs text-muted-foreground">contributors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${project.spentAmount || '0'} / ${project.budget || '0'}
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${budgetUsedPercent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <Music className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileStats?.totalFiles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {fileStats?.byType?.audio || 0} audio files
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tracks" className="w-full">
        <TabsList>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Tracks ({project.tracks?.length || 0})</h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Track
            </Button>
          </div>

          {project.tracks && project.tracks.length > 0 ? (
            <div className="space-y-2">
              {project.tracks.map((track: Track) => (
                <Card key={track.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                          {track.trackNumber || '-'}
                        </div>
                        <div>
                          <p className="font-medium">{track.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatDuration(track.duration)}</span>
                            {track.bpm && <span>• {track.bpm} BPM</span>}
                            {track.key && <span>• {track.key}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={TRACK_STATUS_COLORS[track.status]}>
                          {track.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTrackId(track.id)}
                        >
                          Files
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTrackId(track.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Track Files (expanded) */}
                    {selectedTrackId === track.id && (
                      <div className="mt-4 pt-4 border-t">
                        <FileUpload
                          projectId={projectId}
                          trackId={track.id}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tracks yet</p>
                <p className="text-sm">Add tracks to organize your project</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <FileUpload projectId={projectId} />
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Credits ({project.credits?.length || 0})</h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Credit
            </Button>
          </div>

          {project.credits && project.credits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.credits.map((credit) => (
                <Card key={credit.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{credit.musicianName || credit.musicianStageName || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{credit.role}</p>
                      {credit.trackId && (
                        <p className="text-xs text-gray-400">Track credit</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No credits yet</p>
                <p className="text-sm">Add musicians and their roles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{project.clientArtistName || project.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{TYPE_LABELS[project.projectType]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Genre</p>
                  <p className="font-medium">{project.genre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={STATUS_COLORS[project.status]}>
                    {STATUS_LABELS[project.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {project.startDate
                      ? format(new Date(project.startDate), 'MMM d, yyyy')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target End Date</p>
                  <p className="font-medium">
                    {project.targetEndDate
                      ? format(new Date(project.targetEndDate), 'MMM d, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>

              {project.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1">{project.description}</p>
                </div>
              )}

              {project.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="mt-1">{project.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Track Confirmation */}
      <ConfirmDialog
        open={!!deletingTrackId}
        onOpenChange={(open) => !open && setDeletingTrackId(null)}
        title="Delete Track"
        description="Are you sure you want to delete this track? All associated files will also be deleted."
        confirmLabel="Delete"
        onConfirm={handleDeleteTrack}
        variant="danger"
        isLoading={deleteTrackMutation.isPending}
      />
    </div>
  );
}
