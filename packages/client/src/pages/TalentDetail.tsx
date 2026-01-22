import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { TalentDetailTabs } from "@/components/TalentDetailTabs";
import {
  ArrowLeft,
  Music,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { type TalentType } from "@rsm/shared";

export default function TalentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("informations");

  // Fetch talent data
  const { data: talent, isLoading, refetch } = trpc.musicians.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const updateMutation = trpc.musicians.update.useMutation({
    onSuccess: () => {
      toast.success("Talent mis à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.musicians.delete.useMutation({
    onSuccess: () => {
      toast.success("Talent supprimé");
      navigate("/talents");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    stageName: "",
    email: "",
    phone: "",
    bio: "",
    talentType: "musician" as TalentType,
    website: "",
    spotifyUrl: "",
    instruments: "",
    genres: "",
    notes: "",
  });

  // Update form when talent loads
  useEffect(() => {
    if (talent) {
      setFormData({
        name: talent.name,
        stageName: talent.stageName || "",
        email: talent.email || "",
        phone: talent.phone || "",
        bio: talent.bio || "",
        talentType: talent.talentType as TalentType,
        website: talent.website || "",
        spotifyUrl: talent.spotifyUrl || "",
        instruments: talent.instruments || "",
        genres: talent.genres || "",
        notes: talent.notes || "",
      });
    }
  }, [talent]);

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      ...formData,
    });
  };

  const handleUpdateField = (updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  if (isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/talents">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Music className="h-8 w-8 text-primary" />
              Talent introuvable
            </h2>
          </div>
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Ce talent n'existe pas ou a été supprimé.</p>
              <Button size="sm" asChild>
                <Link to="/talents">Retour aux talents</Link>
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
            <Link to="/talents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                {talent?.name || "Talent"}
              </h1>
              {talent?.stageName && (
                <p className="text-muted-foreground">{talent.stageName}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs Component */}
        <TalentDetailTabs
          talentId={Number(id)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          talent={talent}
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          handleUpdateField={handleUpdateField}
        />

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le talent</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer ce talent ? Cette action est irréversible.
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
