import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Music,
  DollarSign,
  Clock,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Reports() {
  const navigate = useNavigate();

  // Queries
  const { data: sessions, isLoading: loadingSessions } =
    trpc.sessions.list.useQuery();
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();
  const { data: invoices, isLoading: loadingInvoices } =
    trpc.invoices.list.useQuery();
  const { data: projects, isLoading: loadingProjects } =
    trpc.projects.list.useQuery();
  const { data: rooms, isLoading: loadingRooms } = trpc.rooms.list.useQuery();

  const isLoading =
    loadingSessions ||
    loadingClients ||
    loadingInvoices ||
    loadingProjects ||
    loadingRooms;

  // Calculate metrics
  const totalSessions = sessions?.length || 0;
  const completedSessions =
    sessions?.filter((s) => s.status === "completed").length || 0;
  const totalRevenue =
    invoices?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) || 0;
  const activeProjects =
    projects?.filter((p) => p.status === "active").length || 0;

  // Available reports
  const reports = [
    {
      id: "financial",
      title: "Rapport Financier",
      description: "Revenus, dépenses, marges et rentabilité",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      path: "/financial-reports",
      stats: `${totalRevenue.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      })} ce mois`,
    },
    {
      id: "sessions",
      title: "Rapport Sessions",
      description: "Historique, taux d'occupation, performance par salle",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      path: "/sessions",
      stats: `${totalSessions} sessions dont ${completedSessions} terminées`,
    },
    {
      id: "clients",
      title: "Rapport Clients",
      description: "Portfolio clients, récurrence, satisfaction",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      path: "/clients",
      stats: `${clients?.length || 0} clients actifs`,
    },
    {
      id: "projects",
      title: "Rapport Projets",
      description: "Statut projets, deadlines, livrables",
      icon: Music,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      path: "/projects",
      stats: `${activeProjects} projets en cours`,
    },
    {
      id: "equipment",
      title: "Rapport Équipement",
      description: "Utilisation, maintenance, amortissement",
      icon: Activity,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      path: "/equipment",
      stats: "Maintenance à jour",
    },
    {
      id: "performance",
      title: "Rapport Performance",
      description: "KPIs, objectifs, croissance",
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
      path: "/analytics",
      stats: "+15% croissance ce trimestre",
    },
  ];

  // Quick stats
  const quickStats = [
    {
      label: "Sessions ce mois",
      value: totalSessions.toString(),
      trend: "+12%",
      icon: Calendar,
    },
    {
      label: "Clients actifs",
      value: (clients?.length || 0).toString(),
      trend: "+5%",
      icon: Users,
    },
    {
      label: "Chiffre d'affaires",
      value: totalRevenue.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
      trend: "+18%",
      icon: DollarSign,
    },
    {
      label: "Projets en cours",
      value: activeProjects.toString(),
      trend: "+3",
      icon: Music,
    },
  ];

  // Recent exports
  const recentExports = [
    {
      name: "Rapport Financier - Décembre 2025",
      date: new Date(2025, 11, 15),
      type: "PDF",
      size: "2.4 MB",
    },
    {
      name: "Sessions Q4 2025",
      date: new Date(2025, 11, 10),
      type: "Excel",
      size: "1.8 MB",
    },
    {
      name: "Clients - Export complet",
      date: new Date(2025, 11, 5),
      type: "CSV",
      size: "456 KB",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rapports</h2>
          <p className="text-muted-foreground">
            Génération et consultation de rapports d'activité
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exporter tout
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">{stat.trend}</span> vs mois
                    dernier
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Reports */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Rapports disponibles</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(report.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`p-3 rounded-lg ${report.bgColor} ${report.color}`}
                  >
                    <report.icon className="h-6 w-6" />
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.stats}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Rapport personnalisé</CardTitle>
          <CardDescription>
            Créez un rapport sur mesure avec les données de votre choix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">Par période</div>
              <div className="text-xs text-muted-foreground">
                Choisir une plage de dates
              </div>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <PieChart className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">Par catégorie</div>
              <div className="text-xs text-muted-foreground">
                Filtrer par type de données
              </div>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">Modèle personnalisé</div>
              <div className="text-xs text-muted-foreground">
                Créer un nouveau modèle
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Exports récents</CardTitle>
          <CardDescription>
            Vos derniers rapports générés et téléchargés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentExports.map((export_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{export_.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(export_.date, "d MMMM yyyy à HH:mm", {
                        locale: fr,
                      })}{" "}
                      · {export_.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{export_.type}</Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rapports programmés</CardTitle>
              <CardDescription>
                Génération automatique et envoi par email
              </CardDescription>
            </div>
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Nouveau planning
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Rapport financier mensuel
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chaque 1er du mois à 9h00
                  </p>
                </div>
              </div>
              <Badge>Actif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Synthèse hebdomadaire sessions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chaque lundi à 8h00
                  </p>
                </div>
              </div>
              <Badge>Actif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Bilan trimestriel</p>
                  <p className="text-xs text-muted-foreground">
                    Chaque 1er jour du trimestre
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Inactif</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
