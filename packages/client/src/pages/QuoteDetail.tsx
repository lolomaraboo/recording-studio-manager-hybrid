import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  XCircle,
  Calendar,
  User,
  FileText,
  Undo2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch quote data
  const { data: quote, isLoading, refetch } = trpc.quotes.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: vatRates } = trpc.vatRates.list.useQuery();

  // Mutations
  const updateMutation = trpc.quotes.update.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Devis mis à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Devis supprimé");
      navigate("/quotes");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const generatePDFMutation = trpc.quotes.generatePDF.useMutation({
    onSuccess: (result) => {
      // Decode base64 to binary
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and download
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`PDF téléchargé: ${result.filename}`);
    },
    onError: (error) => {
      toast.error(`Erreur PDF: ${error.message}`);
    },
  });

  const sendMutation = trpc.quotes.send.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Devis envoyé au client");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const acceptMutation = trpc.quotes.accept.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Devis accepté");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const rejectMutation = trpc.quotes.reject.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Devis refusé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const cancelMutation = trpc.quotes.cancel.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Devis annulé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const revertToDraftMutation = trpc.quotes.revertToDraft.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Devis remis en brouillon");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const convertMutation = trpc.quotes.convertToProject.useMutation({
    onSuccess: (result) => {
      utils.quotes.list.invalidate();
      toast.success("Projet créé à partir du devis");
      navigate(`/projects/${result.project.id}`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    quoteNumber: quote?.quoteNumber || "",
    clientId: quote?.clientId || 0,
    status: quote?.status || "draft",
    subtotal: quote?.subtotal || "",
    taxRate: quote?.taxRate || "20.00",
    taxAmount: quote?.taxAmount || "",
    total: quote?.total || "",
    validityDays: quote?.validityDays || 30,
    terms: quote?.terms || "",
    notes: quote?.notes || "",
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      data: {
        validityDays: formData.validityDays,
        notes: formData.notes,
        terms: formData.terms,
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
    generatePDFMutation.mutate({ quoteId: quote.id });
  };

  const handleSend = () => {
    if (!quote) return;
    sendMutation.mutate({ quoteId: quote.id });
  };

  const handleAccept = () => {
    if (!quote) return;
    acceptMutation.mutate({ quoteId: quote.id });
  };

  const handleReject = () => {
    if (!quote) return;
    rejectMutation.mutate({ quoteId: quote.id });
  };

  const handleCancel = () => {
    if (!quote) return;
    cancelMutation.mutate({ quoteId: quote.id });
  };

  const handleRevertToDraft = () => {
    if (!quote) return;
    revertToDraftMutation.mutate({ quoteId: quote.id });
  };

  const handleConvertToProject = () => {
    if (!quote) return;
    convertMutation.mutate({ quoteId: quote.id });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: "Brouillon", className: "bg-gray-100 text-gray-700 border-gray-200" },
      sent: { label: "Envoyé", className: "bg-blue-100 text-blue-700 border-blue-200" },
      accepted: { label: "Accepté", className: "bg-green-100 text-green-700 border-green-200" },
      rejected: { label: "Refusé", className: "bg-red-100 text-red-700 border-red-200" },
      expired: { label: "Expiré", className: "bg-amber-100 text-amber-700 border-amber-200" },
      cancelled: { label: "Annulé", className: "bg-gray-100 text-gray-500 border-gray-200" },
      converted_to_project: { label: "Converti", className: "bg-purple-100 text-purple-700 border-purple-200" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Devis introuvable</p>
        <Link to="/quotes">
          <Button variant="outline">Retour aux devis</Button>
        </Link>
      </div>
    );
  }

  const client = clients?.find((c: any) => c.id === quote.clientId);

  return (
    <>
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/quotes">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Devis {quote.quoteNumber}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <Link to={`/clients/${client?.id}`} className="hover:underline">{client?.name || "Client inconnu"}</Link>
                {client?.email && <span>• {client.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap ml-auto">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={handleDownloadPDF} disabled={generatePDFMutation.isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                {quote.status === "draft" && (
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSend} disabled={sendMutation.isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer
                  </Button>
                )}
                {quote.status === "sent" && !quote.isExpired && (
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAccept} disabled={acceptMutation.isPending}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accepter
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

        {/* Main Content */}
        <div className="space-y-4">
          {/* Quote Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Informations du devis</CardTitle>
                {getStatusBadge(quote.displayStatus || quote.status)}
              </div>
              <CardDescription className="text-sm">Détails et paramètres du devis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      placeholder="Notes visibles par le client"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terms">Conditions</Label>
                    <Textarea
                      id="terms"
                      value={formData.terms || ""}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      rows={3}
                      placeholder="Termes et conditions"
                    />
                  </div>

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
                </div>
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
                      <p className="text-sm font-medium">{quote.quoteNumber}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date de création</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(quote.createdAt), "dd MMMM yyyy", { locale: fr })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Validité</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {quote.validityDays || 30} jours
                        {quote.expiresAt && (
                          <span className="text-muted-foreground">
                            (expire le {format(new Date(quote.expiresAt), "dd MMM yyyy", { locale: fr })})
                          </span>
                        )}
                      </div>
                      {quote.isExpired && (
                        <p className="text-xs text-amber-600 mt-1">⚠️ Expiré</p>
                      )}
                    </div>
                  </div>

                  {quote.convertedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Converti le</p>
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <CheckCircle className="h-4 w-4" />
                        {format(new Date(quote.convertedAt), "dd MMMM yyyy", { locale: fr })}
                      </div>
                    </div>
                  )}

                  {/* Footer dates */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t mt-4">
                    <span>Créé le {format(new Date(quote.createdAt), "dd MMM yyyy", { locale: fr })}</span>
                    <span>•</span>
                    <span>Mise à jour le {format(new Date(quote.updatedAt), "dd MMM yyyy", { locale: fr })}</span>
                  </div>

                  {quote.isExpired && (
                    <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md mt-2">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        Devis expiré
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Créez un nouveau devis si nécessaire.
                      </p>
                    </div>
                  )}

                  {quote.status === "accepted" && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md mt-2">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Devis accepté par le client
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Items & Pricing Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Détails du devis</CardTitle>
              <CardDescription className="text-sm">Lignes et montants du devis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items table */}
              {quote.items && quote.items.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Quantité</TableHead>
                        <TableHead className="w-32">Prix unit.</TableHead>
                        <TableHead className="w-24">TVA</TableHead>
                        <TableHead className="w-32 text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quote.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-left">{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{parseFloat(item.unitPrice).toFixed(2)} €</TableCell>
                          <TableCell>{vatRates?.find((r: any) => r.id === item.vatRateId)?.rate || "20"}%</TableCell>
                          <TableCell className="text-right">{parseFloat(item.amount).toFixed(2)} €</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune ligne de détail</p>
              )}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="font-medium">
                    {parseFloat(quote.subtotal || "0").toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}€
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    TVA ({parseFloat(quote.taxRate || "20").toFixed(0)}%)
                  </span>
                  <span className="font-medium">
                    {parseFloat(quote.taxAmount || "0").toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}€
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total TTC</span>
                  <span className="text-primary">
                    {parseFloat(quote.total || "0").toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}€
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes et conditions</CardTitle>
              <CardDescription className="text-sm">Notes et conditions du devis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.notes ? (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                </div>
              ) : null}
              {quote.terms ? (
                <div>
                  <p className="text-sm font-medium mb-1">Conditions</p>
                  <p className="text-sm whitespace-pre-wrap">{quote.terms}</p>
                </div>
              ) : null}
              {!quote.notes && !quote.terms && (
                <p className="text-sm text-muted-foreground">Aucune note</p>
              )}
            </CardContent>
          </Card>

          {/* Actions Card - State Transitions */}
          {!isEditing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
                <CardDescription className="text-sm">Transitions de statut du devis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {/* DRAFT: Can send or cancel */}
                  {quote.status === "draft" && (
                    <>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSend} disabled={sendMutation.isPending}>
                        <Send className="h-4 w-4 mr-2" />
                        {sendMutation.isPending ? "Envoi..." : "Envoyer au client"}
                      </Button>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Annuler le devis
                      </Button>
                    </>
                  )}

                  {/* SENT: Can accept, reject, or revert */}
                  {quote.status === "sent" && !quote.isExpired && (
                    <>
                      <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAccept} disabled={acceptMutation.isPending}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accepter
                      </Button>
                      <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                      <Button variant="secondary" onClick={handleRevertToDraft} disabled={revertToDraftMutation.isPending}>
                        <Undo2 className="h-4 w-4 mr-2" />
                        Remettre en brouillon
                      </Button>
                    </>
                  )}

                  {/* ACCEPTED: Can convert to project */}
                  {quote.status === "accepted" && (
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleConvertToProject} disabled={convertMutation.isPending}>
                      <FileText className="h-4 w-4 mr-2" />
                      {convertMutation.isPending ? "Conversion..." : "Convertir en projet"}
                    </Button>
                  )}

                  {/* EXPIRED: Show message */}
                  {quote.isExpired && (
                    <p className="text-sm text-muted-foreground">
                      Ce devis a expiré. Créez un nouveau devis si nécessaire.
                    </p>
                  )}

                  {/* CANCELLED/REJECTED: Can revert to draft */}
                  {(quote.status === "cancelled" || quote.status === "rejected") && (
                    <Button variant="secondary" onClick={handleRevertToDraft} disabled={revertToDraftMutation.isPending}>
                      <Undo2 className="h-4 w-4 mr-2" />
                      Remettre en brouillon
                    </Button>
                  )}

                  {/* CONVERTED: No actions */}
                  {quote.status === "converted_to_project" && (
                    <p className="text-sm text-muted-foreground">
                      Ce devis a été converti en projet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>

    {/* Delete Dialog */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le devis</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.
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
    </>
  );
}
