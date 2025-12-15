import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Music } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrganizationId");
    if (storedOrgId) {
      setSelectedOrgId(parseInt(storedOrgId));
    }
  }, []);

  const { data: organization } = trpc.organizations.get.useQuery(
    { id: selectedOrgId! },
    { enabled: selectedOrgId !== null }
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo et nom de l'organisation */}
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Music className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">{organization?.name || "RSM"}</span>
              <span className="text-xs text-muted-foreground">
                Recording Studio Manager
              </span>
            </div>
          </div>
        </Link>

        {/* Contrôles (toujours visibles) */}
        <div className="flex items-center gap-2">
          {/* Mode clair/sombre */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <NotificationCenter />
        </div>
      </div>
    </header>
  );
}
