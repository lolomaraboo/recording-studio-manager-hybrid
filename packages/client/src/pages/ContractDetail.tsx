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
  Download,
  Send,
  FileText,
  User,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch contract data
  const { data: contract, isLoading, refetch } = trpc.contracts.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  // Mutations
  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      toast.success("Contrat mis à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrat supprimé");
      navigate("/contracts");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    contractNumber: contract?.contractNumber || "",
    clientId: contract?.clientId || 0,
    title: contract?.title || "",
    description: contract?.description || "",
    type: contract?.type || "recording",
    status: contract?.status || "draft",
    startDate: contract?.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : "",
    endDate: contract?.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : "",
    value: contract?.value || "",
    terms: contract?.terms || "",
  });

  // Update form when contract loads
  useState(() => {
    if (contract) {
      setFormData({
        contractNumber: contract.contractNumber,
        clientId: contract.clientId,
        title: contract.title,
        description: contract.description || "",
        type: contract.type,
        status: contract.status,
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : "",
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : "",
        value: contract.value || "",
        terms: contract.terms,
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      title: formData.title,
      description: formData.description,
      status: formData.status as "draft" | "sent" | "pending_signature" | "signed" | "active" | "expired" | "terminated" | "cancelled",
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      value: formData.value,
      terms: formData.terms,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const handleDownloadPDF = () => {
    toast.info(`Téléchargement contrat ${contract?.contractNumber} - À implémenter`);
  };

  const handleSendForSignature = () => {
    toast.info("Envoi pour signature électronique - À implémenter");
  };

  const handleMarkSigned = () => {
    updateMutation.mutate({
      id: Number(id),
      status: "signed",
      signedAt: new Date(),
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: <Badge variant="secondary">Brouillon</Badge>,
      sent: <Badge className="bg-blue-500">Envoyé</Badge>,
      pending_signature: <Badge className="bg-yellow-500">En attente signature</Badge>,
      signed: <Badge className="bg-green-500">Signé</Badge>,
      active: <Badge className="bg-green-600">Actif</Badge>,
      expired: <Badge variant="outline" className="text-gray-500">Expiré</Badge>,
      terminated: <Badge variant="destructive">Résilié</Badge>,
      cancelled: <Badge variant="outline">Annulé</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getTypeBadge = (type: string) => {
    const types = {
      recording: "Enregistrement",
      mixing: "Mixage",
      mastering: "Mastering",
      production: "Production",
      exclusivity: "Exclusivité",
      distribution: "Distribution",
      studio_rental: "Location studio",
      services: "Services",
      partnership: "Partenariat",
      other: "Autre",
    };
    return types[type as keyof typeof types] || type;
  };

  if (isLoading) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container pt-2 pb-4 px-2">
        <div className="text-center py-6">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Contrat introuvable</p>
          <Link to="/contracts">
            <Button variant="outline" size="sm">Retour aux contrats</Button>
          </Link>
        </div>
      </div>
    );
  }

  const client = clients?.find((c: any) => c.id === contract.clientId);

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/contracts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{contract.title}</h1>
            <p className="text-muted-foreground">
              {contract.contractNumber} • {client ? client.name : "Client non trouvé"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              {(contract.status === "draft" || contract.status === "sent") && (
                <Button variant="outline" size="sm" onClick={handleSendForSignature}>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              )}
              {contract.status === "pending_signature" && (
                <Button size="sm" onClick={handleMarkSigned}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer signé
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-2">
            {/* Contract Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations du contrat</CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">N° Contrat</p>
                      <p className="font-medium">{contract.contractNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{getTypeBadge(contract.type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <div className="mt-1">{getStatusBadge(contract.status)}</div>
                    </div>
                    {contract.value && (
                      <div>
                        <p className="text-sm text-muted-foreground">Valeur</p>
                        <p className="font-medium">{contract.value} €</p>
                      </div>
                    )}
                  </div>

                  {contract.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="whitespace-pre-wrap">{contract.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {contract.startDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date de début</p>
                        <p className="font-medium">
                          {format(new Date(contract.startDate), "PPP", { locale: fr })}
                        </p>
                      </div>
                    )}
                    {contract.endDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date de fin</p>
                        <p className="font-medium">
                          {format(new Date(contract.endDate), "PPP", { locale: fr })}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractNumber">N° Contrat</Label>
                      <Input
                        id="contractNumber"
                        value={formData.contractNumber}
                        onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recording">Enregistrement</SelectItem>
                          <SelectItem value="mixing">Mixage</SelectItem>
                          <SelectItem value="mastering">Mastering</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="exclusivity">Exclusivité</SelectItem>
                          <SelectItem value="distribution">Distribution</SelectItem>
                          <SelectItem value="studio_rental">Location studio</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="partnership">Partenariat</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="sent">Envoyé</SelectItem>
                          <SelectItem value="pending_signature">En attente signature</SelectItem>
                          <SelectItem value="signed">Signé</SelectItem>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                          <SelectItem value="terminated">Résilié</SelectItem>
                          <SelectItem value="cancelled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Valeur (€)</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre du contrat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Description du contrat"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Conditions contractuelles</CardTitle>
              </CardHeader>
            <CardContent>
              {!isEditing ? (
                <p className="whitespace-pre-wrap text-sm">{contract.terms}</p>
              ) : (
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={10}
                  placeholder="Conditions et clauses du contrat"
                />
              )}
            </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-2">
            {/* Client Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
            <CardContent>
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
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="text-sm font-medium">
                  {format(new Date(contract.createdAt), "PPP", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modifié le</p>
                <p className="text-sm font-medium">
                  {format(new Date(contract.updatedAt), "PPP", { locale: fr })}
                </p>
              </div>
              {contract.signedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Signé le</p>
                  <p className="text-sm font-medium">
                    {format(new Date(contract.signedAt), "PPP", { locale: fr })}
                  </p>
                  {contract.signedBy && (
                    <p className="text-sm text-muted-foreground">Par : {contract.signedBy}</p>
                  )}
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
            <DialogTitle>Supprimer le contrat</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.
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
