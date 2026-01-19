import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Star,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

  // Fetch client with contacts (for vCard tab)
  const { data: clientWithContacts } = trpc.clients.getWithContacts.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client mis à jour");
      toggleEditMode(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client supprimé");
      navigate("/clients");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Contact mutations
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

  // Form state
  const [formData, setFormData] = useState({
    // Existing fields
    name: "",
    email: "",
    phone: "",
    artistName: "",
    address: "",

    // NEW vCard fields
    type: "individual" as "individual" | "company",
    firstName: "",
    lastName: "",
    middleName: "",
    prefix: "",
    suffix: "",
    avatarUrl: "",
    logoUrl: "",
    phones: [] as Array<{type: string; number: string}>,
    emails: [] as Array<{type: string; email: string}>,
    websites: [] as Array<{type: string; url: string}>,
    street: "",
    postalCode: "",
    region: "",
    birthday: "",
    gender: "",
    customFields: [] as Array<{label: string; type: string; value: any}>,

    // Music profile fields
    genres: [] as string[],
    instruments: [] as string[],
    spotifyUrl: "",
    appleMusicUrl: "",
    youtubeUrl: "",
    soundcloudUrl: "",
    bandcampUrl: "",
    deezerUrl: "",
    tidalUrl: "",
    amazonMusicUrl: "",
    audiomackUrl: "",
    beatportUrl: "",
    otherPlatformsUrl: "",
    recordLabel: "",
    distributor: "",
    managerContact: "",
    publisher: "",
    performanceRightsSociety: "",
    yearsActive: "",
    notableWorks: "",
    awardsRecognition: "",
    biography: "",
  });

  // Update form when client loads
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email || "",
        phone: client.phone || "",
        artistName: client.artistName || "",
        address: client.address || "",
        type: (client.type as "individual" | "company") || "individual",
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        middleName: client.middleName || "",
        prefix: client.prefix || "",
        suffix: client.suffix || "",
        avatarUrl: client.avatarUrl || "",
        logoUrl: client.logoUrl || "",
        phones: client.phones || [],
        emails: client.emails || [],
        websites: client.websites || [],
        street: client.street || "",
        postalCode: client.postalCode || "",
        region: client.region || "",
        birthday: client.birthday || "",
        gender: client.gender || "",
        customFields: client.customFields || [],
        // Music profile fields
        genres: (client as any).genres || [],
        instruments: (client as any).instruments || [],
        spotifyUrl: (client as any).spotifyUrl || "",
        appleMusicUrl: (client as any).appleMusicUrl || "",
        youtubeUrl: (client as any).youtubeUrl || "",
        soundcloudUrl: (client as any).soundcloudUrl || "",
        bandcampUrl: (client as any).bandcampUrl || "",
        deezerUrl: (client as any).deezerUrl || "",
        tidalUrl: (client as any).tidalUrl || "",
        amazonMusicUrl: (client as any).amazonMusicUrl || "",
        audiomackUrl: (client as any).audiomackUrl || "",
        beatportUrl: (client as any).beatportUrl || "",
        otherPlatformsUrl: (client as any).otherPlatformsUrl || "",
        recordLabel: (client as any).recordLabel || "",
        distributor: (client as any).distributor || "",
        managerContact: (client as any).managerContact || "",
        publisher: (client as any).publisher || "",
        performanceRightsSociety: (client as any).performanceRightsSociety || "",
        yearsActive: (client as any).yearsActive || "",
        notableWorks: (client as any).notableWorks || "",
        awardsRecognition: (client as any).awardsRecognition || "",
        biography: (client as any).biography || "",
      });
    }
  }, [client]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      data: formData,
    });
  };

  const handleUpdateField = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

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
          {/* Edit/Delete buttons */}
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => toggleEditMode(true)} title="Modifier les informations du client">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => toggleEditMode(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <ClientDetailTabs
          clientId={client.id}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          client={client}
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          handleUpdateField={handleUpdateField}
          clientWithContacts={clientWithContacts}
          addContactMutation={addContactMutation}
          deleteContactMutation={deleteContactMutation}
        />

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
    </div>
  );
}
