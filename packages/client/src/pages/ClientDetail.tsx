import { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { NotesHistory } from "@/components/NotesHistory";
import { ClientDetailTabs } from "@/components/ClientDetailTabs";
import { ClientFormWizard } from "@/components/ClientFormWizard";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("informations");

  // Helper to toggle edit mode and update URL
  const toggleEditMode = (editing: boolean) => {
    setIsEditing(editing);
    if (editing) {
      searchParams.set('edit', 'true');
    } else {
      searchParams.delete('edit');
    }
    setSearchParams(searchParams);
  };

  // Fetch client data
  const { data: client, isLoading, refetch } = trpc.clients.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const updateMutation = trpc.clients.update.useMutation();

  // Handle update from wizard
  const handleUpdate = (data: any) => {
    updateMutation.mutate(
      { id: Number(id), data },
      {
        onSuccess: () => {
          toast.success("Client mis à jour");
          toggleEditMode(false);
          refetch();
        },
        onError: (error) => {
          toast.error(`Erreur: ${error.message}`);
        },
      }
    );
  };

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client supprimé");
      navigate("/clients");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  if (isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold">Client introuvable</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Ce client n'existe pas ou a été supprimé.</p>
              <Button className="mt-4" asChild size="sm">
                <Link to="/clients">Retour aux clients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              {client.name}
            </h2>
          </div>
          {/* Edit/Delete buttons - only show when NOT editing */}
          {!isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleEditMode(true)} title="Modifier les informations du client">
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          )}
        </div>

        {/* Conditional rendering: Edit mode (wizard) vs View mode (tabs) */}
        {isEditing ? (
          <ClientFormWizard
            mode="edit"
            initialData={client}
            onSubmit={handleUpdate}
            onCancel={() => toggleEditMode(false)}
          />
        ) : (
          <ClientDetailTabs
            clientId={client.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Notes Section - ALWAYS VISIBLE */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Historique daté des notes sur le client</CardDescription>
          </CardHeader>
          <CardContent>
            <NotesHistory clientId={client.id} />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le client</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible et
              supprimera également toutes les sessions et factures associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
