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
// Table imports removed - not currently used
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
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

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

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      data: {
        invoiceNumber: formData.invoiceNumber,
        clientId: formData.clientId,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status as "draft" | "sent" | "paid" | "overdue" | "cancelled",
        subtotal: formData.subtotal,
        taxRate: formData.taxRate,
        taxAmount: formData.taxAmount,
        total: formData.total,
        notes: formData.notes,
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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <main className="container py-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/invoices">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Facture introuvable</h1>
          </div>
        </header>
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Cette facture n'existe pas ou a été supprimée.</p>
              <Button className="mt-4" asChild>
                <Link to="/invoices">Retour aux factures</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isOverdue =
    invoice.status === "sent" && new Date(invoice.dueDate) < new Date() && !invoice.paidAt;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/invoices">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Facture {invoice.invoiceNumber}</h1>
              <p className="text-sm text-muted-foreground">{client?.name || "Client inconnu"}</p>
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
                <Button variant="outline" onClick={() => setIsEditing(true)}>
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
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Invoice Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Invoice Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informations de la facture</CardTitle>
                  {getStatusBadge(invoice.status)}
                </div>
                <CardDescription>Détails et paramètres de la facture</CardDescription>
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* Invoice Items Card */}
            <Card>
              <CardHeader>
                <CardTitle>Détails de facturation</CardTitle>
                <CardDescription>Lignes et montants de la facture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* TODO: Display invoice items when backend supports them */}
                <p className="text-sm text-muted-foreground">
                  Les lignes de facture seront affichées ici (invoiceItems table à implémenter)
                </p>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span className="font-medium">
                      {parseFloat(invoice.subtotal).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      €
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
                      })}
                      €
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total TTC</span>
                    <span className="text-primary">
                      {parseFloat(invoice.total).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      €
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Notes et commentaires sur la facture</CardDescription>
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

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Statut</p>
                  {getStatusBadge(invoice.status)}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                  <p className="text-2xl font-semibold">
                    {parseFloat(invoice.total).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    €
                  </p>
                </div>

                {isOverdue && (
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      ⚠️ Facture en retard
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Échéance dépassée depuis le{" "}
                      {format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                )}

                {invoice.status === "paid" && invoice.paidAt && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Facture payée
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Le {format(new Date(invoice.paidAt), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créée le</p>
                  <p className="text-sm">
                    {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mise à jour</p>
                  <p className="text-sm">
                    {format(new Date(invoice.updatedAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </Button>
                {invoice.status === "draft" && (
                  <Button variant="outline" className="w-full" onClick={handleSendEmail}>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer au client
                  </Button>
                )}
                {(invoice.status === "sent" || invoice.status === "overdue") && (
                  <Button variant="default" className="w-full" onClick={handleMarkAsPaid}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marquer comme payée
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/clients/${client?.id}`}>Voir le client</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Client Info Card */}
            {client && (
              <Card>
                <CardHeader>
                  <CardTitle>Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    {client.artistName && (
                      <p className="text-sm text-muted-foreground">{client.artistName}</p>
                    )}
                  </div>
                  {client.email && (
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  )}
                  {client.phone && (
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

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
    </div>
  );
}
