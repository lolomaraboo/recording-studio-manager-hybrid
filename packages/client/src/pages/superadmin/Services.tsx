import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";

export default function Services() {
  const { data: containers, isLoading: containersLoading, refetch: refetchContainers } =
    trpc.superadmin.listContainers.useQuery(undefined, {
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    });

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } =
    trpc.superadmin.getSystemMetrics.useQuery(undefined, {
      refetchInterval: 30000,
    });

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } =
    trpc.superadmin.aggregateHealth.useQuery(undefined, {
      refetchInterval: 30000,
    });

  const handleRefresh = () => {
    refetchContainers();
    refetchMetrics();
    refetchHealth();
    toast.success("Services refreshed");
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8 text-primary" />
              Service Monitoring
            </h2>
            <p className="text-sm text-muted-foreground">Docker containers, system metrics, and health checks</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Container Metrics */}
        <div className="grid gap-2 md:grid-cols-3">
        {metricsLoading ? (
          <>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
          </>
        ) : metrics ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total Containers</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{metrics.containers.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Running</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600">{metrics.containers.running}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Stopped</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-red-600">{metrics.containers.stopped}</div>
              </CardContent>
            </Card>
          </>
        ) : null}
        </div>

        {/* Docker Containers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Docker Containers</CardTitle>
            <CardDescription className="text-sm">Running services and their status</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
          {containersLoading ? (
            <Skeleton className="h-64" />
          ) : containers && containers.containers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Image</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.containers.map((container) => (
                  <TableRow key={container.id}>
                    <TableCell className="font-medium">{container.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        container.state === 'running' ? 'default' :
                        container.state === 'restarting' ? 'secondary' :
                        'destructive'
                      }>
                        {container.state}
                      </Badge>
                    </TableCell>
                    <TableCell>{container.uptime || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{container.image}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No containers found</p>
          )}
        </CardContent>
        </Card>

        {/* Health Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Health Checks</CardTitle>
            <CardDescription className="text-sm">System-wide health status</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
          {healthLoading ? (
            <Skeleton className="h-32" />
          ) : health ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Database</span>
                <Badge variant={health.database.status === 'ok' ? 'default' : 'destructive'}>
                  {health.database.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Docker</span>
                <Badge variant={health.docker.status === 'ok' ? 'default' : health.docker.status === 'warning' ? 'secondary' : 'destructive'}>
                  {health.docker.status}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No health data available</p>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
