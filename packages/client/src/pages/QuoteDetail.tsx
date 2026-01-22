import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleConvertToProject = () => {
    if (!quote) return;
    convertMutation.mutate({ quoteId: quote.id });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      draft: <Badge variant="secondary">Brouillon</Badge>,
      sent: <Badge className="bg-blue-500">Envoyé</Badge>,
      accepted: <Badge className="bg-green-500">Accepté</Badge>,
      rejected: <Badge variant="destructive">Refusé</Badge>,
      expired: <Badge variant="outline" className="text-gray-500">Expiré</Badge>,
      cancelled: <Badge variant="secondary">Annulé</Badge>,
      converted_to_project: <Badge className="bg-purple-500">Converti</Badge>,
    };
    return badges[status] || badges.draft;
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
            <h1 className="text-3xl font-bold">Devis {quote.quoteNumber}</h1>
            <p className="text-muted-foreground">
              {client ? `${client.name}` : "Client non trouvé"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={generatePDFMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                {generatePDFMutation.isPending ? "Génération..." : "Télécharger PDF"}
              </Button>
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
          {/* Quote Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations du devis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">N° Devis</p>
                      <p className="font-medium">{quote.quoteNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <div className="mt-1">{getStatusBadge(quote.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date de création</p>
                      <p className="font-medium">
                        {format(new Date(quote.createdAt), "PPP", { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Validité</p>
                      <p className="font-medium">{quote.validityDays || 30} jours</p>
                    </div>
                    {quote.expiresAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Expire le</p>
                        <p className="font-medium">
                          {format(new Date(quote.expiresAt), "PPP", { locale: fr })}
                        </p>
                      </div>
                    )}
                  </div>
                  {quote.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="whitespace-pre-wrap">{quote.notes}</p>
                    </div>
                  )}
                </>
              ) : (
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
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Montants</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{quote.subtotal} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    TVA ({quote.taxRate}%)
                  </span>
                  <span className="font-medium">{quote.taxAmount} €</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold">{quote.total} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Notes */}
          {(quote.terms || quote.notes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Conditions et notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {quote.terms && (
                  <div>
                    <p className="text-sm font-medium mb-2">Conditions</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {quote.terms}
                    </p>
                  </div>
                )}
                {quote.notes && (
                  <div>
                    <p className="text-sm font-medium mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {quote.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions Section - State Transitions */}
          {!isEditing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {/* DRAFT: Can send or cancel */}
                  {quote.status === "draft" && (
                    <>
                      <Button onClick={handleSend} disabled={sendMutation.isPending}>
                        <Send className="h-4 w-4 mr-2" />
                        {sendMutation.isPending ? "Envoi..." : "Envoyer au client"}
                      </Button>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </>
                  )}

                  {/* SENT: Can accept, reject, or cancel */}
                  {quote.status === "sent" && !quote.isExpired && (
                    <>
                      <Button onClick={handleAccept} disabled={acceptMutation.isPending}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accepter
                      </Button>
                      <Button variant="outline" onClick={handleReject} disabled={rejectMutation.isPending}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
                        Annuler
                      </Button>
                    </>
                  )}

                  {/* ACCEPTED: Can convert to project */}
                  {quote.status === "accepted" && (
                    <Button onClick={handleConvertToProject} disabled={convertMutation.isPending}>
                      <FileText className="h-4 w-4 mr-2" />
                      {convertMutation.isPending ? "Conversion..." : "Convertir en projet"}
                    </Button>
                  )}

                  {/* EXPIRED: Show message */}
                  {quote.isExpired && (
                    <div className="text-sm text-muted-foreground">
                      Ce devis a expiré. Créez un nouveau devis si nécessaire.
                    </div>
                  )}

                  {/* REJECTED/CANCELLED/CONVERTED: No actions */}
                  {(quote.status === "rejected" || quote.status === "cancelled" || quote.status === "converted_to_project") && (
                    <div className="text-sm text-muted-foreground">
                      Aucune action disponible pour ce devis.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {client ? (
                <div className="space-y-2">
                  <p className="font-medium">{client.name}</p>
                  {client.email && (
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  )}
                  {client.phone && (
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  )}
                  <Link to={`/clients/${client.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Voir le profil
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Client non trouvé</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Métadonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="text-sm font-medium">
                  {format(new Date(quote.createdAt), "PPP", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modifié le</p>
                <p className="text-sm font-medium">
                  {format(new Date(quote.updatedAt), "PPP", { locale: fr })}
                </p>
              </div>
              {quote.convertedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Converti le</p>
                  <p className="text-sm font-medium">
                    {format(new Date(quote.convertedAt), "PPP", { locale: fr })}
                  </p>
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
      </div>
    </div>
  );
}
