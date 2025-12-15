import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

export function AdminConfig() {
  const { data: config, isLoading } = trpc.admin.getConfig.useQuery();
  const [formData, setFormData] = useState({
    siteName: "",
    maintenanceMode: false,
    allowRegistration: true,
    maxOrganizationsPerUser: 5,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        siteName: "Recording Studio Manager",
        maintenanceMode: config.maintenanceMode,
        allowRegistration: config.allowRegistration,
        maxOrganizationsPerUser: config.maxUsersPerOrg,
      });
    }
  }, [config]);

  const updateMutation = trpc.admin.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration mise à jour avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-center py-12">Chargement de la configuration...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration système
        </CardTitle>
        <CardDescription>
          Paramètres globaux de l'application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nom du site</Label>
            <Input
              id="siteName"
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              placeholder="Recording Studio Manager"
            />
            <p className="text-sm text-muted-foreground">
              Le nom affiché dans le header et les emails
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOrganizations">
              Nombre maximum d'organisations par utilisateur
            </Label>
            <Input
              id="maxOrganizations"
              type="number"
              min="1"
              max="100"
              value={formData.maxOrganizationsPerUser}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxOrganizationsPerUser: parseInt(e.target.value),
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Limite le nombre d'organisations qu'un utilisateur peut créer
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Mode maintenance</Label>
              <p className="text-sm text-muted-foreground">
                Désactive l'accès au site pour les utilisateurs non-admin
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={formData.maintenanceMode}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, maintenanceMode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="allowRegistration">Autoriser les inscriptions</Label>
              <p className="text-sm text-muted-foreground">
                Permet aux nouveaux utilisateurs de créer un compte
              </p>
            </div>
            <Switch
              id="allowRegistration"
              checked={formData.allowRegistration}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowRegistration: checked })
              }
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
