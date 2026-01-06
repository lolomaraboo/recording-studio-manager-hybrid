import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  displayOrder: number;
};

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
  const [formData, setFormData] = useState<{
    clientId: number | undefined;
    projectId: number | undefined;
    title: string;
    terms: string;
    notes: string;
    internalNotes: string;
  }>({
    clientId: undefined,
    projectId: undefined,
    title: "",
    terms: "",
    notes: "",
    internalNotes: "",
  });

  // Line items state
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: "1.00", unitPrice: "0.00", amount: "0.00", displayOrder: 0 }
  ]);
  const [taxRate, setTaxRate] = useState("20.00");

  // Handlers for line items
  const handleAddItem = () => {
    setItems([
      ...items,
      { description: "", quantity: "1.00", unitPrice: "0.00", amount: "0.00", displayOrder: items.length }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Recompute displayOrder
    const reorderedItems = newItems.map((item, i) => ({ ...item, displayOrder: i }));
    setItems(reorderedItems);
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate amount when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].amount = (quantity * unitPrice).toFixed(2);
    }

    setItems(newItems);
  };

  // Calculate totals from items array
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const taxAmount = (subtotal * parseFloat(taxRate)) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.clientId) {
      toast.error("Le client est requis");
      return;
    }
    if (items.length === 0 || !items[0].description.trim()) {
      toast.error("Au moins une prestation est requise");
      return;
    }

    // Submit with items array
    createMutation.mutate({
      clientId: formData.clientId,
      items: items.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        displayOrder: index,
      })),
      validityDays: 30, // 30 days default
      terms: formData.terms || undefined,
      notes: formData.notes || undefined,
      internalNotes: formData.internalNotes || undefined,
      taxRate: taxRate,
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
              {/* Row 1: Client & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">
                    Client <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.clientId?.toString() ?? ""}
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
                    value={formData.projectId?.toString() ?? "0"}
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

              {/* Row 2: Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Enregistrement album"
                />
              </div>

              {/* Line Items Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Prestations</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une ligne
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start border p-3 rounded-md">
                    {/* Description - 5 cols */}
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Ex: Enregistrement (4h)"
                      />
                    </div>

                    {/* Quantity - 2 cols */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Quantité</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      />
                    </div>

                    {/* Unit Price - 2 cols */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Prix unit. (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                      />
                    </div>

                    {/* Amount - 2 cols (read-only calculated) */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Montant (€)</Label>
                      <Input value={item.amount} readOnly className="bg-muted" />
                    </div>

                    {/* Remove button - 1 col */}
                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Display */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total:</span>
                    <span className="font-medium">{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm items-center gap-2">
                    <Label htmlFor="taxRate" className="text-muted-foreground">TVA (%):</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-20 h-8"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA:</span>
                    <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Terms */}
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

              {/* Row 4: Notes */}
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
