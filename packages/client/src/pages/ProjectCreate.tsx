import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Music } from "lucide-react";
import { toast } from "sonner";
import { ProjectEditForm } from "@/components/ProjectEditForm";

export default function ProjectCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Projet créé avec succès");
      navigate(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state with ALL 20+ fields
  const [formData, setFormData] = useState({
    clientId: 0,
    name: "",
    artistName: "",
    description: "",
    genre: "",
    type: "album" as const,
    status: "pre_production" as const,
    startDate: "",
    targetDeliveryDate: "",
    actualDeliveryDate: "",
    endDate: "",
    budget: "",
    totalCost: "",
    trackCount: 0,
    label: "",
    catalogNumber: "",
    coverArtUrl: "",
    spotifyUrl: "",
    appleMusicUrl: "",
    storageLocation: "",
    storageSize: 0,
    notes: "",
    technicalNotes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.clientId) {
      toast.error("Le client est requis");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    // Submit with date conversions
    // Note: Only sending fields supported by projects.create router (Phase 32)
    createMutation.mutate({
      clientId: formData.clientId,
      name: formData.name,
      artistName: formData.artistName || undefined,
      description: formData.description || undefined,
      genre: formData.genre || undefined,
      type: formData.type,
      status: formData.status,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      targetDeliveryDate: formData.targetDeliveryDate ? new Date(formData.targetDeliveryDate) : undefined,
      budget: formData.budget || undefined,
      label: formData.label || undefined,
      coverArtUrl: formData.coverArtUrl || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                Nouveau Projet
              </h1>
              <p className="text-muted-foreground">Créer un nouveau projet musical</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations du projet</CardTitle>
              <CardDescription className="text-sm">Détails du projet musical</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Use ProjectEditForm component */}
              <ProjectEditForm formData={formData} setFormData={setFormData} />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? "Création..." : "Créer le projet"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/projects")}
                  disabled={createMutation.isPending}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
