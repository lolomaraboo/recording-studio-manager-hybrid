import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface KeyboardShortcut {
  key: string;
  path: string;
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  { key: "g+d", path: "/dashboard", description: "Dashboard" },
  { key: "g+s", path: "/sessions", description: "Sessions" },
  { key: "g+c", path: "/clients", description: "Clients" },
  { key: "g+e", path: "/equipment", description: "Équipement" },
  { key: "g+f", path: "/invoices", description: "Factures" },
  { key: "g+q", path: "/quotes", description: "Devis" },
  { key: "g+a", path: "/analytics", description: "Analytics" },
  { key: "g+p", path: "/projects", description: "Projets" },
  { key: "g+m", path: "/chat", description: "Messages" },
  { key: "g+n", path: "/notifications", description: "Notifications" },
];

export function useKeyboardShortcuts() {
  const navigate = useNavigate().pathname;

  useEffect(() => {
    let pressedKeys: string[] = [];
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Ajouter la touche pressée
      const key = e.key.toLowerCase();
      pressedKeys.push(key);

      // Limiter à 2 touches
      if (pressedKeys.length > 2) {
        pressedKeys = pressedKeys.slice(-2);
      }

      // Vérifier si une combinaison correspond
      const combination = pressedKeys.join("+");
      const shortcut = shortcuts.find((s) => s.key === combination);

      if (shortcut) {
        e.preventDefault();
        navigate(shortcut.path);
        pressedKeys = [];
      }

      // Réinitialiser après 2 secondes d'inactivité
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        pressedKeys = [];
      }, 2000);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [setLocation]);

  return shortcuts;
}
