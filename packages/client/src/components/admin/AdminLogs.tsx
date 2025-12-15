import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AuditLog {
  id: number;
  createdAt: string | Date;
  userId?: number | null;
  action: string;
  category: string;
  details?: string | null;
}

export function AdminLogs() {
  const { data, isLoading } = trpc.admin.getLogs.useQuery({
    limit: 100,
    offset: 0,
  });

  if (isLoading) {
    return <div className="text-center py-12">Chargement des logs...</div>;
  }

  const logs = data?.logs || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs système</CardTitle>
            <CardDescription>
              Historique des activités et événements du système
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: AuditLog) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.createdAt).toLocaleString("fr-FR")}
                </TableCell>
                <TableCell>
                  {log.userId ? (
                    <Badge variant="outline">User #{log.userId}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Système</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge>{log.action}</Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {log.category}
                  </code>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {log.details || <span className="text-muted-foreground">-</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucun log disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}
