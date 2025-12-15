/**
 * Real-time Notifications Hook
 *
 * Provides real-time notification updates using SSE (Server-Sent Events).
 * Falls back to polling if SSE is not available.
 */

import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface BadgeCounts {
  communication: number;
  finance: number;
  messages: number;
  notifications: number;
}

interface RealtimeNotification {
  id: string;
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

  // Get unread notification count using existing router
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds as fallback
  });

  // Update badge counts when unread data changes
  useEffect(() => {
    if (unreadData) {
      setBadgeCounts((prev) => ({
        ...prev,
        notifications: unreadData.unread,
        communication: unreadData.unread,
      }));
    }
  }, [unreadData]);

  // SSE connection for real-time notifications
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/sse");

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener("notification", (event) => {
        try {
          const data = JSON.parse(event.data);

          // Update latest notification
          setLatestNotification({
            id: data.id,
            type: data.type,
            title: data.title,
            message: data.message,
            createdAt: new Date(data.createdAt),
          });

          // Increment notification counter
          setBadgeCounts((prev) => ({
            ...prev,
            notifications: prev.notifications + 1,
            communication: prev.communication + 1,
          }));

          // Invalidate queries to refresh data
          utils.notifications.getUnreadCount.invalidate();
          utils.notifications.list.invalidate();
        } catch {
          // Ignore parse errors
        }
      });

      eventSource.addEventListener("message", (event) => {
        try {
          JSON.parse(event.data);

          // Increment message counter
          setBadgeCounts((prev) => ({
            ...prev,
            messages: prev.messages + 1,
            communication: prev.communication + 1,
          }));

          // Invalidate queries
          utils.notifications.getUnreadCount.invalidate();
        } catch {
          // Ignore parse errors
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
      };
    } catch {
      // SSE not supported - will use polling
      setIsConnected(false);
    }

    // Cleanup on disconnect
    return () => {
      eventSource?.close();
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
