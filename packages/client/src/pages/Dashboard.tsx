import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Users, FileText, TrendingUp, Home,
  TrendingDown, DollarSign, Clock, Settings, AlertTriangle,
  Wrench, CheckCircle2, AlertCircle, RotateCcw, MessageSquare
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";

// Types pour les widgets
type WidgetId =
  | 'stats'
  | 'today-sessions'
  | 'upcoming-sessions'
  | 'pending-invoices'
  | 'alerts'
  | 'weekly-revenue'
  | 'top-clients'
  | 'equipment-maintenance'
  | 'unread-messages';

interface WidgetConfig {
  id: WidgetId;
  title: string;
  visible: boolean;
}

// Composant Widget Draggable
function DraggableWidget({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group"
    >
      <Card className="h-full flex flex-col relative">
        {/* Poignée de drag - visible seulement au hover */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardContent className="flex-1 overflow-auto p-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Configuration des widgets
  const defaultWidgets: WidgetConfig[] = [
    { id: 'stats', title: 'Statistiques', visible: true },
    { id: 'today-sessions', title: 'Sessions aujourd\'hui', visible: true },
    { id: 'upcoming-sessions', title: 'Sessions à venir', visible: true },
    { id: 'pending-invoices', title: 'Factures en attente', visible: true },
    { id: 'alerts', title: 'Alertes & Rappels', visible: true },
    { id: 'weekly-revenue', title: 'Revenus hebdomadaires', visible: true },
    { id: 'top-clients', title: 'Top Clients', visible: true },
    { id: 'equipment-maintenance', title: 'Équipement en maintenance', visible: true },
    { id: 'unread-messages', title: 'Messages non lus', visible: true },
  ];

  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard-widget-order');
    return saved ? JSON.parse(saved) : widgets.map(w => w.id);
  });

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem('dashboard-widget-order', JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    if (storedOrgId) {
      setSelectedOrgId(parseInt(storedOrgId));
    } else {
      // Dev: Use org ID 1 by default (matches mock headers in main.tsx)
      const defaultOrgId = 1;
      localStorage.setItem("selectedOrganizationId", defaultOrgId.toString());
      setSelectedOrgId(defaultOrgId);
    }
  }, [navigate]);

  // Tous les hooks doivent être appelés avant tout return conditionnel
  const { data: organization, isLoading: orgLoading } = trpc.organizations.get.useQuery(
    undefined,
    { enabled: selectedOrgId !== null }
  );

  const { data: clientsData } = trpc.clients.list.useQuery(undefined, { enabled: selectedOrgId !== null });
  const { data: roomsData } = trpc.rooms.list.useQuery(undefined, { enabled: selectedOrgId !== null });
  const { data: equipmentData } = trpc.equipment.list.useQuery(undefined, { enabled: selectedOrgId !== null });
  const { data: projectsData } = trpc.projects.list.useQuery(undefined, { enabled: selectedOrgId !== null });
  const { data: allSessions } = trpc.sessions.list.useQuery(undefined, { enabled: selectedOrgId !== null });
  const { data: invoicesData } = trpc.invoices.list.useQuery(undefined, { enabled: selectedOrgId !== null });

  // Filtrer les sessions côté client
  const today = new Date().toISOString().split("T")[0];
  const todaySessions = allSessions?.filter(s => {
    const sessionDate = new Date(s.startTime).toISOString().split("T")[0];
    return sessionDate === today;
  });

  const upcomingSessions = allSessions?.filter(s => {
    const sessionDate = new Date(s.startTime);
    const now = new Date();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return sessionDate > now && sessionDate <= weekFromNow;
  });

  // Calculer les stats manuellement
  const stats = {
    pendingInvoicesCount: invoicesData?.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length || 0,
    pendingInvoicesTotal: invoicesData?.filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0,
    sessionsThisMonth: allSessions?.filter(s => {
      const sessionDate = new Date(s.startTime);
      const now = new Date();
      return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
    }).length || 0,
    sessionsLastMonth: allSessions?.filter(s => {
      const sessionDate = new Date(s.startTime);
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return sessionDate.getMonth() === lastMonth.getMonth() && sessionDate.getFullYear() === lastMonth.getFullYear();
    }).length || 0,
    revenueThisMonth: invoicesData?.filter(inv => {
      const invDate = new Date(inv.createdAt);
      const now = new Date();
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    }).reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0,
    revenueLastMonth: invoicesData?.filter(inv => {
      const invDate = new Date(inv.createdAt);
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return invDate.getMonth() === lastMonth.getMonth() && invDate.getFullYear() === lastMonth.getFullYear();
    }).reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0) || 0,
  };

  // Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleWidget = (id: WidgetId) => {
    setWidgets(widgets.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    ));
  };

  const resetWidgets = () => {
    setWidgets(defaultWidgets);
    setWidgetOrder(defaultWidgets.map(w => w.id));
  };

  // Afficher un écran de chargement si aucune organisation n'est sélectionnée
  if (!selectedOrgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirection vers la sélection d'organisation...</p>
        </div>
      </div>
    );
  }

  if (orgLoading || !organization) {
    return <DashboardSkeleton />;
  }

  const revenueTrend = stats && stats.revenueLastMonth > 0
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
    : 0;

  // Filtrer les widgets visibles et les trier selon l'ordre
  const visibleWidgets = widgetOrder
    .map(id => widgets.find(w => w.id === id))
    .filter((w): w is WidgetConfig => w !== undefined && w.visible);

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
      {/* Welcome Section avec boutons de configuration */}
      <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Home className="h-8 w-8 text-primary" />
                  Dashboard
                </h2>
                <p className="text-muted-foreground">Voici un aperçu de votre activité</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetWidgets}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurer les widgets
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Afficher/Masquer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {widgets.map((widget) => (
                      <DropdownMenuCheckboxItem
                        key={widget.id}
                        checked={widget.visible}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      >
                        {widget.title}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Widgets avec Drag & Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleWidgets.map(w => w.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visibleWidgets.map((widget) => (
                    <DraggableWidget key={widget.id} id={widget.id}>
                      {renderWidget(widget.id, {
                        stats,
                        clientsData,
                        roomsData,
                        equipmentData,
                        projectsData,
                        todaySessions,
                        upcomingSessions,
                        revenueTrend,
                        navigate,
                      })}
                    </DraggableWidget>
                  ))}
                </div>
              </SortableContext>
      </DndContext>
      </div>
    </div>
  );
}

// Fonction pour rendre le contenu de chaque widget
function renderWidget(
  id: WidgetId,
  data: {
    stats: any;
    clientsData: any;
    roomsData: any;
    equipmentData: any;
    projectsData: any;
    todaySessions: any;
    upcomingSessions: any;
    revenueTrend: number;
    navigate: (path: string) => void;
  }
) {
  const {
    stats,
    clientsData,
    roomsData,
    equipmentData,
    projectsData,
    todaySessions,
    upcomingSessions,
    revenueTrend,
    navigate,
  } = data;

  switch (id) {
    case 'stats':
      return (
        <div>
          <CardTitle className="text-lg mb-4">Statistiques Rapides</CardTitle>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Clients</div>
              <div className="text-2xl font-bold">{clientsData?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Salles</div>
              <div className="text-2xl font-bold">{roomsData?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Équipement</div>
              <div className="text-2xl font-bold">{equipmentData?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Projets</div>
              <div className="text-2xl font-bold">{projectsData?.length || 0}</div>
            </div>
          </div>
        </div>
      );

    case 'today-sessions':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sessions aujourd'hui
          </CardTitle>
          {todaySessions && todaySessions.length > 0 ? (
            <div className="space-y-2">
              {todaySessions.slice(0, 3).map((session: any) => (
                <div
                  key={session.id}
                  className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate("/sessions")}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{session.title}</div>
                    <Badge variant="outline">{session.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(session.startTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(session.endTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune session aujourd'hui</p>
            </div>
          )}
        </div>
      );

    case 'upcoming-sessions':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sessions à venir (7 jours)
          </CardTitle>
          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-2">
              {upcomingSessions.slice(0, 3).map((session: any) => (
                <div
                  key={session.id}
                  className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate("/sessions")}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{session.title}</div>
                    <Badge variant="outline">{session.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(session.startTime).toLocaleDateString("fr-FR")} à{" "}
                    {new Date(session.startTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune session à venir</p>
            </div>
          )}
        </div>
      );

    case 'pending-invoices':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factures en attente
          </CardTitle>
          <div className="text-center py-3">
            <div className="text-3xl font-bold">{stats?.pendingInvoicesCount || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {((stats?.pendingInvoicesTotal || 0) / 100).toFixed(2)}€ en attente
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate("/invoices")}
            >
              Voir les factures
            </Button>
          </div>
        </div>
      );

    case 'alerts':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes & Rappels
          </CardTitle>
          <div className="space-y-2">
            {stats?.pendingInvoicesCount > 0 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">Factures en attente</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.pendingInvoicesCount} facture(s) en attente
                  </div>
                </div>
              </div>
            )}
            {equipmentData?.some((e: any) => e.status === "maintenance") && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">Équipement en maintenance</div>
                  <div className="text-sm text-muted-foreground">
                    {equipmentData.filter((e: any) => e.status === "maintenance").length} équipement(s)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case 'weekly-revenue':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenus hebdomadaires
          </CardTitle>
          <div className="text-center py-3">
            <div className="text-3xl font-bold">
              {((stats?.revenueThisMonth || 0) / 100).toFixed(2)}€
            </div>
            <div className="text-sm text-muted-foreground mt-1">Ce mois</div>
            {revenueTrend !== 0 && (
              <div className={`flex items-center justify-center gap-1 text-sm mt-1 ${revenueTrend > 0 ? "text-green-500" : "text-red-500"}`}>
                {revenueTrend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{Math.abs(revenueTrend).toFixed(1)}% vs mois dernier</span>
              </div>
            )}
          </div>
        </div>
      );

    case 'top-clients':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Clients
          </CardTitle>
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Données disponibles prochainement</p>
          </div>
        </div>
      );

    case 'equipment-maintenance':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Équipement en maintenance
          </CardTitle>
          <div className="space-y-2">
            {equipmentData?.filter((e: any) => e.status === "maintenance").slice(0, 3).map((equipment: any) => (
              <div
                key={equipment.id}
                className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate("/equipment")}
              >
                <div className="font-medium">{equipment.name}</div>
                <div className="text-sm text-muted-foreground">{equipment.category}</div>
              </div>
            )) || (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun équipement en maintenance</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'unread-messages':
      return (
        <div>
          <CardTitle className="text-lg mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages non lus
          </CardTitle>
          <div className="text-center py-4 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun message non lu</p>
          </div>
        </div>
      );

    default:
      return <div>Widget inconnu</div>;
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-96" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
