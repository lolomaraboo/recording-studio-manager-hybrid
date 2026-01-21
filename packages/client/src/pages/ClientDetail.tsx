import { useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Guitar,
  Music,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("informations");
  const [formData, setFormData] = useState<any>(null);

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

  // Fetch client with contacts for enriched info
  const { data: clientWithContacts } = trpc.clients.getWithContacts.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch companies for individuals
  const { data: companies = [] } = trpc.clients.getCompanies.useQuery(
    { memberId: Number(id) },
    { enabled: !!id && client?.type === 'individual' }
  );

  // Initialize formData when client loads
  if (client && !formData) {
    setFormData(client);
  }

  // Mutations
  const updateMutation = trpc.clients.update.useMutation();

  const addContactMutation = trpc.clients.addContact.useMutation({
    onSuccess: () => {
      toast.success("Contact ajouté");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteContactMutation = trpc.clients.deleteContact.useMutation({
    onSuccess: () => {
      toast.success("Contact supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

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

  // Handle field updates in tabs
  const handleUpdateField = (updates: any) => {
    const updatedData = { ...formData, ...updates };
    setFormData(updatedData);
    updateMutation.mutate(
      { id: Number(id), data: updates },
      {
        onSuccess: () => {
          toast.success("Modification enregistrée");
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
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <Button variant="ghost" size="icon" asChild className="mt-1">
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-24 w-24 flex-shrink-0">
                <AvatarImage
                  src={(client.type === 'company' ? client.logoUrl : client.avatarUrl) || undefined}
                  alt={client.name}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1 min-w-0">
                <h2 className="text-4xl font-bold leading-tight">
                  {client.type === 'individual' && client.artistName
                    ? client.artistName
                    : client.name}
                </h2>
                {/* Companies for individuals */}
                {client.type === 'individual' && companies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {companies.map((item: any) => (
                      <Link
                        key={item.companyId}
                        to={`/clients/${item.companyId}`}
                      >
                        <Badge variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80 transition-colors">
                          {item.isPrimary && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          {item.company?.name || "Inconnu"}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
                {/* Instruments */}
                {(client.instruments || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(client.instruments || []).map((instrument: string, idx: number) => (
                      <Badge key={`inst-${idx}`} variant="outline" className="flex items-center gap-1">
                        <Guitar className="h-3 w-3" />
                        {instrument}
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Genres */}
                {(client.genres || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(client.genres || []).map((genre: string, idx: number) => (
                      <Badge key={`genre-${idx}`} variant="outline" className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Edit/Delete buttons - only show when NOT editing */}
          {!isEditing && (
            <div className="flex flex-col gap-2 flex-shrink-0">
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
            initialData={client as any}
            onSubmit={handleUpdate}
            onCancel={() => toggleEditMode(false)}
          />
        ) : (
          <ClientDetailTabs
            clientId={client.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            client={client}
            isEditing={false}
            formData={formData || client}
            setFormData={setFormData}
            handleUpdateField={handleUpdateField}
            clientWithContacts={clientWithContacts}
            addContactMutation={addContactMutation}
            deleteContactMutation={deleteContactMutation}
          />
        )}

        {/* Notes Section - ALWAYS VISIBLE */}
        <Card className="mt-2">
          <CardContent className="p-2">
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
