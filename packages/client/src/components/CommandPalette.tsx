import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Calendar,
  Users,
  FileText,
  Settings,
  BarChart3,
  Music,
  Package,
  Plus,
  UserPlus,
} from "lucide-react";

interface Command {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigationCommands: Command[] = [
    {
      label: "Dashboard",
      icon: <Home className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/dashboard");
        setOpen(false);
      },
      keywords: ["accueil", "home"],
    },
    {
      label: "Sessions",
      icon: <Music className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/sessions");
        setOpen(false);
      },
      keywords: ["enregistrement", "recording"],
    },
    {
      label: "Calendrier",
      icon: <Calendar className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/calendar");
        setOpen(false);
      },
      keywords: ["planning", "schedule"],
    },
    {
      label: "Clients",
      icon: <Users className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/clients");
        setOpen(false);
      },
      keywords: ["customers"],
    },
    {
      label: "Équipe",
      icon: <Users className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/team");
        setOpen(false);
      },
      keywords: ["team", "membres", "members"],
    },
    {
      label: "Équipement",
      icon: <Package className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/equipment");
        setOpen(false);
      },
      keywords: ["materiel", "gear"],
    },
    {
      label: "Factures",
      icon: <FileText className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/invoices");
        setOpen(false);
      },
      keywords: ["invoices", "billing"],
    },
    {
      label: "Analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/analytics");
        setOpen(false);
      },
      keywords: ["statistiques", "rapports", "reports"],
    },
    {
      label: "Paramètres",
      icon: <Settings className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/settings");
        setOpen(false);
      },
      keywords: ["settings", "configuration"],
    },
  ];

  const actionCommands: Command[] = [
    {
      label: "Nouvelle session",
      icon: <Plus className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/sessions/new");
        setOpen(false);
      },
      keywords: ["create", "add", "nouveau"],
    },
    {
      label: "Nouveau client",
      icon: <UserPlus className="mr-2 h-4 w-4" />,
      action: () => {
        setLocation("/clients/new");
        setOpen(false);
      },
      keywords: ["create", "add", "nouveau"],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une page ou une action..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigationCommands.map((command) => (
            <CommandItem
              key={command.label}
              onSelect={command.action}
              keywords={command.keywords}
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {actionCommands.map((command) => (
            <CommandItem
              key={command.label}
              onSelect={command.action}
              keywords={command.keywords}
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
