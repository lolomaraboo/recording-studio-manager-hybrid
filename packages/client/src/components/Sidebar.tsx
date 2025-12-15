import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronDown, Star, Plus } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  Home,
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  Music,
  Package,
  LogOut,
  MessageSquare,
  Search,
  Bell,
  TrendingUp,
  FolderOpen,
  Share2,
  UserPlus,
  LayoutDashboard,
  Wrench,
  MessageCircle,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
  badgeKey?: "communication" | "finance"; // Clé pour récupérer le compteur de badge
}

const navSections: NavSection[] = [
  {
    title: "Planning",
    icon: <Calendar className="h-4 w-4" />,
    items: [
      {
        title: "Sessions",
        href: "/sessions",
        icon: <Music className="h-5 w-5" />,
      },
      {
        title: "Calendrier",
        href: "/calendar",
        icon: <Calendar className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Contacts",
    icon: <Users className="h-4 w-4" />,
    items: [
      {
        title: "Clients",
        href: "/clients",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Équipe",
        href: "/team",
        icon: <UserPlus className="h-5 w-5" />,
      },
      {
        title: "Musiciens",
        href: "/musicians",
        icon: <Users className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Ressources",
    icon: <Wrench className="h-4 w-4" />,
    items: [
      {
        title: "Salles",
        href: "/rooms",
        icon: <DoorOpen className="h-5 w-5" />,
      },
      {
        title: "Équipement",
        href: "/equipment",
        icon: <Package className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Finance",
    icon: <DollarSign className="h-4 w-4" />,
    badgeKey: "finance",
    items: [
      {
        title: "Factures",
        href: "/invoices",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: "Devis",
        href: "/quotes",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: "Rapports Financiers",
        href: "/financial-reports",
        icon: <DollarSign className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Analyse",
    icon: <TrendingUp className="h-4 w-4" />,
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        title: "Rapports",
        href: "/reports",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Projets",
    icon: <FolderOpen className="h-4 w-4" />,
    items: [
      {
        title: "Projets",
        href: "/projects",
        icon: <FolderOpen className="h-5 w-5" />,
      },
      {
        title: "Fichiers Audio",
        href: "/audio-files",
        icon: <Music className="h-5 w-5" />,
      },
      {
        title: "Partages",
        href: "/shares",
        icon: <Share2 className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Communication",
    icon: <MessageCircle className="h-4 w-4" />,
    badgeKey: "communication",
    items: [
      {
        title: "Messages",
        href: "/chat",
        icon: <MessageSquare className="h-5 w-5" />,
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: <Bell className="h-5 w-5" />,
      },
    ],
  },
];

// Composant pour une section sortable
function SortableSection({
  section,
  sectionIndex,
  totalSections,
  isExpanded,
  isCollapsed,
  location,
  badgeCounts,
  toggleSection,
  favorites,
  toggleFavorite,
}: {
  section: NavSection;
  sectionIndex: number;
  totalSections: number;
  isExpanded: boolean;
  isCollapsed: boolean;
  location: string;
  badgeCounts: any;
  toggleSection: (title: string, event?: React.MouseEvent) => void;
  favorites: string[];
  toggleFavorite: (href: string, e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.title });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Titre de section cliquable avec triangle */}
      {!isCollapsed ? (
        <button
          onClick={(e) => toggleSection(section.title, e)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group"
          title="Cliquez pour ouvrir/fermer cette section. Alt+Clic pour ouvrir/fermer toutes les sections."
        >
          <div className="flex items-center gap-2">
            {section.icon}
            <span>{section.title}</span>
            {/* Badge de notification */}
            {section.badgeKey && badgeCounts && badgeCounts[section.badgeKey] > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-full">
                {badgeCounts[section.badgeKey]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                !isExpanded && "-rotate-90"
              )}
            />
          </div>
        </button>
      ) : (
        <button
          onClick={(e) => toggleSection(section.title, e)}
          className="w-full flex items-center justify-center px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
          title={section.title}
        >
          {section.icon}
        </button>
      )}

      {/* Items de la section (affichés si la section est ouverte, même en mode réduit) */}
      {isExpanded && (
        <div className="space-y-1 mt-1">
          {section.items.map((item) => {
            const isActive = location === item.href;
            const isFavorite = favorites.includes(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer group/item relative",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed ? "justify-center" : "ml-6"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span className="flex-1">{item.title}</span>}
                  {!isCollapsed && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Rediriger vers la page avec paramètre ?action=create
                          window.location.href = `${item.href}?action=create`;
                        }}
                        className="hover:bg-accent/50 rounded p-0.5"
                        title={`Créer ${item.title.toLowerCase()}`}
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(item.href, e)}
                        className="hover:bg-accent/50 rounded p-0.5"
                        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          )}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pas de séparateur entre sections pour un design plus épuré */}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [sectionsOrder, setSectionsOrder] = useState<NavSection[]>(navSections);
  const [favorites, setFavorites] = useState<string[]>([]);
  const logoutMutation = trpc.auth.logout.useMutation();
  
  // Configuration du drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Notifications en temps réel temporairement désactivées
  // const { badgeCounts } = useRealtimeNotifications();
  const badgeCounts = { finance: 0, communication: 0 };
  
  // Activer les raccourcis clavier
  useKeyboardShortcuts();

  // Charger l'état de la sidebar depuis localStorage
  useEffect(() => {
    const storedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (storedCollapsed) {
      setIsCollapsed(storedCollapsed === "true");
    }

    // Charger l'état des sections (par défaut toutes ouvertes)
    const storedSections = localStorage.getItem("sidebarExpandedSections");
    if (storedSections) {
      setExpandedSections(JSON.parse(storedSections));
    } else {
      // Par défaut, toutes les sections sont ouvertes
      const defaultExpanded: Record<string, boolean> = {};
      navSections.forEach(section => {
        defaultExpanded[section.title] = true;
      });
      setExpandedSections(defaultExpanded);
    }
    
    // Charger les favoris depuis localStorage
    const storedFavorites = localStorage.getItem("sidebarFavorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    
    // Charger l'état de la section Favoris
    const storedFavoritesExpanded = localStorage.getItem("sidebarFavoritesExpanded");
    if (storedFavoritesExpanded !== null) {
      setFavoritesExpanded(storedFavoritesExpanded === "true");
    }
    
    // Charger l'ordre personnalisé des sections
    const storedOrder = localStorage.getItem("sidebarSectionsOrder");
    if (storedOrder) {
      const orderTitles = JSON.parse(storedOrder);
      const orderedSections = orderTitles
        .map((title: string) => navSections.find(s => s.title === title))
        .filter(Boolean);
      setSectionsOrder(orderedSections);
    }
  }, []);

  // Sauvegarder l'état de la sidebar dans localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // Toggle une section (ouvrir/fermer)
  // Alt+Clic : ouvrir/fermer toutes les sections
  const toggleSection = (sectionTitle: string, event?: React.MouseEvent) => {
    if (event?.altKey) {
      // Alt+Clic : ouvrir/fermer toutes les sections
      const allExpanded = Object.values(expandedSections).every(v => v);
      const newExpandedSections: Record<string, boolean> = {};
      sectionsOrder.forEach(section => {
        newExpandedSections[section.title] = !allExpanded;
      });
      setExpandedSections(newExpandedSections);
      localStorage.setItem("sidebarExpandedSections", JSON.stringify(newExpandedSections));
    } else {
      // Clic normal : toggle une seule section
      const newExpandedSections = {
        ...expandedSections,
        [sectionTitle]: !expandedSections[sectionTitle],
      };
      setExpandedSections(newExpandedSections);
      localStorage.setItem("sidebarExpandedSections", JSON.stringify(newExpandedSections));
    }
  };
  
  // Gérer le drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionsOrder((sections) => {
        const oldIndex = sections.findIndex((s) => s.title === active.id);
        const newIndex = sections.findIndex((s) => s.title === over.id);
        const newOrder = arrayMove(sections, oldIndex, newIndex);
        
        // Sauvegarder l'ordre dans localStorage
        localStorage.setItem(
          "sidebarSectionsOrder",
          JSON.stringify(newOrder.map((s) => s.title))
        );
        
        return newOrder;
      });
    }
  };

  // Raccourci clavier Cmd+K / Ctrl+K pour ouvrir la recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    localStorage.removeItem("selectedOrganizationId");
    window.location.href = "/";
  };
  
  // Gérer les favoris
  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = favorites.includes(href)
      ? favorites.filter(f => f !== href)
      : [...favorites, href];
    setFavorites(newFavorites);
    localStorage.setItem("sidebarFavorites", JSON.stringify(newFavorites));
  };
  
  // Récupérer tous les items de navigation
  const allNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    ...sectionsOrder.flatMap(section => section.items)
  ];

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Titre de l'application et bouton de réduction sur la même ligne */}
      <div className={cn("px-4 py-4 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            RSM
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
          title={isCollapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Recherche globale */}
      {!isCollapsed && (
        <>
          <div className="px-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              Rechercher...
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        </>
      )}

      {isCollapsed && (
        <>
          <div className="px-3 py-4 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              title="Rechercher (⌘K)"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {/* Navigation avec sections pliables (accordéon) */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-2">
          {/* Dashboard en premier, sans section */}
          <Link href="/dashboard">
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer group/item relative",
                location === "/dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <Home className="h-5 w-5" />
              {!isCollapsed && <span className="flex-1">Dashboard</span>}
              {!isCollapsed && (
                <button
                  onClick={(e) => toggleFavorite("/dashboard", e)}
                  className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                  title={favorites.includes("/dashboard") ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      favorites.includes("/dashboard") ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )}
                  />
                </button>
              )}
            </div>
          </Link>
          
          {/* Section Favoris pliable */}
          {!isCollapsed && favorites.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => {
                  const newState = !favoritesExpanded;
                  setFavoritesExpanded(newState);
                  localStorage.setItem("sidebarFavoritesExpanded", String(newState));
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                title="Cliquez pour ouvrir/fermer la section Favoris"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>Favoris</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    !favoritesExpanded && "-rotate-90"
                  )}
                />
              </button>
              {favoritesExpanded && (
                <div className="space-y-1 mt-1">
                  {favorites.map((favHref) => {
                    const favItem = allNavItems.find(item => item.href === favHref);
                    if (!favItem) return null;
                    const isActive = location === favItem.href;
                    return (
                      <Link key={favItem.href} href={favItem.href}>
                        <div
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer group/item relative",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {favItem.icon}
                          <span className="flex-1">{favItem.title}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `${favItem.href}?action=create`;
                            }}
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                            title="Créer un nouveau"
                          >
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => toggleFavorite(favItem.href, e)}
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                            title="Retirer des favoris"
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Sections réorganisables par drag & drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionsOrder.map((s) => s.title)}
              strategy={verticalListSortingStrategy}
            >
              {sectionsOrder.map((section, sectionIndex) => (
                <SortableSection
                  key={section.title}
                  section={section}
                  sectionIndex={sectionIndex}
                  totalSections={sectionsOrder.length}
                  isExpanded={expandedSections[section.title] !== false}
                  isCollapsed={isCollapsed}
                  location={location}
                  badgeCounts={badgeCounts}
                  toggleSection={toggleSection}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </SortableContext>
          </DndContext>
        </nav>
      </div>

      {/* Paramètres et Déconnexion en bas */}
      <div className="p-4 space-y-2">
        {/* Paramètres */}
        <Link href="/settings">
          {!isCollapsed ? (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
            >
              <Wrench className="h-5 w-5" />
              <span>Paramètres</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="w-full text-muted-foreground"
              title="Paramètres"
            >
              <Wrench className="h-5 w-5" />
            </Button>
          )}
        </Link>
        
        {/* Déconnexion */}
        {!isCollapsed ? (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Composant de recherche globale */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
