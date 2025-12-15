/**
 * Analytics & Reports Page
 *
 * Features:
 * - KPI dashboard with revenue, sessions, clients metrics
 * - Revenue charts (line, bar)
 * - Room utilization charts
 * - Session type distribution (pie)
 * - Time range filtering
 */

import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Package,
  Download,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";

type Period = "today" | "week" | "month" | "quarter" | "year";

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("month");

  const { data: dashboardData, isLoading, refetch } = trpc.analytics.dashboard.useQuery({
    period,
  });

  const { data: kpis } = trpc.analytics.kpis.useQuery({ period });
  const { data: roomMetrics } = trpc.analytics.rooms.useQuery();

  // Mock chart data based on dashboard metrics
  const revenueData = dashboardData?.trends?.revenue || [
    { date: "Sem 1", value: 4500 },
    { date: "Sem 2", value: 5200 },
    { date: "Sem 3", value: 4800 },
    { date: "Sem 4", value: 6100 },
  ];

  const sessionTypesData = [
    { name: "Recording", value: 45, color: "#7c3aed" },
    { name: "Mixing", value: 30, color: "#525252" },
    { name: "Mastering", value: 15, color: "#737373" },
    { name: "Production", value: 10, color: "#a3a3a3" },
  ];

  const roomOccupancyData =
    roomMetrics?.rooms?.map((room) => ({
      name: room.roomName,
      occupancy: Math.round(room.utilizationRate),
      revenue: room.revenue,
    })) || [];

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Track performance metrics and generate reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Revenue"
              value={`$${((kpis?.revenue?.total || dashboardData?.revenue?.totalRevenue || 0) / 100).toLocaleString()}`}
              change={kpis?.revenue?.growth || dashboardData?.revenue?.revenueGrowth}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <KPICard
              title="Sessions"
              value={kpis?.sessions?.total || dashboardData?.sessions?.totalSessions || 0}
              change={kpis?.sessions?.growth}
              icon={<Calendar className="h-5 w-5" />}
            />
            <KPICard
              title="Active Clients"
              value={kpis?.clients?.total || dashboardData?.clients?.totalClients || 0}
              change={kpis?.clients?.growth}
              icon={<Users className="h-5 w-5" />}
            />
            <KPICard
              title="Room Utilization"
              value={`${Math.round(roomMetrics?.averageUtilization || 72)}%`}
              change={-2.3}
              icon={<Package className="h-5 w-5" />}
            />
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#a3a3a3" />
                  <YAxis stroke="#a3a3a3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Session Types & Sessions per Period */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Types</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sessionTypesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sessionTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions per Period</CardTitle>
                <CardDescription>Number of sessions completed</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#a3a3a3" />
                    <YAxis stroke="#a3a3a3" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="value" fill="#7c3aed" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed revenue breakdown by period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#a3a3a3" />
                  <YAxis stroke="#a3a3a3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#7c3aed" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((dashboardData?.revenue?.totalRevenue || 0) / 100).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData?.revenue?.revenueGrowth || 0}% vs last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.revenue?.collectionRate || 85}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of invoiced amount collected
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((dashboardData?.revenue?.projectedRevenue || 0) / 100).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on current trends
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Room Utilization</CardTitle>
              <CardDescription>Usage percentage by room</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={roomOccupancyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#a3a3a3" />
                  <YAxis dataKey="name" type="category" stroke="#a3a3a3" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="occupancy" fill="#7c3aed" name="Utilization (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Room Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Most Profitable Room</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roomMetrics?.mostProfitableRoom?.roomName || "Studio A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${((roomMetrics?.mostProfitableRoom?.revenue || 0) / 100).toLocaleString()} revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Most Utilized Room</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roomMetrics?.mostUtilizedRoom?.roomName || "Studio B"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {roomMetrics?.mostUtilizedRoom?.utilizationRate || 85}% utilization
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.clients?.totalClients || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData?.clients?.newClients || 0} new this period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.clients?.retentionRate || 78}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Returning clients
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg. Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((dashboardData?.clients?.averageLifetimeValue || 0) / 100).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per client
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
              <CardDescription>By revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(dashboardData?.clients?.topClients || []).slice(0, 5).map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{client.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.sessionCount} sessions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(client.revenue / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.clients?.topClients ||
                  dashboardData.clients.topClients.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">
                    No client data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}) {
  const isPositive = change && change > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs mt-2 ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(change)}% vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
