import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function ClientCreate() {
  const navigate = useNavigate();

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

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || formData.name.length < 2) {
      toast.error("Le nom est requis (min. 2 caractères)");
      return;
    }

    // Submit
    createMutation.mutate({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Nouveau Client</h1>
            <p className="text-muted-foreground">Ajouter un nouveau client au studio</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du client</CardTitle>
            <CardDescription>Remplissez les informations principales du client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>

            {/* Row 2: Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            {/* Row 3: Company */}
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Ex: Sony Music"
              />
            </div>

            {/* Row 4: Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse complète..."
                rows={2}
              />
            </div>

            {/* Row 5: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes privées pour l'équipe..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer le client"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/clients")}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
