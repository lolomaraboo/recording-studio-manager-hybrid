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

// Enregistrer les composants Chart.js
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
  const { data: monthlyRevenue, isLoading: loadingRevenue } =
    trpc.analytics.getMonthlyRevenue.useQuery();
  const { data: sessionsByRoom, isLoading: loadingRooms } =
    trpc.analytics.getSessionsByRoom.useQuery();
  const { data: sessionsByType, isLoading: loadingTypes } =
    trpc.analytics.getSessionsByType.useQuery();
  const { data: topClients, isLoading: loadingClients } =
    trpc.analytics.getTopClients.useQuery();

  if (loadingRevenue || loadingRooms || loadingTypes || loadingClients) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenus Mensuels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">€ Revenus Mensuels</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue && monthlyRevenue.data.length > 0 ? (
            <Line
              data={{
                labels: monthlyRevenue.labels,
                datasets: [
                  {
                    label: "Revenus (€)",
                    data: monthlyRevenue.data,
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
                      callback: (value) => `${value}€`,
                    },
                  },
                },
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions par Salle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Sessions par Salle (ce mois)</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsByRoom && sessionsByRoom.data.length > 0 ? (
            <Bar
              data={{
                labels: sessionsByRoom.labels,
                datasets: [
                  {
                    label: "Sessions",
                    data: sessionsByRoom.data,
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
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Répartition par Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📈 Répartition par Type</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsByType && sessionsByType.data.length > 0 ? (
            <div className="flex items-center justify-center">
              <Doughnut
                data={{
                  labels: sessionsByType.labels,
                  datasets: [
                    {
                      data: sessionsByType.data,
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
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 5 Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🏆 Top 5 Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {topClients && topClients.data.length > 0 ? (
            <Bar
              data={{
                labels: topClients.labels,
                datasets: [
                  {
                    label: "Revenus (€)",
                    data: topClients.data,
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
                      callback: (value) => `${value}€`,
                    },
                  },
                },
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
