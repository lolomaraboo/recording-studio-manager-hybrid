import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Plus, Copy, Trash2, Link as LinkIcon, Eye, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Shares() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedShareId, setSelectedShareId] = useState<number | null>(null);

  const { data: sharesData, refetch } = trpc.shares.list.useQuery({});
  const { data: stats } = trpc.shares.getStats.useQuery();

  const deleteMutation = trpc.shares.delete.useMutation({
    onSuccess: () => {
      toast.success("Partage supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié dans le presse-papiers");
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce partage ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleViewDetails = (id: number) => {
    setSelectedShareId(id);
    setIsViewDialogOpen(true);
  };

  const getResourceTypeBadge = (type: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      project: { variant: "default", label: "Projet" },
      file: { variant: "secondary", label: "Fichier" },
      invoice: { variant: "outline", label: "Facture" },
    };

    const config = variants[type] || variants.project;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <AppLayout>
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Partages</h1>
          <p className="text-muted-foreground">
            Gérez vos liens de partage sécurisés
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau partage
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Actifs</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats.active}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expirés</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {stats.expired}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Accès totaux</CardDescription>
              <CardTitle className="text-3xl">{stats.totalAccess}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Liste des partages */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des partages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Ressource ID</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Accès</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharesData?.map((share) => (
                <TableRow key={share.id}>
                  <TableCell>{getResourceTypeBadge(share.resourceType)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    #{share.resourceId}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {share.canView && (
                        <Badge variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Badge>
                      )}
                      {share.canDownload && (
                        <Badge variant="outline" className="text-xs">
                          <Download className="h-3 w-3 mr-1" />
                          Télécharger
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{share.accessCount || 0}</TableCell>
                  <TableCell>
                    {share.expiresAt ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(share.expiresAt).toLocaleDateString("fr-FR")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Jamais</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isExpired(share.expiresAt) ? (
                      <Badge variant="destructive">Expiré</Badge>
                    ) : (
                      <Badge variant="default">Actif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(share.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(share.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(share.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!sharesData || sharesData.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    Aucun partage trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <CreateShareDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />

      {/* Dialog de visualisation */}
      {selectedShareId && (
        <ViewShareDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          shareId={selectedShareId}
        />
      )}
    </div>
    </AppLayout>
  );
}

// Composant de création de partage
function CreateShareDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [resourceType, setResourceType] = useState<string>("file");
  const [resourceId, setResourceId] = useState<string>("");
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [password, setPassword] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const createMutation = trpc.shares.create.useMutation({
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
      toast.success("Partage créé avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!resourceId) {
      toast.error("Veuillez sélectionner une ressource");
      return;
    }

    createMutation.mutate({
      resourceType: resourceType as any,
      resourceId: parseInt(resourceId),
      canView,
      canDownload,
      expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
      password: password || undefined,
    });
  };

  const handleCopyAndClose = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié dans le presse-papiers");
      onSuccess();
      setShareUrl(null);
      setResourceId("");
      setExpiresInDays("");
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau partage</DialogTitle>
          <DialogDescription>
            Créez un lien de partage sécurisé pour une ressource
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4">
            <div>
              <Label>Type de ressource *</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Projet</SelectItem>
                  <SelectItem value="file">Fichier</SelectItem>
                  <SelectItem value="invoice">Facture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ID de la ressource *</Label>
              <Input
                type="number"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                placeholder="123"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Autoriser la visualisation</Label>
                <Switch checked={canView} onCheckedChange={setCanView} />
              </div>

              <div className="flex items-center justify-between">
                <Label>Autoriser le téléchargement</Label>
                <Switch
                  checked={canDownload}
                  onCheckedChange={setCanDownload}
                />
              </div>
            </div>

            <div>
              <Label>Expiration (jours)</Label>
              <Input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="7, 30, 90... (vide = jamais)"
                min="1"
                max="365"
              />
            </div>

            <div>
              <Label>Mot de passe (optionnel)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laissez vide pour pas de protection"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Création..." : "Créer le partage"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <Label>Lien de partage créé</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={shareUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Lien copié");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCopyAndClose}>
                <Copy className="h-4 w-4 mr-2" />
                Copier et fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Composant de visualisation de partage
function ViewShareDialog({
  open,
  onOpenChange,
  shareId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareId: number;
}) {
  const { data: share } = trpc.shares.getById.useQuery(
    { id: shareId },
    { enabled: open }
  );

  if (!share) return null;

  const shareUrl = `${window.location.origin}/share/${share.token}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails du partage</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Lien de partage</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input value={shareUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Lien copié");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type de ressource</Label>
              <p className="text-sm mt-1">{share.resourceType}</p>
            </div>
            <div>
              <Label>ID de la ressource</Label>
              <p className="text-sm mt-1">#{share.resourceId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre d'accès</Label>
              <p className="text-sm mt-1">{share.accessCount || 0}</p>
            </div>
            <div>
              <Label>Dernier accès</Label>
              <p className="text-sm mt-1">
                {share.lastAccessedAt
                  ? new Date(share.lastAccessedAt).toLocaleString("fr-FR")
                  : "Jamais"}
              </p>
            </div>
          </div>

          {share.accessLogs && share.accessLogs.length > 0 && (
            <div>
              <Label>Derniers accès</Label>
              <div className="mt-2 space-y-2">
                {share.accessLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="text-sm p-2 bg-muted rounded flex justify-between"
                  >
                    <span>{log.ipAddress || "Inconnu"}</span>
                    <span className="text-muted-foreground">
                      {new Date(log.accessedAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
