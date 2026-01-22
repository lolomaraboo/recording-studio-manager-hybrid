import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Download,
  Send,
  CheckCircle,
  Calendar,
  User,
  FileText,
  Plus,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRateId: number;
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch invoice data
  const { data: invoice, isLoading, refetch } = trpc.invoices.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: vatRates } = trpc.vatRates.list.useQuery();
  const defaultVatRate = vatRates?.find(r => r.isDefault);

  // Editable items state
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);

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
    { search: debouncedSearch, activeOnly: true },
    { enabled: debouncedSearch.length >= 2 }
  );
  const { data: catalogServices } = trpc.serviceCatalog.list.useQuery({
    category: catalogCategory === "all" ? undefined : (catalogCategory as any),
    activeOnly: true,
  });

  // Mutations
  const updateMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Facture mise à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateWithItemsMutation = trpc.invoices.updateWithItems.useMutation({
    onSuccess: () => {
      toast.success("Facture mise à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Facture supprimée");
      navigate("/invoices");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || "",
    clientId: invoice?.clientId || 0,
    issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().slice(0, 10) : "",
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : "",
    status: invoice?.status || "draft",
    subtotal: invoice?.subtotal || "",
    taxRate: invoice?.taxRate || "20.00",
    taxAmount: invoice?.taxAmount || "",
    total: invoice?.total || "",
    notes: invoice?.notes || "",
  });

  // Update form when invoice loads
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        issueDate: new Date(invoice.issueDate).toISOString().slice(0, 10),
        dueDate: new Date(invoice.dueDate).toISOString().slice(0, 10),
        status: invoice.status,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        notes: invoice.notes || "",
      });
    }
  }, [invoice]);

  // Debounce for autocomplete search
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

  // Initialize editItems when entering edit mode
  const startEditing = () => {
    if (invoice?.items && invoice.items.length > 0) {
      setEditItems(invoice.items.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        amount: parseFloat(item.amount) || 0,
        vatRateId: item.vatRateId || defaultVatRate?.id || 1,
      })));
    } else {
      setEditItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0, vatRateId: defaultVatRate?.id || 1 }]);
    }
    setIsEditing(true);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      const qty = Number(newItems[index].quantity) || 0;
      const price = Number(newItems[index].unitPrice) || 0;
      newItems[index].amount = qty * price;
    }
    setEditItems(newItems);
  };

  const handleAddItem = () => {
    setEditItems([...editItems, { description: "", quantity: 1, unitPrice: 0, amount: 0, vatRateId: defaultVatRate?.id || 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (editItems.length === 1) return;
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleServiceSelect = (index: number, service: any) => {
    const newItems = [...editItems];
    const qty = parseFloat(service.defaultQuantity) || 1;
    const price = parseFloat(service.unitPrice) || 0;
    newItems[index] = {
      ...newItems[index],
      description: service.name,
      quantity: qty,
      unitPrice: price,
      amount: qty * price,
      vatRateId: service.vatRateId || defaultVatRate?.id || 1,
    };
    setEditItems(newItems);
    setAutocompleteOpen(null);
    setSearchQuery({ ...searchQuery, [index]: service.name });
  };

  const handleCatalogServiceSelect = (service: any) => {
    const qty = parseFloat(service.defaultQuantity) || 1;
    const price = parseFloat(service.unitPrice) || 0;
    setEditItems([...editItems, {
      description: service.name,
      quantity: qty,
      unitPrice: price,
      amount: qty * price,
      vatRateId: service.vatRateId || defaultVatRate?.id || 1,
    }]);
    setCatalogModalOpen(false);
  };

  // Calculate totals for edit mode
  const calculateEditTotal = () => {
    let subtotal = 0;
    let totalTax = 0;
    editItems.forEach(item => {
      subtotal += item.amount;
      const rate = vatRates?.find(r => r.id === item.vatRateId);
      if (rate) {
        totalTax += item.amount * (parseFloat(rate.rate) / 100);
      }
    });
    return { subtotal, taxAmount: totalTax, total: subtotal + totalTax };
  };

  const editTotals = calculateEditTotal();

  const handleSave = () => {
    updateWithItemsMutation.mutate({
      id: Number(id),
      data: {
        invoiceNumber: formData.invoiceNumber,
        clientId: formData.clientId,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        status: formData.status as any,
        notes: formData.notes,
        items: editItems.filter(item => item.description.trim() !== "").map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          vatRateId: item.vatRateId,
        })),
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation when backend supports it
    toast.info(`Génération PDF facture ${invoice?.invoiceNumber} - À implémenter`);
  };

  const handleSendEmail = () => {
    // TODO: Implement email sending when backend supports it
    toast.info("Envoi email - À implémenter");
  };

  const handleMarkAsPaid = () => {
    updateMutation.mutate({
      id: Number(id),
      data: {
        status: "paid",
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; color: string }> = {
      draft: { variant: "secondary", label: "Brouillon", color: "text-gray-600" },
      sent: { variant: "outline", label: "Envoyée", color: "text-blue-600" },
      paid: { variant: "default", label: "Payée", color: "text-green-600" },
      cancelled: { variant: "destructive", label: "Annulée", color: "text-red-600" },
      overdue: { variant: "destructive", label: "En retard", color: "text-red-600" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const client = clients?.find((c) => c.id === invoice?.clientId);

  if (isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/invoices">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Facture introuvable
            </h2>
          </div>
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Cette facture n'existe pas ou a été supprimée.</p>
              <Button size="sm" asChild>
                <Link to="/invoices">Retour aux factures</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOverdue =
    invoice.status === "sent" && new Date(invoice.dueDate) < new Date() && !invoice.paidAt;

  return (
    <>
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/invoices">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Facture {invoice.invoiceNumber}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <Link to={`/clients/${client?.id}`} className="hover:underline">{client?.name || "Client inconnu"}</Link>
                {client?.email && <span>• {client.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                {invoice.status === "draft" && (
                  <Button variant="outline" onClick={handleSendEmail}>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer
                  </Button>
                )}
                {(invoice.status === "sent" || invoice.status === "overdue") && (
                  <Button variant="default" onClick={handleMarkAsPaid}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marquer payée
                  </Button>
                )}
                <Button variant="outline" onClick={startEditing}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={updateWithItemsMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
            {/* Invoice Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Informations de la facture</CardTitle>
                  {getStatusBadge(invoice.status)}
                </div>
                <CardDescription className="text-sm">Détails et paramètres de la facture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNumber">Numéro de facture</Label>
                        <Input
                          id="invoiceNumber"
                          value={formData.invoiceNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, invoiceNumber: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client">Client</Label>
                        <Select
                          value={String(formData.clientId)}
                          onValueChange={(value) =>
                            setFormData({ ...formData, clientId: Number(value) })
                          }
                        >
                          <SelectTrigger id="client">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {clients?.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="issueDate">Date d'émission</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
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

                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
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
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Client</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <Link to={`/clients/${client?.id}`} className="text-sm hover:underline">
                            {client?.name || "N/A"}
                          </Link>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Numéro</p>
                        <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Date d'émission</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(invoice.issueDate), "dd MMMM yyyy", { locale: fr })}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Date d'échéance</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: fr })}
                        </div>
                        {isOverdue && (
                          <p className="text-xs text-red-600 mt-1">⚠️ En retard</p>
                        )}
                      </div>
                    </div>

                    {invoice.paidAt && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Payée le</p>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {format(new Date(invoice.paidAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                        </div>
                      </div>
                    )}

                    {/* Dates & Alerts */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t mt-4">
                      <span>Créée le {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: fr })}</span>
                      <span>•</span>
                      <span>Mise à jour le {format(new Date(invoice.updatedAt), "dd MMM yyyy", { locale: fr })}</span>
                    </div>

                    {isOverdue && (
                      <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md mt-2">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Facture en retard
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Échéance dépassée depuis le {format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    )}

                    {invoice.status === "paid" && invoice.paidAt && (
                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md mt-2">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Facture payée le {format(new Date(invoice.paidAt), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Invoice Items Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Détails de facturation</CardTitle>
                <CardDescription className="text-sm">Lignes et montants de la facture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {/* Edit mode: editable items table with catalog */}
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
                              <TableHead className="w-24">Quantite</TableHead>
                              <TableHead className="w-32">Prix unit.</TableHead>
                              <TableHead className="w-32">TVA</TableHead>
                              <TableHead className="w-32">Montant</TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {editItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Popover open={autocompleteOpen === index} onOpenChange={(open) => setAutocompleteOpen(open ? index : null)}>
                                    <PopoverTrigger asChild>
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
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                      <Command>
                                        <CommandList>
                                          {!autocompleteServices || autocompleteServices.length === 0 ? (
                                            <CommandEmpty>
                                              {searchQuery[index]?.length >= 2 ? "Aucun service trouve" : "Tapez au moins 2 caracteres"}
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
                                    disabled={editItems.length === 1}
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

                    {/* Totals (edit mode - dynamic) */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total HT</span>
                        <span className="font-medium">{editTotals.subtotal.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TVA</span>
                        <span className="font-medium">{editTotals.taxAmount.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t pt-2">
                        <span>Total TTC</span>
                        <span className="text-primary">{editTotals.total.toFixed(2)} €</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Read mode: items table */}
                    {invoice.items && invoice.items.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-24">Quantite</TableHead>
                              <TableHead className="w-32">Prix unit.</TableHead>
                              <TableHead className="w-24">TVA</TableHead>
                              <TableHead className="w-32 text-right">Montant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{parseFloat(item.unitPrice).toFixed(2)} €</TableCell>
                                <TableCell>{vatRates?.find(r => r.id === item.vatRateId)?.rate || "20"}%</TableCell>
                                <TableCell className="text-right">{parseFloat(item.amount).toFixed(2)} €</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune ligne de facturation</p>
                    )}

                    {/* Totals (read mode) */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total HT</span>
                        <span className="font-medium">
                          {parseFloat(invoice.subtotal).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}€
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          TVA ({parseFloat(invoice.taxRate).toFixed(0)}%)
                        </span>
                        <span className="font-medium">
                          {parseFloat(invoice.taxAmount).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}€
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t pt-2">
                        <span>Total TTC</span>
                        <span className="text-primary">
                          {parseFloat(invoice.total).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}€
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
                <CardDescription className="text-sm">Notes et commentaires sur la facture</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={6}
                    placeholder="Ajoutez des notes..."
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{invoice.notes || "Aucune note"}</p>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la facture</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* Catalog Modal */}
    <Dialog open={catalogModalOpen} onOpenChange={setCatalogModalOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Selectionner un service du catalogue</DialogTitle>
          <DialogDescription>
            Choisissez un service pre-defini pour l'ajouter a la facture
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <Label>Categorie:</Label>
            <Select value={catalogCategory} onValueChange={setCatalogCategory}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les categories</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="Post-production">Post-production</SelectItem>
                <SelectItem value="Location materiel">Location materiel</SelectItem>
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
                Creez-en un dans la page Services
              </Link>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Qte defaut</TableHead>
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
    </>
  );
}
