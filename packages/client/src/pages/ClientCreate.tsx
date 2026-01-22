import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientEditForm } from "@/components/ClientEditForm";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, User, Save } from "lucide-react";
import { toast } from "sonner";

export default function ClientCreate() {
  const navigate = useNavigate();

  // Form data state - initialized with default values
  const [formData, setFormData] = useState<any>({
    type: "individual",
    name: "",
    firstName: "",
    lastName: "",
    middleName: "",
    prefix: "",
    suffix: "",
    artistName: "",
    birthday: "",
    gender: "",
    avatarUrl: "",
    logoUrl: "",
    phones: [],
    emails: [],
    websites: [],
    addresses: [],
    customFields: [],
    genres: [],
    instruments: [],
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

  // Create mutation
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: (data) => {
      toast.success("Client créé avec succès");
      navigate(`/clients/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    // Minimal validation: only name required
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error("Le nom est requis (min. 2 caractères)");
      return;
    }

    // Map addresses array back to flat fields for database (if needed)
    const dataToSave = { ...formData };
    if (formData.addresses && formData.addresses.length > 0) {
      const addr = formData.addresses[0]; // Use first address
      dataToSave.street = addr.street || "";
      dataToSave.city = addr.city || "";
      dataToSave.postalCode = addr.postalCode || "";
      dataToSave.country = addr.country || "";
    }

    createMutation.mutate(dataToSave);
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              Nouveau Client
            </h2>
          </div>
        </div>

        {/* Sticky action buttons */}
        <Card className="sticky top-2 z-10 bg-background/95 backdrop-blur">
          <CardContent className="py-3 px-4">
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => navigate("/clients")}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Créer le client
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form with Accordions */}
        <ClientEditForm
          formData={formData}
          setFormData={setFormData}
        />
      </div>
    </div>
  );
}
