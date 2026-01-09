import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router-dom";
import { Calendar, Plus, Search, ArrowLeft, Clock, MapPin, Download, Mic } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export function Sessions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery({ limit: 100 });
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });
  const { data: rooms } = trpc.rooms.list.useQuery();

  // Create maps for quick lookup
  const clientMap = useMemo(() => {
    return clients?.reduce((acc, client) => {
      acc[client.id] = client.name;
      return acc;
    }, {} as Record<number, string>) || {};
  }, [clients]);

  const roomMap = useMemo(() => {
    return rooms?.reduce((acc, room) => {
      acc[room.id] = room.name;
      return acc;
    }, {} as Record<number, string>) || {};
  }, [rooms]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = sessions?.slice() || [];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (session) =>
          session.title.toLowerCase().includes(query) ||
          clientMap[session.clientId]?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((session) => session.status === statusFilter);
    }

    // Sort by start time (most recent first)
    result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return result;
  }, [sessions, searchQuery, statusFilter, clientMap]);

  const handleExportCalendar = () => {
    // TODO: Implement calendar export when backend supports it
    toast.info("Export calendrier - À implémenter avec backend");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "confirmed":
        return "default";
      case "in_progress":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "confirmed":
        return "Confirmée";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Mic className="h-8 w-8 text-primary" />
              Sessions
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Voir calendrier
              </Link>
            </Button>
            <Button asChild>
              <Link to="/sessions/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle session
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par titre ou client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportCalendar}
                  className="w-full md:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter vers calendrier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{filteredSessions.length} session(s)</CardTitle>
              <CardDescription className="text-sm">Gérez toutes vos sessions d'enregistrement</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredSessions.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Salle</TableHead>
                        <TableHead>Projet</TableHead>
                        <TableHead>Date & Heure</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session) => {
                        const startDate = new Date(session.startTime);
                        const endDate = new Date(session.endTime);

                        return (
                          <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <div className="font-medium">{session.title}</div>
                                <Badge variant={getStatusColor(session.status)} className="mt-1">
                                  {getStatusLabel(session.status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {clientMap[session.clientId] || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {roomMap[session.roomId] || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {session.projectId ? (
                                <Link
                                  to={`/projects/${session.projectId}`}
                                  className="text-primary hover:underline text-sm"
                                >
                                  Projet #{session.projectId}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{format(startDate, "dd MMM yyyy", { locale: fr })}</div>
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(session.status)}>
                                {getStatusLabel(session.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {session.totalAmount ? (parseFloat(session.totalAmount) / 100).toFixed(2) + "€" : "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/sessions/${session.id}`}>Voir</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-sm font-medium mb-1">Aucune session</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Commencez par créer votre première session
                  </p>
                  <Button asChild size="sm">
                    <Link to="/sessions/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle session
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
