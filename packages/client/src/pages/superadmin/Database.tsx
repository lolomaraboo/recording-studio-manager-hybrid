import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Database as DatabaseIcon } from "lucide-react";

export default function Database() {
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
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <DatabaseIcon className="h-8 w-8 text-primary" />
            Database Management
          </h2>
          <p className="text-sm text-muted-foreground">Organizations, users, and tenant statistics</p>
        </div>

        {/* Tenant Stats */}
        <div className="grid gap-2 md:grid-cols-3">
        {statsLoading ? (
          <>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
            <Card><Skeleton className="h-24" /></Card>
          </>
        ) : tenantStats && tenantStats.tenantStats.length > 0 ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total Tenants</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{tenantStats.tenantStats.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total DB Size</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">
                  {tenantStats.tenantStats.reduce((sum, t) => sum + t.sizeMB, 0)} MB
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Avg Size/Tenant</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Organizations</CardTitle>
            <CardDescription className="text-sm">All registered organizations</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{org.subdomain}</TableCell>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription className="text-sm">All registered users</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
    </div>
  );
}
