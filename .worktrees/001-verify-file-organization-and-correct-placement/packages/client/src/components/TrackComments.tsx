import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Check,
  RotateCcw,
  Edit2,
  Trash2,
  Clock,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface TrackCommentsProps {
  trackId: number;
  versionType: 'demo' | 'roughMix' | 'finalMix' | 'master';
  onJumpToTimestamp?: (timestamp: number) => void;
  newCommentTimestamp?: number | null;
}

export function TrackComments({ trackId, versionType, onJumpToTimestamp, newCommentTimestamp: externalTimestamp }: TrackCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [newCommentTimestamp, setNewCommentTimestamp] = useState<number | null>(null);

  // Sync external timestamp from WaveformPlayer
  useEffect(() => {
    if (externalTimestamp !== null && externalTimestamp !== undefined) {
      setNewCommentTimestamp(externalTimestamp);
    }
  }, [externalTimestamp]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const utils = trpc.useUtils();

  // Queries
  const { data: comments = [], isLoading } = trpc.projects.trackComments.list.useQuery({
    trackId,
    versionType,
  });

  // Mutations
  const createMutation = trpc.projects.trackComments.create.useMutation({
    onSuccess: () => {
      utils.projects.trackComments.list.invalidate({ trackId, versionType });
      setNewComment('');
      setNewCommentTimestamp(null);
      toast.success('Commentaire ajouté');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = trpc.projects.trackComments.update.useMutation({
    onSuccess: () => {
      utils.projects.trackComments.list.invalidate({ trackId, versionType });
      setEditingId(null);
      setEditContent('');
      toast.success('Commentaire modifié');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resolveMutation = trpc.projects.trackComments.resolve.useMutation({
    onSuccess: () => {
      utils.projects.trackComments.list.invalidate({ trackId, versionType });
      toast.success('Commentaire résolu');
    },
  });

  const reopenMutation = trpc.projects.trackComments.reopen.useMutation({
    onSuccess: () => {
      utils.projects.trackComments.list.invalidate({ trackId, versionType });
      toast.success('Commentaire rouvert');
    },
  });

  const deleteMutation = trpc.projects.trackComments.delete.useMutation({
    onSuccess: () => {
      utils.projects.trackComments.list.invalidate({ trackId, versionType });
      toast.success('Commentaire supprimé');
    },
  });

  const handleCreateComment = () => {
    if (!newComment.trim() || newCommentTimestamp === null) {
      toast.error('Veuillez saisir un commentaire et sélectionner un timestamp');
      return;
    }

    createMutation.mutate({
      trackId,
      versionType,
      content: newComment,
      timestamp: newCommentTimestamp,
    });
  };

  const handleUpdateComment = (id: number) => {
    if (!editContent.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    updateMutation.mutate({ id, content: editContent });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string): number => {
    return parseFloat(timestamp);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Chargement des commentaires...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          <span>Nouveau commentaire</span>
        </div>
        <Textarea
          placeholder="Écrivez votre commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {newCommentTimestamp !== null ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Timestamp: {formatTime(newCommentTimestamp)}
              </span>
            ) : (
              <span>Utilisez le bouton "Add at..." sur le player</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleCreateComment}
            disabled={createMutation.isPending || !newComment.trim() || newCommentTimestamp === null}
          >
            {createMutation.isPending ? 'Envoi...' : 'Commenter'}
          </Button>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        <div className="text-sm font-medium">
          Commentaires ({comments.length})
        </div>

        {comments.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Aucun commentaire pour cette version.
            <br />
            Utilisez le player pour ajouter des commentaires à des moments précis.
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => onJumpToTimestamp && onJumpToTimestamp(formatTimestamp(comment.timestamp))}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(formatTimestamp(comment.timestamp))}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {comment.authorName}
                  </div>
                  {comment.status === 'resolved' && (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Résolu
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: fr
                  })}
                  {comment.isEdited && ' (modifié)'}
                </div>
              </div>

              {/* Content */}
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={updateMutation.isPending}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              )}

              {/* Actions */}
              {editingId !== comment.id && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  {comment.status === 'open' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveMutation.mutate({ id: comment.id })}
                      disabled={resolveMutation.isPending}
                      className="h-7 px-2 text-xs text-green-600 hover:text-green-700"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Résoudre
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => reopenMutation.mutate({ id: comment.id })}
                      disabled={reopenMutation.isPending}
                      className="h-7 px-2 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rouvrir
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Supprimer ce commentaire ?')) {
                        deleteMutation.mutate({ id: comment.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Hook to expose setNewCommentTimestamp to parent
export function useTrackComments() {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  return {
    timestamp,
    setTimestamp,
  };
}
