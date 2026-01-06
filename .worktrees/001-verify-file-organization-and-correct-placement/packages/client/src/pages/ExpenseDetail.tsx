import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Receipt,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch expense data
  const { data: expense, isLoading, refetch } = trpc.expenses.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const updateMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      toast.success("Dépense mise à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Dépense supprimée");
      navigate("/expenses");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    category: expense?.category || "other",
    description: expense?.description || "",
    vendor: expense?.vendor || "",
    amount: expense?.amount || "",
    currency: expense?.currency || "EUR",
    taxAmount: expense?.taxAmount || "",
    expenseDate: expense?.expenseDate ? new Date(expense.expenseDate).toISOString().slice(0, 10) : "",
    paymentMethod: expense?.paymentMethod || "bank_transfer",
    referenceNumber: expense?.referenceNumber || "",
    status: expense?.status || "pending",
    notes: expense?.notes || "",
  });

  // Update form when expense loads
  useState(() => {
    if (expense) {
      setFormData({
        category: expense.category,
        description: expense.description,
        vendor: expense.vendor || "",
        amount: expense.amount,
        currency: expense.currency,
        taxAmount: expense.taxAmount || "",
        expenseDate: new Date(expense.expenseDate).toISOString().slice(0, 10),
        paymentMethod: expense.paymentMethod || "bank_transfer",
        referenceNumber: expense.referenceNumber || "",
        status: expense.status,
        notes: expense.notes || "",
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      category: formData.category as "rent" | "utilities" | "insurance" | "maintenance" | "salary" | "marketing" | "software" | "supplies" | "equipment" | "other",
      description: formData.description,
      vendor: formData.vendor,
      amount: formData.amount,
      taxAmount: formData.taxAmount,
      expenseDate: new Date(formData.expenseDate),
      paymentMethod: formData.paymentMethod as "cash" | "card" | "bank_transfer" | "check" | "other",
      referenceNumber: formData.referenceNumber,
      status: formData.status as "pending" | "paid" | "cancelled",
      notes: formData.notes,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const handleMarkPaid = () => {
    updateMutation.mutate({
      id: Number(id),
      status: "paid",
      paidAt: new Date(),
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />En attente</Badge>,
      paid: <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Payé</Badge>,
      cancelled: <Badge variant="destructive">Annulé</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      rent: "Loyer",
      utilities: "Services publics",
      insurance: "Assurance",
      maintenance: "Maintenance",
      salary: "Salaire",
      marketing: "Marketing",
      software: "Logiciel",
      supplies: "Fournitures",
      equipment: "Équipement",
      other: "Autre",
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: "Espèces",
      card: "Carte",
      bank_transfer: "Virement",
      check: "Chèque",
      other: "Autre",
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Receipt className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Dépense introuvable</p>
        <Link to="/expenses">
          <Button variant="outline">Retour aux dépenses</Button>
        </Link>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">{expense.description}</h1>
            <p className="text-muted-foreground">
              {getCategoryLabel(expense.category)} • {expense.vendor || "Fournisseur non spécifié"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              {expense.status === "pending" && (
                <Button size="sm" onClick={handleMarkPaid}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer payé
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de la dépense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Catégorie</p>
                      <p className="font-medium">{getCategoryLabel(expense.category)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <div className="mt-1">{getStatusBadge(expense.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fournisseur</p>
                      <p className="font-medium">{expense.vendor || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Référence</p>
                      <p className="font-medium">{expense.referenceNumber || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{expense.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date de dépense</p>
                      <p className="font-medium">
                        {format(new Date(expense.expenseDate), "PPP", { locale: fr })}
                      </p>
                    </div>
                    {expense.paidAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Payé le</p>
                        <p className="font-medium">
                          {format(new Date(expense.paidAt), "PPP", { locale: fr })}
                        </p>
                      </div>
                    )}
                  </div>

                  {expense.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="whitespace-pre-wrap text-sm">{expense.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
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
                      <Label htmlFor="status">Statut</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="paid">Payé</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de la dépense"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Fournisseur</Label>
                      <Input
                        id="vendor"
                        value={formData.vendor}
                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                        placeholder="Nom du fournisseur"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referenceNumber">N° Référence</Label>
                      <Input
                        id="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        placeholder="Facture/reçu #"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expenseDate">Date de dépense</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Notes additionnelles"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Détails de paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Méthode de paiement</p>
                    <p className="font-medium">
                      {expense.paymentMethod ? getPaymentMethodLabel(expense.paymentMethod) : "—"}
                    </p>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Montant</span>
                      <span className="font-medium">{expense.amount} {expense.currency}</span>
                    </div>
                    {expense.taxAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TVA</span>
                        <span className="font-medium">{expense.taxAmount} {expense.currency}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold">
                        {expense.taxAmount
                          ? (parseFloat(expense.amount) + parseFloat(expense.taxAmount)).toFixed(2)
                          : expense.amount} {expense.currency}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="card">Carte</SelectItem>
                        <SelectItem value="bank_transfer">Virement</SelectItem>
                        <SelectItem value="check">Chèque</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Devise</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">TVA</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      value={formData.taxAmount}
                      onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Métadonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="text-sm font-medium">
                  {format(new Date(expense.createdAt), "PPP", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modifié le</p>
                <p className="text-sm font-medium">
                  {format(new Date(expense.updatedAt), "PPP", { locale: fr })}
                </p>
              </div>
              {expense.isRecurring && (
                <div>
                  <Badge variant="outline" className="text-blue-600">
                    Dépense récurrente
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la dépense</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
