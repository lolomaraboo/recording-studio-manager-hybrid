import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Calendar, FileAudio, FileText, LogOut, Music } from "lucide-react";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("clientToken");
    const storedClient = localStorage.getItem("clientData");

    if (!storedToken) {
      navigate("/client/login");
      return;
    }

    setToken(storedToken);
    if (storedClient) {
      const client = JSON.parse(storedClient);
      setClientName(client.name);
    }
  }, [navigate]);

  const orgId = parseInt(localStorage.getItem("selectedOrganizationId") || "1");
  
  const { data: dashboard, isLoading } = trpc.clientAuth.getClientDashboard.useQuery(
    {
      organizationId: orgId,
      token,
    },
    { enabled: !!token }
  );

  const handleLogout = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientData");
    navigate("/client/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-6xl">
          <Skeleton className="h-32 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Portail Client</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {clientName || dashboard?.client?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl py-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">
              Bienvenue, {dashboard?.client?.name} !
            </CardTitle>
            <CardDescription>
              Accédez à vos sessions, fichiers et factures en un clic
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Link to="/client/sessions">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Mes Sessions
                </CardTitle>
                <CardDescription>
                  Voir toutes mes sessions d'enregistrement
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/client/files">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-primary" />
                  Mes Fichiers
                </CardTitle>
                <CardDescription>
                  Télécharger mes fichiers audio
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/client/invoices">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Mes Factures
                </CardTitle>
                <CardDescription>
                  Consulter et payer mes factures
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessions Totales
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard?.stats?.totalSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.stats?.upcomingSessions || 0} à venir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Factures
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard?.stats?.totalInvoices || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard?.stats?.totalPaid?.toFixed(2) || 0}€ payés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                En Attente
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {dashboard?.stats?.totalPending?.toFixed(2) || 0}€
              </div>
              <p className="text-xs text-muted-foreground">
                À régler
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fichiers
              </CardTitle>
              <FileAudio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Disponibles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link to="/client/sessions">
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Mes Sessions</CardTitle>
                <CardDescription>
                  Consultez vos sessions passées et à venir
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link to="/client/files">
              <CardHeader>
                <FileAudio className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Mes Fichiers</CardTitle>
                <CardDescription>
                  Téléchargez vos enregistrements et mixages
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link to="/client/invoices">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Mes Factures</CardTitle>
                <CardDescription>
                  Consultez et payez vos factures en ligne
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
