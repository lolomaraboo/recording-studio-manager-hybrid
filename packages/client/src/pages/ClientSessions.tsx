import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Calendar, ArrowLeft, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientSessions() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("clientToken");
    if (!storedToken) {
      navigate("/client/login");
      return;
    }
    setToken(storedToken);
  }, [navigate]);

  const orgId = parseInt(localStorage.getItem("selectedOrganizationId") || "1");
  
  const { data: sessions, isLoading } = trpc.clientAuth.getClientSessions.useQuery(
    {
      organizationId: orgId,
      token,
    },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const upcomingSessions = sessions?.filter((s) => new Date(s.startTime) > new Date()) || [];
  const pastSessions = sessions?.filter((s) => new Date(s.startTime) <= new Date()) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/client/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Mes Sessions</h1>
            <p className="text-sm text-muted-foreground">{sessions?.length || 0} sessions au total</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 space-y-8">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sessions à venir ({upcomingSessions.length})
            </CardTitle>
            <CardDescription>Vos prochaines sessions d'enregistrement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune session à venir
              </p>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{session.title || "Session"}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(session.startTime), "PPP", { locale: fr })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(session.startTime), "HH:mm")} - {format(new Date(session.endTime), "HH:mm")}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
                      À venir
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Past Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions passées ({pastSessions.length})</CardTitle>
            <CardDescription>Historique de vos sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune session passée
              </p>
            ) : (
              pastSessions.slice(0, 10).map((session) => (
                <div key={session.id} className="p-4 border border-border rounded-lg opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{session.title || "Session"}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(session.startTime), "PPP", { locale: fr })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(session.startTime), "HH:mm")} - {format(new Date(session.endTime), "HH:mm")}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      Terminée
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
