import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotesHistoryProps {
  clientId: number;
  className?: string;
}

export function NotesHistory({ clientId, className }: NotesHistoryProps) {
  const [newNote, setNewNote] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: notes = [], isLoading, error } = trpc.clientNotes.list.useQuery({ clientId });

  // Mutations
  const createNote = trpc.clientNotes.create.useMutation({
    onSuccess: () => {
      utils.clientNotes.list.invalidate({ clientId });
      setNewNote('');
      toast.success('Note ajoutée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteNote = trpc.clientNotes.delete.useMutation({
    onSuccess: () => {
      utils.clientNotes.list.invalidate({ clientId });
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      toast.success('Note supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleCreateNote = () => {
    if (!newNote.trim()) {
      toast.error('Veuillez saisir une note');
      return;
    }

    createNote.mutate({
      clientId,
      note: newNote,
    });
  };

  const handleDeleteClick = (noteId: number) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (noteToDelete !== null) {
      deleteNote.mutate({ id: noteToDelete });
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-destructive">
        Erreur lors du chargement des notes: {error.message}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Note Form */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            <span>Nouvelle note</span>
          </div>
          <Textarea
            placeholder="Écrivez une note sur ce client..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleCreateNote}
              disabled={createNote.isPending || !newNote.trim()}
            >
              {createNote.isPending ? 'Ajout...' : 'Ajouter une note'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Timeline */}
      <div className="space-y-3">
        <div className="text-sm font-medium">
          Historique ({notes.length} {notes.length > 1 ? 'notes' : 'note'})
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : notes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucune note pour ce client.
              <br />
              Ajoutez une note ci-dessus pour commencer l'historique.
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-3 max-h-[600px] overflow-y-auto">
            {/* Timeline connector line */}
            <div className="absolute left-4 top-6 bottom-6 w-px bg-border hidden sm:block" />

            {notes.map((note) => (
              <Card key={note.id} className="relative">
                <CardContent className="p-4 space-y-2">
                  {/* Timeline dot */}
                  <div className="absolute left-[11px] top-6 h-3 w-3 rounded-full bg-primary border-2 border-background hidden sm:block" />

                  {/* Note header */}
                  <div className="flex items-start justify-between gap-2 sm:pl-8">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(note.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      <span className="text-muted-foreground/60">
                        ({new Date(note.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(note.id)}
                      disabled={deleteNote.isPending}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Note content */}
                  <p className="text-sm whitespace-pre-wrap sm:pl-8">{note.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette note ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La note sera définitivement supprimée de l'historique.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setNoteToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
