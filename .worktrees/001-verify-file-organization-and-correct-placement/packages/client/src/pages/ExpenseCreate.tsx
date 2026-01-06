import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function ExpenseCreate() {
  const navigate = useNavigate();

  // Create mutation
  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Dépense créée avec succès");
      navigate("/expenses");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    category: "other" as const,
    description: "",
    vendor: "",
    amount: "",
    currency: "EUR",
    taxAmount: "",
    expenseDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.description.trim()) {
      toast.error("La description est requise");
      return;
    }
    if (!formData.amount) {
      toast.error("Le montant est requis");
      return;
    }
    if (!formData.expenseDate) {
      toast.error("La date est requise");
      return;
    }

    // Submit
    createMutation.mutate({
      category: formData.category,
      description: formData.description,
      vendor: formData.vendor || undefined,
      amount: formData.amount,
      currency: formData.currency,
      taxAmount: formData.taxAmount || undefined,
      expenseDate: new Date(formData.expenseDate),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Nouvelle Dépense</h1>
            <p className="text-muted-foreground">Enregistrer une nouvelle dépense</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de la dépense</CardTitle>
            <CardDescription>Détails de la dépense</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Category & Expense Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as typeof formData.category })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Loyer</SelectItem>
                    <SelectItem value="utilities">Services publics</SelectItem>
                    <SelectItem value="insurance">Assurance</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="salary">Salaire</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="software">Logiciel</SelectItem>
                    <SelectItem value="supplies">Fournitures</SelectItem>
                    <SelectItem value="equipment">Équipement</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenseDate">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Achat microphone Neumann U87"
                required
                maxLength={500}
              />
            </div>

            {/* Row 3: Vendor */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Fournisseur</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Ex: Thomann"
              />
            </div>

            {/* Row 4: Amount & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Montant <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="2500.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="EUR"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Row 5: Tax Amount */}
            <div className="space-y-2">
              <Label htmlFor="taxAmount">Montant TVA</Label>
              <Input
                id="taxAmount"
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                placeholder="500.00"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer la dépense"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/expenses")}
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
