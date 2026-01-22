import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  displayOrder: number;
  vatRateId: number; // Required per-line VAT rate
};

export default function QuoteCreate() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: vatRates } = trpc.vatRates.list.useQuery();
  const defaultVatRate = vatRates?.find(r => r.isDefault);

  // Create mutation
  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
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
    validityDays: number;
    terms: string;
    notes: string;
    internalNotes: string;
  }>({
    clientId: undefined,
    projectId: undefined,
    title: "",
    validityDays: 30,
    terms: "",
    notes: "",
    internalNotes: "",
  });

  // Line items state
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: "1.00", unitPrice: "0.00", amount: "0.00", displayOrder: 0, vatRateId: defaultVatRate?.id || 1 }
  ]);

  // Autocomplete state
  const [autocompleteOpen, setAutocompleteOpen] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<{ [index: number]: string }>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number | null>(null);

  // Catalog modal state
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState<string>("all");

  // Service catalog queries
  const { data: autocompleteServices } = trpc.serviceCatalog.list.useQuery(
    {
      search: debouncedSearch,
      activeOnly: true,
    },
    {
      enabled: debouncedSearch.length >= 2,
    }
  );

  const { data: catalogServices } = trpc.serviceCatalog.list.useQuery({
    category: catalogCategory === "all" ? undefined : (catalogCategory as any),
    activeOnly: true,
  });

  // Debounce search
  useEffect(() => {
    if (currentSearchIndex !== null && searchQuery[currentSearchIndex]) {
      const timer = setTimeout(() => {
        setDebouncedSearch(searchQuery[currentSearchIndex]);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setDebouncedSearch("");
    }
  }, [searchQuery, currentSearchIndex]);

  // Handlers for line items
  const handleAddItem = () => {
    setItems([
      ...items,
      { description: "", quantity: "1.00", unitPrice: "0.00", amount: "0.00", displayOrder: items.length, vatRateId: defaultVatRate?.id || 1 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Recompute displayOrder
    const reorderedItems = newItems.map((item, i) => ({ ...item, displayOrder: i }));
    setItems(reorderedItems);
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];

    // Handle different field types
    if (field === "vatRateId") {
      newItems[index] = { ...newItems[index], [field]: typeof value === 'string' ? parseInt(value) : value };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    // Auto-calculate amount when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].amount = (quantity * unitPrice).toFixed(2);
    }

    // Update search query for autocomplete
    if (field === "description" && typeof value === 'string') {
      setSearchQuery({ ...searchQuery, [index]: value });
      setCurrentSearchIndex(index);
    }

    setItems(newItems);
  };

  // Handle service selection from autocomplete
  const handleServiceSelect = (index: number, service: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      description: service.name,
      quantity: service.defaultQuantity.toString(),
      unitPrice: service.unitPrice.toString(),
      amount: (service.defaultQuantity * service.unitPrice).toFixed(2),
      vatRateId: service.vatRateId || defaultVatRate?.id || 1,
    };
    setItems(newItems);
    setAutocompleteOpen(null);
    setSearchQuery({ ...searchQuery, [index]: service.name });
  };

  // Handle service selection from catalog modal
  const handleCatalogServiceSelect = (service: any) => {
    const newItem: LineItem = {
      description: service.name,
      quantity: service.defaultQuantity.toString(),
      unitPrice: service.unitPrice.toString(),
      amount: (service.defaultQuantity * service.unitPrice).toFixed(2),
      displayOrder: items.length,
      vatRateId: service.vatRateId || defaultVatRate?.id || 1,
    };
    setItems([...items, newItem]);
    setCatalogModalOpen(false);
  };

  // Calculate totals from items array with per-line VAT rates
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const taxAmount = items.reduce((sum, item) => {
    const itemAmount = parseFloat(item.amount) || 0;
    const rate = vatRates?.find(r => r.id === item.vatRateId);
    if (rate) {
      return sum + (itemAmount * parseFloat(rate.rate)) / 100;
    }
    return sum;
  }, 0);
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
        vatRateId: item.vatRateId,
        displayOrder: index,
      })),
      validityDays: formData.validityDays,
      terms: formData.terms || undefined,
      notes: formData.notes || undefined,
      internalNotes: formData.internalNotes || undefined,
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
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setCatalogModalOpen(true)}>
                      <Package className="h-4 w-4 mr-2" />
                      Du catalogue
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une ligne
                    </Button>
                  </div>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-13 gap-2 items-start border p-3 rounded-md">
                    {/* Description - 4 cols with autocomplete */}
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Popover open={autocompleteOpen === index} onOpenChange={(open) => setAutocompleteOpen(open ? index : null)}>
                        <PopoverTrigger asChild>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            onFocus={() => {
                              setCurrentSearchIndex(index);
                              if (item.description.length >= 2) {
                                setAutocompleteOpen(index);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setAutocompleteOpen(null), 200);
                            }}
                            placeholder="Tapez pour rechercher..."
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandList>
                              {!autocompleteServices || autocompleteServices.length === 0 ? (
                                <CommandEmpty>
                                  {searchQuery[index]?.length >= 2 ? "Aucun service trouvé" : "Tapez au moins 2 caractères"}
                                </CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {autocompleteServices.slice(0, 10).map((service) => (
                                    <CommandItem
                                      key={service.id}
                                      onSelect={() => handleServiceSelect(index, service)}
                                      className="flex items-center justify-between cursor-pointer"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">{service.name}</div>
                                        <div className="text-xs text-muted-foreground">{service.category}</div>
                                      </div>
                                      <div className="text-sm font-medium">{parseFloat(service.unitPrice).toFixed(2)} €</div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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

                    {/* VAT Rate - 2 cols */}
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">TVA</Label>
                      <Select
                        value={item.vatRateId.toString()}
                        onValueChange={(value) => handleItemChange(index, "vatRateId", value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vatRates?.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id.toString()}>
                              {rate.rate}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

              {/* Validity Days */}
              <div className="space-y-2">
                <Label htmlFor="validityDays">Durée de validité (jours)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  min={1}
                  max={365}
                  value={formData.validityDays}
                  onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 30 })}
                  className="w-32"
                />
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

      {/* Catalog Modal */}
      <Dialog open={catalogModalOpen} onOpenChange={setCatalogModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sélectionner un service du catalogue</DialogTitle>
            <DialogDescription>
              Choisissez un service pré-défini pour l'ajouter au devis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <Label>Catégorie:</Label>
              <Select value={catalogCategory} onValueChange={setCatalogCategory}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="Post-production">Post-production</SelectItem>
                  <SelectItem value="Location matériel">Location matériel</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Services Table */}
            {!catalogServices || catalogServices.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucun service dans le catalogue.</p>
                <Link to="/services" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Créez-en un dans la page Services
                </Link>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="text-right">TVA</TableHead>
                      <TableHead className="text-right">Qté défaut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogServices.map((service) => (
                      <TableRow
                        key={service.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleCatalogServiceSelect(service)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{service.category}</TableCell>
                        <TableCell className="text-right">{parseFloat(service.unitPrice).toFixed(2)} €</TableCell>
                        <TableCell className="text-right">{service.taxRate}%</TableCell>
                        <TableCell className="text-right">{service.defaultQuantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
