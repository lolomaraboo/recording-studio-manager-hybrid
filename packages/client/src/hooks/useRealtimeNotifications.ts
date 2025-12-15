import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface BadgeCounts {
  communication: number;
  finance: number;
  messages: number;
  notifications: number;
}

interface RealtimeNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
}

export function useRealtimeNotifications() {
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    communication: 0,
    finance: 0,
    messages: 0,
    notifications: 0,
  });
  const [latestNotification, setLatestNotification] = useState<RealtimeNotification | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const utils = trpc.useUtils();

  // Récupérer les compteurs initiaux
  const { data: initialCounts } = trpc.sidebar.getBadgeCounts.useQuery(undefined, {
    refetchInterval: false, // Désactiver le polling car on utilise SSE
  });

  useEffect(() => {
    if (initialCounts) {
      setBadgeCounts(initialCounts);
    }
  }, [initialCounts]);

  // Connexion SSE pour les notifications en temps réel
  useEffect(() => {
    const eventSource = new EventSource("/api/sse");

    eventSource.onopen = () => {
      console.log("[SSE] Connected to realtime notifications");
      setIsConnected(true);
    };

    eventSource.addEventListener("notification", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] New notification received:", data);

        // Mettre à jour la dernière notification
        setLatestNotification({
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          createdAt: new Date(data.createdAt),
        });

        // Incrémenter le compteur de notifications
        setBadgeCounts((prev) => ({
          ...prev,
          notifications: prev.notifications + 1,
          communication: prev.communication + 1,
        }));

        // Invalider les requêtes pour rafraîchir les données
        utils.sidebar.getBadgeCounts.invalidate();
      } catch (error) {
        console.error("[SSE] Error parsing notification:", error);
      }
    });

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] New message received:", data);

        // Incrémenter le compteur de messages
        setBadgeCounts((prev) => ({
          ...prev,
          messages: prev.messages + 1,
          communication: prev.communication + 1,
        }));

        // Invalider les requêtes pour rafraîchir les données
        utils.sidebar.getBadgeCounts.invalidate();
      } catch (error) {
        console.error("[SSE] Error parsing message:", error);
      }
    });

    eventSource.addEventListener("invoice", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Invoice update received:", data);

        // Rafraîchir le compteur de factures
        utils.sidebar.getBadgeCounts.invalidate();
      } catch (error) {
        console.error("[SSE] Error parsing invoice:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error:", error);
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup à la déconnexion
    return () => {
      console.log("[SSE] Disconnecting from realtime notifications");
      eventSource.close();
      setIsConnected(false);
    };
  }, [utils]);

  const markNotificationAsRead = useCallback(() => {
    setLatestNotification(null);
  }, []);

  return {
    badgeCounts,
    latestNotification,
    isConnected,
    markNotificationAsRead,
  };
}
