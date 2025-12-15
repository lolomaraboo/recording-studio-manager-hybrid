import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function AnalyticsCharts() {
  // Get dashboard data with trends
  const { data: dashboardData, isLoading: loadingDashboard } =
    trpc.analytics.dashboard.useQuery({ period: "month" });

  // Get room performance metrics
  const { data: roomMetrics, isLoading: loadingRooms } =
    trpc.analytics.rooms.useQuery();

  // Get client metrics
  const { data: clientMetrics, isLoading: loadingClients } =
    trpc.analytics.clients.useQuery({ period: "month" });

  const isLoading = loadingDashboard || loadingRooms || loadingClients;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    );
  }

  // Prepare revenue trend data - handle both timestamp and date fields
  const revenueTrend = dashboardData?.trends?.revenue || [];
  const revenueLabels = revenueTrend.map((d) => (d as { timestamp?: string; date?: string }).timestamp || (d as { date?: string }).date || "");
  const revenueData = revenueTrend.map((d) => (d as { value: number }).value);

  // Prepare room data - handle roomName vs name
  const rooms = roomMetrics?.rooms || [];
  const roomLabels = rooms.map((r) => (r as { roomName?: string; name?: string }).roomName || (r as { name?: string }).name || "");
  const roomSessionCounts = rooms.map((r) => (r as { sessionCount: number }).sessionCount);

  // Session type distribution - not available in dashboard, skip for now
  const typeLabels: string[] = [];
  const typeData: number[] = [];

  // Prepare top clients data - handle clientName vs name, totalSpent vs revenue
  const topClients = clientMetrics?.topClients || [];
  const clientLabels = topClients.map((c: { clientName?: string; name?: string }) => c.clientName || c.name || "");
  const clientRevenueData = topClients.map((c: { totalSpent?: number; revenue?: number }) => c.totalSpent || c.revenue || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Monthly Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenus Mensuels</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <Line
              data={{
                labels: revenueLabels,
                datasets: [
                  {
                    label: "Revenus",
                    data: revenueData,
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    tension: 0.4,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value}`,
                    },
                  },
                },
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnee disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions by Room */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions par Salle (ce mois)</CardTitle>
        </CardHeader>
        <CardContent>
          {roomSessionCounts.length > 0 ? (
            <Bar
              data={{
                labels: roomLabels,
                datasets: [
                  {
                    label: "Sessions",
                    data: roomSessionCounts,
                    backgroundColor: [
                      "rgba(16, 185, 129, 0.8)",
                      "rgba(59, 130, 246, 0.8)",
                      "rgba(245, 158, 11, 0.8)",
                      "rgba(239, 68, 68, 0.8)",
                      "rgba(139, 92, 246, 0.8)",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnee disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repartition par Type</CardTitle>
        </CardHeader>
        <CardContent>
          {typeData.length > 0 ? (
            <div className="flex items-center justify-center">
              <Doughnut
                data={{
                  labels: typeLabels,
                  datasets: [
                    {
                      data: typeData,
                      backgroundColor: [
                        "rgba(59, 130, 246, 0.8)",
                        "rgba(16, 185, 129, 0.8)",
                        "rgba(245, 158, 11, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                      ],
                      borderWidth: 2,
                      borderColor: "#fff",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
                height={250}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnee disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 5 Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clientRevenueData.length > 0 ? (
            <Bar
              data={{
                labels: clientLabels,
                datasets: [
                  {
                    label: "Revenus",
                    data: clientRevenueData,
                    backgroundColor: "rgba(239, 68, 68, 0.8)",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value}`,
                    },
                  },
                },
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnee disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
