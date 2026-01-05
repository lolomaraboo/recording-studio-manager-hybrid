import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function ContractCreate() {
  const navigate = useNavigate();

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: projects } = trpc.projects.list.useQuery();

  // Create mutation
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contrat créé avec succès");
      navigate("/contracts");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    contractNumber: "",
    clientId: 0,
    projectId: 0,
    type: "recording" as const,
    title: "",
    description: "",
    terms: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.contractNumber.trim()) {
      toast.error("Le numéro de contrat est requis");
      return;
    }
    if (!formData.clientId) {
      toast.error("Le client est requis");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!formData.terms.trim()) {
      toast.error("Les conditions sont requises");
      return;
    }

    // Submit
    createMutation.mutate({
      contractNumber: formData.contractNumber,
      clientId: formData.clientId,
      projectId: formData.projectId || undefined,
      type: formData.type,
      title: formData.title,
      description: formData.description || undefined,
      terms: formData.terms,
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/contracts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Nouveau Contrat</h1>
              <p className="text-muted-foreground">Créer un nouveau contrat client</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations du contrat</CardTitle>
              <CardDescription className="text-sm">Détails du contrat commercial</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-6">
            {/* Row 1: Contract Number & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractNumber">
                  Numéro de contrat <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contractNumber"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  placeholder="Ex: CT-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as typeof formData.type })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recording">Enregistrement</SelectItem>
                    <SelectItem value="mixing">Mixage</SelectItem>
                    <SelectItem value="mastering">Mastering</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="exclusivity">Exclusivité</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="studio_rental">Location studio</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="partnership">Partenariat</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Client & Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.clientId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, clientId: parseInt(value) })}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">Projet (optionnel)</Label>
                <Select
                  value={formData.projectId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, projectId: parseInt(value) })}
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Aucun</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Contrat d'enregistrement album 2024"
                required
              />
            </div>

            {/* Row 4: Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du contrat..."
                rows={3}
              />
            </div>

            {/* Row 5: Terms */}
            <div className="space-y-2">
              <Label htmlFor="terms">
                Conditions <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Conditions générales du contrat..."
                rows={6}
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer le contrat"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/contracts")}
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
