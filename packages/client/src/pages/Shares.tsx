import { useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2,
  Plus,
  Link2,
  Copy,
  Trash2,
  Eye,
  Download,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface Share {
  id: number;
  projectName: string;
  trackName?: string;
  recipientEmail: string;
  shareLink: string;
  expiresAt: Date;
  accessCount: number;
  maxAccess?: number;
  status: "active" | "expired" | "revoked";
  createdAt: Date;
}

export default function Shares() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  // Mock data
  const shares: Share[] = [
    {
      id: 1,
      projectName: "Album Jazz 2025",
      trackName: "Blue Notes",
      recipientEmail: "marie.dubois@email.com",
      shareLink: "https://rsm.studio/share/abc123def456",
      expiresAt: new Date(2026, 0, 15),
      accessCount: 5,
      maxAccess: 10,
      status: "active",
      createdAt: new Date(2025, 11, 20),
    },
    {
      id: 2,
      projectName: "Podcast Episode 12",
      recipientEmail: "thomas.martin@email.com",
      shareLink: "https://rsm.studio/share/xyz789ghi012",
      expiresAt: new Date(2026, 0, 1),
      accessCount: 12,
      status: "active",
      createdAt: new Date(2025, 11, 15),
    },
    {
      id: 3,
      projectName: "Démo Rock Band",
      trackName: "Thunder Road",
      recipientEmail: "sophie.bernard@email.com",
      shareLink: "https://rsm.studio/share/jkl345mno678",
      expiresAt: new Date(2025, 11, 10),
      accessCount: 3,
      maxAccess: 5,
      status: "expired",
      createdAt: new Date(2025, 10, 25),
    },
  ];

  const copyToClipboard = (link: string, id: number) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    toast.success("Lien copié dans le presse-papiers");
    setTimeout(() => setCopied(null), 2000);
  };

  const revokeShare = (id: number) => {
    // TODO: Implement revoke logic
    toast.success("Partage révoqué");
  };

  const getStatusBadge = (status: Share["status"]) => {
    const variants = {
      active: { variant: "default" as const, label: "Actif" },
      expired: { variant: "secondary" as const, label: "Expiré" },
      revoked: { variant: "destructive" as const, label: "Révoqué" },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activeShares = shares.filter((s) => s.status === "active");
  const expiredShares = shares.filter((s) => s.status === "expired" || s.status === "revoked");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Partages</h2>
          <p className="text-muted-foreground">
            Partagez vos fichiers audio avec vos clients
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau partage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un partage</DialogTitle>
              <DialogDescription>
                Générez un lien sécurisé pour partager vos fichiers audio
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project">Projet *</Label>
                <Select>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Album Jazz 2025</SelectItem>
                    <SelectItem value="2">Podcast Episode 12</SelectItem>
                    <SelectItem value="3">Démo Rock Band</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="track">Track (optionnel)</Label>
                <Select>
                  <SelectTrigger id="track">
                    <SelectValue placeholder="Projet entier ou track spécifique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Projet entier</SelectItem>
                    <SelectItem value="1">Blue Notes</SelectItem>
                    <SelectItem value="2">Midnight Jazz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email du destinataire *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expires">Expiration</Label>
                  <Select defaultValue="7">
                    <SelectTrigger id="expires">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 jour</SelectItem>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                      <SelectItem value="never">Jamais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAccess">Accès maximum</Label>
                  <Select defaultValue="unlimited">
                    <SelectTrigger id="maxAccess">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 fois</SelectItem>
                      <SelectItem value="5">5 fois</SelectItem>
                      <SelectItem value="10">10 fois</SelectItem>
                      <SelectItem value="unlimited">Illimité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  readOnly
                  value="https://rsm.studio/share/[généré après création]"
                  className="bg-transparent border-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                toast.success("Partage créé avec succès");
                setIsCreateDialogOpen(false);
              }}>
                Créer le partage
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Partages actifs</CardDescription>
            <CardTitle className="text-3xl">{activeShares.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total accès ce mois</CardDescription>
            <CardTitle className="text-3xl">
              {shares.reduce((acc, s) => acc + s.accessCount, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Partages expirés</CardDescription>
            <CardTitle className="text-3xl">{expiredShares.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Actifs ({activeShares.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expirés ({expiredShares.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Tous ({shares.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet / Track</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Lien</TableHead>
                    <TableHead>Accès</TableHead>
                    <TableHead>Expire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeShares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{share.projectName}</p>
                          {share.trackName && (
                            <p className="text-xs text-muted-foreground">
                              {share.trackName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{share.recipientEmail}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {share.shareLink.slice(0, 30)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              copyToClipboard(share.shareLink, share.id)
                            }
                          >
                            {copied === share.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {share.accessCount}
                        {share.maxAccess && ` / ${share.maxAccess}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {share.expiresAt.toLocaleDateString("fr-FR")}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(share.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeShare(share.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet / Track</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Accès total</TableHead>
                    <TableHead>Expiré le</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiredShares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{share.projectName}</p>
                          {share.trackName && (
                            <p className="text-xs text-muted-foreground">
                              {share.trackName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{share.recipientEmail}</TableCell>
                      <TableCell>{share.accessCount}</TableCell>
                      <TableCell>
                        {share.expiresAt.toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>{getStatusBadge(share.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet / Track</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Lien</TableHead>
                    <TableHead>Accès</TableHead>
                    <TableHead>Expire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{share.projectName}</p>
                          {share.trackName && (
                            <p className="text-xs text-muted-foreground">
                              {share.trackName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{share.recipientEmail}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {share.shareLink.slice(0, 30)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {share.accessCount}
                        {share.maxAccess && ` / ${share.maxAccess}`}
                      </TableCell>
                      <TableCell>
                        {share.expiresAt.toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>{getStatusBadge(share.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
