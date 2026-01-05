import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function SessionCreate() {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch related data for selects
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();
  const { data: subscription } = trpc.subscriptions.getCurrentSubscription.useQuery();

  // Create mutation with limit error handling
  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: (data) => {
      toast.success("Session créée avec succès");
      navigate(`/sessions/${data.id}`);
    },
    onError: (error: any) => {
      // Check if it's a session limit error
      if (error.data?.code === "FORBIDDEN" && error.message?.includes("session limit")) {
        setShowUpgradeModal(true);
      } else {
        toast.error(`Erreur: ${error.message}`);
      }
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientId: 0,
    roomId: 0,
    startTime: "",
    endTime: "",
    status: "scheduled" as const,
    totalAmount: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!formData.clientId) {
      toast.error("Le client est requis");
      return;
    }
    if (!formData.roomId) {
      toast.error("La salle est requise");
      return;
    }
    if (!formData.startTime) {
      toast.error("L'heure de début est requise");
      return;
    }
    if (!formData.endTime) {
      toast.error("L'heure de fin est requise");
      return;
    }

    // Submit
    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      clientId: formData.clientId,
      roomId: formData.roomId,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      status: formData.status,
      totalAmount: formData.totalAmount || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/sessions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Plus className="h-8 w-8 text-primary" />
              Nouvelle Session
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations de la session</CardTitle>
              <CardDescription className="text-sm">Remplissez les champs requis pour créer une nouvelle session</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-6">
            {/* Row 1: Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Session enregistrement album"
                required
              />
            </div>

            {/* Row 2: Client & Room */}
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
                <Label htmlFor="roomId">
                  Salle <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.roomId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, roomId: parseInt(value) })}
                >
                  <SelectTrigger id="roomId">
                    <SelectValue placeholder="Sélectionner une salle" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Start & End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">
                  Fin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 4: Status & Total Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="scheduled">Planifiée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Montant total</Label>
                <Input
                  id="totalAmount"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="Ex: 500.00"
                />
              </div>
            </div>

            {/* Row 5: Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la session..."
                rows={3}
              />
            </div>

            {/* Row 6: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes privées pour l'équipe..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Création..." : "Créer la session"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/sessions")}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          limitType="sessions"
          currentPlan={subscription?.subscriptionTier || "trial"}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
      </div>
    </div>
  );
}
