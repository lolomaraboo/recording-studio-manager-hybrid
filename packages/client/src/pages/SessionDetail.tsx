import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Calendar, Clock, MapPin, User, Edit, Trash2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch session data
  const { data: session, isLoading, refetch } = trpc.sessions.get.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch related data
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();

  // Mutations
  const updateMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Session mise à jour");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      toast.success("Session supprimée");
      navigate("/sessions");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    title: session?.title || "",
    description: session?.description || "",
    clientId: session?.clientId || 0,
    roomId: session?.roomId || 0,
    startTime: session?.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : "",
    endTime: session?.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : "",
    status: session?.status || "scheduled",
    totalAmount: session?.totalAmount || "",
    notes: session?.notes || "",
  });

  // Update form when session loads
  useState(() => {
    if (session) {
      setFormData({
        title: session.title,
        description: session.description || "",
        clientId: session.clientId,
        roomId: session.roomId,
        startTime: new Date(session.startTime).toISOString().slice(0, 16),
        endTime: new Date(session.endTime).toISOString().slice(0, 16),
        status: session.status,
        totalAmount: session.totalAmount || "",
        notes: session.notes || "",
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: Number(id),
      data: {
        title: formData.title,
        description: formData.description,
        clientId: formData.clientId,
        roomId: formData.roomId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        status: formData.status as "scheduled" | "in_progress" | "completed" | "cancelled",
        totalAmount: formData.totalAmount,
        notes: formData.notes,
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: Number(id) });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      scheduled: { variant: "outline", label: "Programmée" },
      in_progress: { variant: "default", label: "En cours" },
      completed: { variant: "secondary", label: "Terminée" },
      cancelled: { variant: "destructive", label: "Annulée" },
    };

    const config = variants[status] || variants.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const client = clients?.find((c) => c.id === session?.clientId);
  const room = rooms?.find((r) => r.id === session?.roomId);

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

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/sessions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Session introuvable</h1>
          </div>
        </header>
        <main className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Cette session n'existe pas ou a été supprimée.</p>
              <Button className="mt-4" asChild>
                <Link to="/sessions">Retour aux sessions</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/sessions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{session.title}</h1>
              <p className="text-sm text-muted-foreground">Session #{session.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
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
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Session Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de la session</CardTitle>
                <CardDescription>Détails et paramètres de la session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
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

                      <div className="space-y-2">
                        <Label htmlFor="room">Salle</Label>
                        <Select
                          value={String(formData.roomId)}
                          onValueChange={(value) => setFormData({ ...formData, roomId: Number(value) })}
                        >
                          <SelectTrigger id="room">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms?.map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Début</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">Fin</Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="status">Statut</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Programmée</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="totalAmount">Montant (€)</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          step="0.01"
                          value={formData.totalAmount}
                          onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{session.description || "Aucune description"}</p>
                    </div>

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
                        <p className="text-sm text-muted-foreground mb-1">Salle</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <Link to={`/rooms/${room?.id}`} className="text-sm hover:underline">
                            {room?.name || "N/A"}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Date & Heure</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.startTime), "dd MMMM yyyy", { locale: fr })}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(new Date(session.startTime), "HH:mm")} -{" "}
                            {format(new Date(session.endTime), "HH:mm")}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Statut</p>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>

                    {session.totalAmount && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Montant</p>
                        <p className="text-2xl font-semibold">
                          {(parseFloat(session.totalAmount) / 100).toFixed(2)}€
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Notes et commentaires sur la session</CardDescription>
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
                  <p className="text-sm whitespace-pre-wrap">
                    {session.notes || "Aucune note"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <p className="text-sm font-medium capitalize">{session.type || "Recording"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Durée</p>
                  <p className="text-sm font-medium">
                    {Math.round(
                      (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) /
                        (1000 * 60 * 60)
                    )}{" "}
                    heures
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créée le</p>
                  <p className="text-sm">
                    {format(new Date(session.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mise à jour</p>
                  <p className="text-sm">
                    {format(new Date(session.updatedAt), "dd MMM yyyy", { locale: fr })}
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
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/clients/${session.clientId}`}>Voir le client</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/rooms/${session.roomId}`}>Voir la salle</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/calendar">Voir dans le calendrier</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la session</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.
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
