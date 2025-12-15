import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, BarChart3, CreditCard, FileText, Settings } from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminOrganizations } from "@/components/admin/AdminOrganizations";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminLogs } from "@/components/admin/AdminLogs";
import { AdminConfig } from "@/components/admin/AdminConfig";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Administration</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, organisations, statistiques et configuration du système
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistiques</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organisations</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Abonnements</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <AdminStats />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <AdminOrganizations />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <AdminSubscriptions />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <AdminLogs />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <AdminConfig />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
