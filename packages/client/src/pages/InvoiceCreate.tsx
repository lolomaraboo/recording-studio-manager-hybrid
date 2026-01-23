import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, FileText, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRateId: number;
};

export default function InvoiceCreate() {
  const navigate = useNavigate();

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: vatRates } = trpc.vatRates.list.useQuery();
  const defaultVatRate = vatRates?.find(r => r.isDefault);

  // Create mutation
  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: (data) => {
      toast.success("Facture créée avec succès");
      navigate(`/invoices/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    clientId: 0,
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    status: "draft" as const,
    notes: "",
  });

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      vatRateId: defaultVatRate?.id || 1
    }
  ]);

  // Service catalog autocomplete state
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

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        vatRateId: defaultVatRate?.id || 1
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate amount when quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = Number(newItems[index].quantity) || 0;
      const unitPrice = Number(newItems[index].unitPrice) || 0;
      newItems[index].amount = quantity * unitPrice;
    }

    setItems(newItems);
  };

  // Handle service selection from autocomplete
  const handleServiceSelect = (index: number, service: any) => {
    const newItems = [...items];
    const quantity = parseFloat(service.defaultQuantity) || 1;
    const unitPrice = parseFloat(service.unitPrice) || 0;
    newItems[index] = {
      ...newItems[index],
      description: service.name,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
      vatRateId: service.vatRateId || defaultVatRate?.id || 1,
    };
    setItems(newItems);
    setAutocompleteOpen(null);
    setSearchQuery({ ...searchQuery, [index]: service.name });
  };

  // Handle service selection from catalog modal
  const handleCatalogServiceSelect = (service: any) => {
    const quantity = parseFloat(service.defaultQuantity) || 1;
    const unitPrice = parseFloat(service.unitPrice) || 0;
    const newItem: InvoiceItem = {
      description: service.name,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
      vatRateId: service.vatRateId || defaultVatRate?.id || 1,
    };
    setItems([...items, newItem]);
    setCatalogModalOpen(false);
  };

  // Calculate totals from line items
  const calculateTotal = () => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      subtotal += item.amount;
      const rate = vatRates?.find(r => r.id === item.vatRateId);
      if (rate) {
        totalTax += item.amount * (parseFloat(rate.rate) / 100);
      }
    });

    return {
      subtotal,
      taxAmount: totalTax,
      total: subtotal + totalTax,
    };
  };

  const totals = calculateTotal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.clientId) {
      toast.error("Le client est requis");
      return;
    }
    if (!formData.invoiceNumber.trim()) {
      toast.error("Le numéro de facture est requis");
      return;
    }
    if (!formData.issueDate) {
      toast.error("La date d'émission est requise");
      return;
    }
    if (items.length === 0 || !items[0].description.trim()) {
      toast.error("Au moins une ligne d'article est requise");
      return;
    }

    // Submit
    createMutation.mutate({
      clientId: formData.clientId,
      invoiceNumber: formData.invoiceNumber,
      issueDate: new Date(formData.issueDate).toISOString(),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        vatRateId: item.vatRateId,
      })),
      status: formData.status,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Nouvelle Facture
              </h1>
              <p className="text-muted-foreground">Créer une nouvelle facture client</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations de la facture</CardTitle>
              <CardDescription className="text-sm">Remplissez les détails de la facture</CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1: Client & Invoice Number */}
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
                <Label htmlFor="invoiceNumber">
                  Numéro de facture <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="Ex: INV-2024-001"
                  required
                />
              </div>
            </div>

            {/* Row 2: Issue Date & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">
                  Date d'émission <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Date d'échéance</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Articles</Label>
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Quantité</TableHead>
                      <TableHead className="w-32">Prix unit. (€)</TableHead>
                      <TableHead className="w-32">TVA</TableHead>
                      <TableHead className="w-32">Montant (€)</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Popover open={autocompleteOpen === index} onOpenChange={(open) => setAutocompleteOpen(open ? index : null)}>
                            <PopoverAnchor asChild>
                              <Input
                                value={item.description}
                                onChange={(e) => {
                                  handleItemChange(index, "description", e.target.value);
                                  setSearchQuery({ ...searchQuery, [index]: e.target.value });
                                  setCurrentSearchIndex(index);
                                  if (e.target.value.length >= 2) {
                                    setAutocompleteOpen(index);
                                  } else {
                                    setAutocompleteOpen(null);
                                  }
                                }}
                                onFocus={() => {
                                  setCurrentSearchIndex(index);
                                  if (item.description.length >= 2) {
                                    setAutocompleteOpen(index);
                                  }
                                }}
                                onBlur={() => setTimeout(() => setAutocompleteOpen(null), 200)}
                                placeholder="Tapez pour rechercher..."
                              />
                            </PopoverAnchor>
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
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.vatRateId.toString()}
                            onValueChange={(value) => handleItemChange(index, "vatRateId", parseInt(value))}
                          >
                            <SelectTrigger className="w-32">
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
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.amount.toFixed(2)}
                            readOnly
                            className="bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals Display */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total:</span>
                  <span className="font-medium">{totals.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA:</span>
                  <span className="font-medium">{totals.taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{totals.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Row 3: Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as typeof formData.status })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer la facture"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/invoices")}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Catalog Modal */}
      <Dialog open={catalogModalOpen} onOpenChange={setCatalogModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sélectionner un service du catalogue</DialogTitle>
            <DialogDescription>
              Choisissez un service pré-défini pour l'ajouter à la facture
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
                        <TableCell className="text-right">{vatRates?.find(r => r.id === service.vatRateId)?.rate || "0"}%</TableCell>
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
    </div>
  );
}
