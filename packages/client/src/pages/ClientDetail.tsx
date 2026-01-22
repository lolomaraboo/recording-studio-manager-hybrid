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
import { ClientEditForm } from "@/components/ClientEditForm";
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

  // Fetch members for companies
  const { data: members = [] } = trpc.clients.getMembers.useQuery(
    { companyId: Number(id) },
    { enabled: !!id && client?.type === 'company' }
  );

  // Initialize formData when client loads
  if (client && !formData) {
    // Map flat address fields to addresses array for the edit form
    const addresses = [];
    if (client.street || client.city || client.postalCode || client.region || client.country) {
      addresses.push({
        type: "home",
        street: client.street || "",
        city: client.city || "",
        postalCode: client.postalCode || "",
        country: client.country || ""
      });
    }
    setFormData({
      ...client,
      addresses
    });
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

  // Helper to convert null to empty strings for backend validation (recursively)
  const sanitizeFormData = (data: any): any => {
    if (data === null) {
      return "";
    }

    if (Array.isArray(data)) {
      return data.map(item => sanitizeFormData(item));
    }

    if (typeof data === "object" && data !== null) {
      const sanitized: any = {};
      Object.keys(data).forEach(key => {
        sanitized[key] = sanitizeFormData(data[key]);
      });
      return sanitized;
    }

    return data;
  };

  // Handle update from wizard
  const handleUpdate = (data: any) => {
    // Map addresses array back to flat fields for database
    const dataToSave = { ...data };
    if (data.addresses && data.addresses.length > 0) {
      const addr = data.addresses[0]; // Use first address
      dataToSave.street = addr.street || "";
      dataToSave.city = addr.city || "";
      dataToSave.postalCode = addr.postalCode || "";
      dataToSave.country = addr.country || "";
      // Remove addresses array (not in DB schema)
      delete dataToSave.addresses;
    }

    const sanitizedData = sanitizeFormData(dataToSave);
    updateMutation.mutate(
      { id: Number(id), data: sanitizedData },
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

    // Map addresses array back to flat fields for database
    const updatesToSave = { ...updates };
    if (updates.addresses && updates.addresses.length > 0) {
      const addr = updates.addresses[0];
      updatesToSave.street = addr.street || "";
      updatesToSave.city = addr.city || "";
      updatesToSave.postalCode = addr.postalCode || "";
      updatesToSave.country = addr.country || "";
      delete updatesToSave.addresses;
    }

    const sanitizedUpdates = sanitizeFormData(updatesToSave);
    updateMutation.mutate(
      { id: Number(id), data: sanitizedUpdates },
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
                        key={item.company?.id}
                        to={`/clients/${item.company?.id}`}
                      >
                        <Badge variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80 transition-colors">
                          {item.isPrimary && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          <span>{item.company?.name || "Inconnu"}</span>
                          {item.role && (
                            <span className="text-xs text-muted-foreground ml-1">({item.role})</span>
                          )}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
                {/* Members for companies */}
                {client.type === 'company' && members.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {members.map((item: any) => (
                      <Link
                        key={item.member?.id}
                        to={`/clients/${item.member?.id}`}
                      >
                        <Badge variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80 transition-colors">
                          {item.isPrimary && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          <span>{item.member?.name || "Inconnu"}</span>
                          {item.role && (
                            <span className="text-xs text-muted-foreground ml-1">({item.role})</span>
                          )}
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

        {/* Edit mode: Sticky action buttons */}
        {isEditing && (
          <Card className="sticky top-2 z-10 bg-background/95 backdrop-blur">
            <CardContent className="py-3 px-4">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => toggleEditMode(false)}>
                  Annuler
                </Button>
                <Button onClick={() => handleUpdate(formData)}>
                  Enregistrer les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client detail tabs - same for view and edit modes */}
        <ClientDetailTabs
          clientId={client.id}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          client={client}
          isEditing={isEditing}
          formData={formData || client}
          setFormData={setFormData}
          handleUpdateField={handleUpdateField}
          clientWithContacts={clientWithContacts}
          addContactMutation={addContactMutation}
          deleteContactMutation={deleteContactMutation}
          companies={companies}
          members={members}
        />

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
