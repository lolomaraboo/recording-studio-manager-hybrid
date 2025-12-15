/**
 * CLIENT PORTAL - Dashboard principal pour les clients
 * 
 * Les clients peuvent :
 * - Voir leurs statistiques (sessions, factures)
 * - Consulter leurs prochaines sessions
 * - Voir leurs factures en attente
 * - Accéder à leur profil
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, User, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientPortal() {
  const { data: profile, isLoading: profileLoading } = trpc.clientPortal.getMyClientProfile.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.clientPortal.getMyStats.useQuery();
  const { data: upcomingSessions, isLoading: sessionsLoading } = trpc.clientPortal.getMySessions.useQuery({
    status: "upcoming",
    limit: 5,
  });
  const { data: pendingInvoices, isLoading: invoicesLoading } = trpc.clientPortal.getMyInvoices.useQuery({
    status: "pending",
    limit: 5,
  });

  if (profileLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de votre portail...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profil client non trouvé</CardTitle>
            <CardDescription>
              Votre compte utilisateur n'est pas encore lié à un profil client.
              Veuillez contacter le studio pour activer votre accès.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Portail Client</h1>
            <p className="text-sm text-muted-foreground">Bienvenue, {profile.name}</p>
          </div>
          <Link href="/client-portal/profile">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Mon Profil
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Totales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sessions.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.sessions.completed || 0} terminées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prochaines Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sessions.upcoming || 0}</div>
              <p className="text-xs text-muted-foreground">
                À venir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Factures Payées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.financials.totalPaid.toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                {stats?.invoices.paid || 0} factures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Factures En Attente</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.financials.totalPending.toFixed(2)}€</div>
              <p className="text-xs text-muted-foreground">
                {stats?.invoices.pending || 0} factures
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions">Mes Sessions</TabsTrigger>
            <TabsTrigger value="invoices">Mes Factures</TabsTrigger>
            <TabsTrigger value="booking">Réserver</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prochaines Sessions</CardTitle>
                <CardDescription>
                  Vos sessions confirmées et en attente de confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : upcomingSessions && upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session: any) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{session.sessionType}</h3>
                            <Badge variant={session.status === "confirmed" ? "default" : "secondary"}>
                              {session.status === "confirmed" ? "Confirmée" : "En attente"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.startTime), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                          {session.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(session.startTime), "HH:mm")} - {format(new Date(session.endTime), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link href="/client-portal/sessions">
                      <Button variant="outline" className="w-full">
                        Voir toutes mes sessions
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune session à venir</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Factures En Attente</CardTitle>
                <CardDescription>
                  Vos factures en attente de paiement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : pendingInvoices && pendingInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {pendingInvoices.map((invoice: any) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                            <Badge variant="secondary">{invoice.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Émise le {format(new Date(invoice.createdAt), "d MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{Number(invoice.totalAmount).toFixed(2)}€</p>
                        </div>
                      </div>
                    ))}
                    <Link href="/client-portal/invoices">
                      <Button variant="outline" className="w-full">
                        Voir toutes mes factures
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune facture en attente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Tab */}
          <TabsContent value="booking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Réserver une Session</CardTitle>
                <CardDescription>
                  Consultez les créneaux disponibles et réservez votre prochaine session
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Accédez au calendrier de réservation pour voir les créneaux disponibles
                </p>
                <Link href="/client-portal/booking">
                  <Button>
                    Accéder au calendrier
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
