import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Music,
  FileText,
  Package,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

interface SearchResult {
  id: number;
  type: "client" | "session" | "invoice" | "equipment" | "musician";
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  score: number;
}

const typeIcons = {
  client: User,
  session: Music,
  invoice: FileText,
  equipment: Package,
  musician: MessageSquare,
};

const typeLabels = {
  client: "Client",
  session: "Session",
  invoice: "Facture",
  equipment: "Équipement",
  musician: "Talent",
};

const typeColors = {
  client: "bg-blue-500/10 text-blue-500",
  session: "bg-purple-500/10 text-purple-500",
  invoice: "bg-green-500/10 text-green-500",
  equipment: "bg-orange-500/10 text-orange-500",
  musician: "bg-pink-500/10 text-pink-500",
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Real search with tRPC
  const { data: results = [], isLoading } = trpc.search.global.useQuery(
    {
      query,
      limit: 20,
    },
    {
      enabled: open && query.length >= 2,
      refetchOnWindowFocus: false,
    }
  );

  // Group results by type
  const groupedResults = results?.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Flatten grouped results for keyboard navigation
  const flatResults = results || [];

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else {
      setQuery("");
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!flatResults.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        if (selected) {
          navigate(selected.url);
          onOpenChange(false);
        }
      }
    },
    [flatResults, selectedIndex, navigate, onOpenChange]
  );

  const handleResultClick = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher des clients, sessions, factures, équipements, talents..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
        </div>

        <ScrollArea className="max-h-[500px]">
          {query.length < 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Tapez au moins 2 caractères pour rechercher</p>
              <p className="text-xs mt-2">
                Recherchez dans les clients, sessions, factures, équipements et talents
              </p>
            </div>
          ) : !results || results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Aucun résultat trouvé</p>
              <p className="text-xs mt-2">
                Essayez avec un autre terme de recherche
              </p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedResults || {}).map(([type, items]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                const label = typeLabels[type as keyof typeof typeLabels];

                return (
                  <div key={type} className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Icon className="h-3 w-3" />
                      {label}
                      <Badge variant="secondary" className="ml-auto">
                        {items.length}
                      </Badge>
                    </div>
                    <div>
                      {items.map((result) => {
                        const globalIndex = flatResults.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result.url)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full px-4 py-3 text-left transition-colors ${
                              isSelected ? "bg-accent" : "hover:bg-accent/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  typeColors[result.type as keyof typeof typeColors]
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {result.subtitle}
                                </div>
                                {result.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {result.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↓</kbd>
              <span className="ml-1">Naviguer</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
              <span className="ml-1">Sélectionner</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
              <span className="ml-1">Fermer</span>
            </div>
          </div>
          <div>
            {results && results.length > 0 && `${results.length} résultat${results.length > 1 ? "s" : ""}`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
