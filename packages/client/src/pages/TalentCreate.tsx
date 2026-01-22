import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Music, X } from "lucide-react";
import { toast } from "sonner";
import { TalentEditForm } from "@/components/TalentEditForm";

export default function TalentCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.musicians.create.useMutation({
    onSuccess: (data) => {
      toast.success("Talent créé avec succès");
      navigate(`/talents/${data.id}`);
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
    talentType: "musician" as const,
    website: "",
    spotifyUrl: "",
    instruments: "",
    genres: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    // Submit
    createMutation.mutate({
      name: formData.name,
      stageName: formData.stageName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      talentType: formData.talentType,
      website: formData.website || undefined,
      spotifyUrl: formData.spotifyUrl || undefined,
      instruments: formData.instruments || undefined,
      genres: formData.genres || undefined,
      notes: formData.notes || undefined,
    });
  };

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
                Nouveau Talent
              </h1>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <TalentEditForm
            formData={formData}
            setFormData={setFormData}
          />

          {/* Submit button */}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/talents">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Création..." : "Créer le talent"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
