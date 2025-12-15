/**
 * Sidebar Component
 *
 * Main navigation sidebar with collapsible sections, favorites, and drag & drop reordering.
 */

import { Link, useLocation } from "react-router-dom";
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
  Wrench,
  MessageCircle,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
  badgeKey?: "communication" | "finance";
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
        title: "Equipe",
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
        title: "Equipement",
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

// Sortable section component
function SortableSection({
  section,
  isExpanded,
  isCollapsed,
  location,
  badgeCounts,
  toggleSection,
  favorites,
  toggleFavorite,
}: {
  section: NavSection;
  isExpanded: boolean;
  isCollapsed: boolean;
  location: string;
  badgeCounts: Record<string, number>;
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
      {/* Section title clickable with triangle */}
      {!isCollapsed ? (
        <button
          onClick={(e) => toggleSection(section.title, e)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group"
          title="Cliquez pour ouvrir/fermer cette section. Alt+Clic pour ouvrir/fermer toutes les sections."
        >
          <div className="flex items-center gap-2">
            {section.icon}
            <span>{section.title}</span>
            {/* Notification badge */}
            {section.badgeKey && badgeCounts[section.badgeKey] > 0 && (
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

      {/* Section items (displayed if section is expanded) */}
      {isExpanded && (
        <div className="space-y-1 mt-1">
          {section.items.map((item) => {
            const isActive = location === item.href;
            const isFavorite = favorites.includes(item.href);
            return (
              <Link key={item.href} to={item.href}>
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
                          window.location.href = `${item.href}?action=create`;
                        }}
                        className="hover:bg-accent/50 rounded p-0.5"
                        title={`Creer ${item.title.toLowerCase()}`}
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
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [sectionsOrder, setSectionsOrder] = useState<NavSection[]>(navSections);
  const [favorites, setFavorites] = useState<string[]>([]);
  const logoutMutation = trpc.auth.logout.useMutation();

  // Drag & drop configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Placeholder badge counts (real-time notifications disabled temporarily)
  const badgeCounts = { finance: 0, communication: 0 };

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Load sidebar state from localStorage
  useEffect(() => {
    const storedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (storedCollapsed) {
      setIsCollapsed(storedCollapsed === "true");
    }

    // Load sections state (default all open)
    const storedSections = localStorage.getItem("sidebarExpandedSections");
    if (storedSections) {
      setExpandedSections(JSON.parse(storedSections));
    } else {
      const defaultExpanded: Record<string, boolean> = {};
      navSections.forEach(section => {
        defaultExpanded[section.title] = true;
      });
      setExpandedSections(defaultExpanded);
    }

    // Load favorites from localStorage
    const storedFavorites = localStorage.getItem("sidebarFavorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }

    // Load favorites section state
    const storedFavoritesExpanded = localStorage.getItem("sidebarFavoritesExpanded");
    if (storedFavoritesExpanded !== null) {
      setFavoritesExpanded(storedFavoritesExpanded === "true");
    }

    // Load custom sections order
    const storedOrder = localStorage.getItem("sidebarSectionsOrder");
    if (storedOrder) {
      const orderTitles = JSON.parse(storedOrder);
      const orderedSections = orderTitles
        .map((title: string) => navSections.find(s => s.title === title))
        .filter(Boolean);
      setSectionsOrder(orderedSections);
    }
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // Toggle a section (open/close)
  const toggleSection = (sectionTitle: string, event?: React.MouseEvent) => {
    if (event?.altKey) {
      // Alt+Click: open/close all sections
      const allExpanded = Object.values(expandedSections).every(v => v);
      const newExpandedSections: Record<string, boolean> = {};
      sectionsOrder.forEach(section => {
        newExpandedSections[section.title] = !allExpanded;
      });
      setExpandedSections(newExpandedSections);
      localStorage.setItem("sidebarExpandedSections", JSON.stringify(newExpandedSections));
    } else {
      // Normal click: toggle single section
      const newExpandedSections = {
        ...expandedSections,
        [sectionTitle]: !expandedSections[sectionTitle],
      };
      setExpandedSections(newExpandedSections);
      localStorage.setItem("sidebarExpandedSections", JSON.stringify(newExpandedSections));
    }
  };

  // Handle drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionsOrder((sections) => {
        const oldIndex = sections.findIndex((s) => s.title === active.id);
        const newIndex = sections.findIndex((s) => s.title === over.id);
        const newOrder = arrayMove(sections, oldIndex, newIndex);

        // Save order to localStorage
        localStorage.setItem(
          "sidebarSectionsOrder",
          JSON.stringify(newOrder.map((s) => s.title))
        );

        return newOrder;
      });
    }
  };

  // Keyboard shortcut Cmd+K / Ctrl+K to open search
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

  // Manage favorites
  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = favorites.includes(href)
      ? favorites.filter(f => f !== href)
      : [...favorites, href];
    setFavorites(newFavorites);
    localStorage.setItem("sidebarFavorites", JSON.stringify(newFavorites));
  };

  // Get all nav items
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
      {/* App title and collapse button on same line */}
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
          title={isCollapsed ? "Agrandir la sidebar" : "Reduire la sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Global search */}
      {!isCollapsed && (
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
      )}

      {isCollapsed && (
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
      )}

      {/* Navigation with collapsible sections (accordion) */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-2">
          {/* Dashboard first, without section */}
          <Link to="/dashboard">
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer group/item relative",
                pathname === "/dashboard"
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

          {/* Collapsible Favorites section */}
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
                    const isActive = pathname === favItem.href;
                    return (
                      <Link key={favItem.href} to={favItem.href}>
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
                            title="Creer un nouveau"
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

          {/* Sortable sections with drag & drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionsOrder.map((s) => s.title)}
              strategy={verticalListSortingStrategy}
            >
              {sectionsOrder.map((section) => (
                <SortableSection
                  key={section.title}
                  section={section}
                  isExpanded={expandedSections[section.title] !== false}
                  isCollapsed={isCollapsed}
                  location={pathname}
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

      {/* Settings and Logout at bottom */}
      <div className="p-4 space-y-2">
        {/* Settings */}
        <Link to="/settings">
          {!isCollapsed ? (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
            >
              <Wrench className="h-5 w-5" />
              <span>Parametres</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="w-full text-muted-foreground"
              title="Parametres"
            >
              <Wrench className="h-5 w-5" />
            </Button>
          )}
        </Link>

        {/* Logout */}
        {!isCollapsed ? (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Deconnexion</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            title="Deconnexion"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Global search component */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
