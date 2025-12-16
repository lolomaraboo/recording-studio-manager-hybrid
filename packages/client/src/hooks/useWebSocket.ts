/**
 * Hook React pour gérer la connexion WebSocket
 *
 * Usage:
 * ```tsx
 * const { isConnected, notifications } = useWebSocket();
 * ```
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "booking" | "payment" | "reminder" | "info";
  title: string;
  message: string;
  timestamp: number;
  data?: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Initialiser la connexion WebSocket
  useEffect(() => {
    // Récupérer le token JWT depuis le cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session="))
      ?.split("=")[1];

    if (!token) {
      console.warn("[WebSocket] No authentication token found");
      return;
    }

    // Créer la connexion Socket.IO
    const socket = io({
      path: "/socket.io",
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Gérer la connexion
    socket.on("connect", () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);

      // S'abonner à l'organisation actuelle
      const orgId = localStorage.getItem("selectedOrganizationId");
      if (orgId) {
        socket.emit("subscribe:organization", parseInt(orgId));
      }
    });

    // Gérer la déconnexion
    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
    });

    // Gérer les erreurs
    socket.on("connect_error", (error: Error) => {
      console.error("[WebSocket] Connection error:", error);
      setIsConnected(false);
    });

    // Écouter les nouvelles notifications
    socket.on("notification:new", (notification: Notification) => {
      console.log("[WebSocket] New notification:", notification);

      // Ajouter la notification à la liste
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Garder max 50 notifications

      // Afficher un toast selon le type
      const toastConfig = {
        booking: { icon: "📅", duration: 5000 },
        payment: { icon: "💰", duration: 5000 },
        reminder: { icon: "⏰", duration: 8000 },
        info: { icon: "ℹ️", duration: 4000 },
      };

      const config = toastConfig[notification.type] || toastConfig.info;

      toast(notification.title, {
        description: notification.message,
        duration: config.duration,
      });
    });

    // Cleanup à la déconnexion
    return () => {
      console.log("[WebSocket] Cleaning up connection");
      socket.disconnect();
    };
  }, []);

  // S'abonner à une organisation
  const subscribeToOrganization = useCallback((organizationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("subscribe:organization", organizationId);
      console.log(`[WebSocket] Subscribed to organization ${organizationId}`);
    }
  }, []);

  // Se désabonner d'une organisation
  const unsubscribeFromOrganization = useCallback((organizationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("unsubscribe:organization", organizationId);
      console.log(`[WebSocket] Unsubscribed from organization ${organizationId}`);
    }
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  }, []);

  // Effacer toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    notifications,
    subscribeToOrganization,
    unsubscribeFromOrganization,
    markAsRead,
    clearAll,
  };
}
