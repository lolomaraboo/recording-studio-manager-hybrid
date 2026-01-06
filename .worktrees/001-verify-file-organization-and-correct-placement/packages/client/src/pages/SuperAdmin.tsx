import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Server, Database, FileText, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { data: authUser } = trpc.auth.me.useQuery();

  // Check if user is superadmin
  const SUPERADMIN_EMAIL = 'admin@recording-studio-manager.com';
  const envEmail = import.meta.env.VITE_SUPERADMIN_EMAIL as string || SUPERADMIN_EMAIL;
  const userEmail = authUser?.user?.email;
  const isSuperAdmin = userEmail === envEmail;

  // Debug logging
  console.log('[SuperAdmin] Auth check:', {
    userEmail,
    envEmail,
    SUPERADMIN_EMAIL,
    isSuperAdmin,
    authUser: authUser ? 'loaded' : 'loading'
  });

  useEffect(() => {
    if (authUser && !isSuperAdmin) {
      console.log('[SuperAdmin] Access denied, redirecting...');
      toast.error("Accès refusé - Superadmin uniquement");
      navigate("/dashboard");
    }
  }, [authUser, isSuperAdmin, navigate]);

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Production system monitoring and management</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">
            <Server className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseTab />
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Services Tab Component
function ServicesTab() {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service Monitoring</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Container Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {metricsLoading ? (
          <>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
          </>
        ) : metrics ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Containers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.containers.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Running</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.containers.running}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Stopped</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.containers.stopped}</div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Docker Containers */}
      <Card>
        <CardHeader>
          <CardTitle>Docker Containers</CardTitle>
          <CardDescription>Running services and their status</CardDescription>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle>Health Checks</CardTitle>
          <CardDescription>System-wide health status</CardDescription>
        </CardHeader>
        <CardContent>
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
  );
}

// Database Tab Component
function DatabaseTab() {
  const [searchOrg, setSearchOrg] = useState("");
  const [searchUser, setSearchUser] = useState("");

  const { data: organizations, isLoading: orgsLoading } =
    trpc.superadmin.listOrganizations.useQuery({});

  const { data: users, isLoading: usersLoading } =
    trpc.superadmin.listUsers.useQuery({});

  const { data: tenantStats, isLoading: statsLoading } =
    trpc.superadmin.getTenantStats.useQuery();

  // Filter organizations by search
  const filteredOrgs = organizations?.organizations.filter((org) =>
    org.name.toLowerCase().includes(searchOrg.toLowerCase())
  );

  // Filter users by search
  const filteredUsers = users?.users.filter((user) =>
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Database Management</h2>

      {/* Tenant Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {statsLoading ? (
          <>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
          </>
        ) : tenantStats && tenantStats.tenantStats.length > 0 ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenantStats.tenantStats.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total DB Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenantStats.tenantStats.reduce((sum, t) => sum + t.sizeMB, 0)} MB
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Size/Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(tenantStats.tenantStats.reduce((sum, t) => sum + t.sizeMB, 0) / tenantStats.tenantStats.length)} MB
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>All registered organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search organizations..."
              value={searchOrg}
              onChange={(e) => setSearchOrg(e.target.value)}
            />
            {orgsLoading ? (
              <Skeleton className="h-64" />
            ) : filteredOrgs && filteredOrgs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Tenant DB</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{org.subdomain}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{org.tenantDbName || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.subscriptionTier || 'Free'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(org.createdAt), 'PP', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No organizations found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>All registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search users by email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            {usersLoading ? (
              <Skeleton className="h-64" />
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), 'PP', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Logs Tab Component
function LogsTab() {
  const [selectedContainer, setSelectedContainer] = useState<string>("");

  const { data: containers } = trpc.superadmin.listContainers.useQuery();

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } =
    trpc.superadmin.getContainerLogs.useQuery(
      { containerId: selectedContainer },
      { enabled: !!selectedContainer }
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Container Logs</h2>
        <Button
          onClick={() => refetchLogs()}
          variant="outline"
          size="sm"
          disabled={!selectedContainer}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Container</CardTitle>
          <CardDescription>View last 100 lines of container logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedContainer} onValueChange={setSelectedContainer}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a container..." />
            </SelectTrigger>
            <SelectContent>
              {containers?.containers.map((container) => (
                <SelectItem key={container.id} value={container.id}>
                  {container.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedContainer && (
            <div className="border rounded-lg p-4 bg-muted">
              {logsLoading ? (
                <Skeleton className="h-96" />
              ) : logs && logs.logs ? (
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[600px]">
                  {logs.logs.join('\n')}
                </pre>
              ) : (
                <p className="text-muted-foreground">No logs available</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
