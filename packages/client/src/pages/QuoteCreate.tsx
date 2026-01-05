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

export default function QuoteCreate() {
  const navigate = useNavigate();

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: projects } = trpc.projects.list.useQuery();

  // Create mutation
  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: () => {
      toast.success("Devis créé avec succès");
      navigate("/quotes");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    quoteNumber: "",
    clientId: 0,
    projectId: 0,
    validUntil: "",
    title: "",
    description: "",
    subtotal: "",
    taxRate: "20.00",
    terms: "",
    notes: "",
  });

  // Calculate tax and total
  const subtotal = parseFloat(formData.subtotal) || 0;
  const taxRate = parseFloat(formData.taxRate) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.quoteNumber.trim()) {
      toast.error("Le numéro de devis est requis");
      return;
    }
    if (!formData.clientId) {
      toast.error("Le client est requis");
      return;
    }
    if (!formData.validUntil) {
      toast.error("La date de validité est requise");
      return;
    }
    if (!formData.subtotal) {
      toast.error("Le sous-total est requis");
      return;
    }

    // Submit
    createMutation.mutate({
      quoteNumber: formData.quoteNumber,
      clientId: formData.clientId,
      projectId: formData.projectId || undefined,
      validUntil: new Date(formData.validUntil),
      title: formData.title || undefined,
      description: formData.description || undefined,
      subtotal: formData.subtotal,
      taxRate: formData.taxRate,
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      terms: formData.terms || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/quotes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Nouveau Devis</h1>
              <p className="text-muted-foreground">Créer un nouveau devis client</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations du devis</CardTitle>
              <CardDescription className="text-sm">Détails du devis commercial</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-6">
            {/* Row 1: Quote Number & Valid Until */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quoteNumber">
                  Numéro de devis <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quoteNumber"
                  value={formData.quoteNumber}
                  onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                  placeholder="Ex: QT-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">
                  Valide jusqu'au <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                />
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
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Enregistrement album"
              />
            </div>

            {/* Row 4: Subtotal & Tax Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">
                  Sous-total (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subtotal"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                  placeholder="1000.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                <Input
                  id="taxRate"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  placeholder="20.00"
                />
              </div>
            </div>

            {/* Calculated values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant TVA</Label>
                <div className="text-lg font-semibold">{taxAmount.toFixed(2)} €</div>
              </div>
              <div className="space-y-2">
                <Label>Total TTC</Label>
                <div className="text-lg font-semibold">{total.toFixed(2)} €</div>
              </div>
            </div>

            {/* Row 5: Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée..."
                rows={3}
              />
            </div>

            {/* Row 6: Terms */}
            <div className="space-y-2">
              <Label htmlFor="terms">Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Conditions générales..."
                rows={2}
              />
            </div>

            {/* Row 7: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes internes..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer le devis"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/quotes")}
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
