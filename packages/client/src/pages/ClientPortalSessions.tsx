/**
 * CLIENT PORTAL - Page Sessions
 * 
 * Liste complète des sessions du client avec :
 * - Filtres par statut (toutes, à venir, terminées, annulées)
 * - Affichage détaillé de chaque session
 * - Badges de statut colorés
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, ArrowLeft, Music, Disc, Radio, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type SessionStatus = "all" | "upcoming" | "completed" | "cancelled";

export default function ClientPortalSessions() {
  const [statusFilter, setStatusFilter] = useState<SessionStatus>("all");

  const { data: sessions, isLoading } = trpc.clientPortal.getMySessions.useQuery({
    status: statusFilter,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "En attente", variant: "secondary" },
      confirmed: { label: "Confirmée", variant: "default" },
      completed: { label: "Terminée", variant: "outline" },
      cancelled: { label: "Annulée", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getSessionTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      recording: <Music className="h-5 w-5" />,
      mixing: <Disc className="h-5 w-5" />,
      mastering: <Radio className="h-5 w-5" />,
      rehearsal: <Users className="h-5 w-5" />,
    };

    return iconMap[type] || <Music className="h-5 w-5" />;
  };

  const getSessionTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      recording: "Enregistrement",
      mixing: "Mixage",
      mastering: "Mastering",
      rehearsal: "Répétition",
    };

    return labelMap[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/client-portal">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au portail
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Mes Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Historique complet de vos sessions d'enregistrement
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filtres par statut */}
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as SessionStatus)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="upcoming">À venir</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste des sessions */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement de vos sessions...</p>
            </div>
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session: any) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getSessionTypeIcon(session.sessionType)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{session.title || getSessionTypeLabel(session.sessionType)}</CardTitle>
                        <CardDescription>
                          {format(new Date(session.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Horaires */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(session.startTime), "HH:mm")} -{" "}
                        {format(new Date(session.endTime), "HH:mm")}
                      </span>
                    </div>

                    {/* Salle */}
                    {session.roomId && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Salle {session.roomId}</span>
                      </div>
                    )}

                    {/* Type */}
                    <div className="flex items-center gap-2 text-sm">
                      {getSessionTypeIcon(session.sessionType)}
                      <span>{getSessionTypeLabel(session.sessionType)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {session.description && (
                    <div className="mt-4 p-3 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">{session.description}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {session.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium mb-1">Notes :</p>
                      <p className="text-sm text-muted-foreground">{session.notes}</p>
                    </div>
                  )}

                  {/* Montant */}
                  {session.totalAmount && (
                    <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <span className="text-sm font-medium">Montant</span>
                      <span className="text-lg font-bold text-primary">
                        {Number(session.totalAmount).toFixed(2)}€
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Aucune session trouvée</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {statusFilter === "all"
                    ? "Vous n'avez pas encore de sessions enregistrées."
                    : `Aucune session ${statusFilter === "upcoming" ? "à venir" : statusFilter === "completed" ? "terminée" : "annulée"}.`}
                </p>
                <Link to="/client-portal/booking">
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Réserver une session
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton de réservation flottant */}
        {sessions && sessions.length > 0 && (
          <div className="fixed bottom-8 right-8">
            <Link to="/client-portal/booking">
              <Button size="lg" className="shadow-lg">
                <Calendar className="h-5 w-5 mr-2" />
                Nouvelle réservation
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
