import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: number;
  name: string;
  subdomain: string;
  ownerId: number;
  subscriptionPlan?: string | null;
  isActive: boolean;
  createdAt: string | Date;
}

export function AdminOrganizations() {
  const { data, isLoading } = trpc.admin.listOrganizations.useQuery();

  if (isLoading) {
    return <div className="text-center py-12">Chargement des organisations...</div>;
  }

  const organizations = data?.organizations || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des organisations</CardTitle>
            <CardDescription>
              Gérez les studios et leurs paramètres
            </CardDescription>
          </div>
          <Button onClick={() => toast.info("Fonctionnalité à venir")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle organisation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Sous-domaine</TableHead>
              <TableHead>Propriétaire ID</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org: Organization) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {org.name}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {org.subdomain}
                  </code>
                </TableCell>
                <TableCell>{org.ownerId}</TableCell>
                <TableCell>
                  {org.subscriptionPlan ? (
                    <Badge variant="outline">{org.subscriptionPlan}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Aucun</span>
                  )}
                </TableCell>
                <TableCell>
                  {org.isActive ? (
                    <Badge variant="default">Actif</Badge>
                  ) : (
                    <Badge variant="destructive">Inactif</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.info("Fonctionnalité à venir")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {organizations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucune organisation trouvée
          </div>
        )}
      </CardContent>
    </Card>
  );
}
