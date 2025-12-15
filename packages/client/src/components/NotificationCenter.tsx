/**
 * Notification Center Component
 *
 * Provides real-time notification functionality with SSE support.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  // Get notifications from server
  const { data: notificationsData } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Get unread count
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 10000 } // Refresh every 10 seconds
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteMutation = trpc.notifications.delete.useMutation();

  const utils = trpc.useUtils();

  // Update local state when server data changes
  useEffect(() => {
    if (notificationsData?.notifications) {
      setLocalNotifications(notificationsData.notifications);
    }
  }, [notificationsData]);

  // SSE connection for real-time notifications (optional, graceful degradation)
  useEffect(() => {
    try {
      const eventSource = new EventSource("/api/notifications/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "notification") {
            // Add new notification to the top of the list
            setLocalNotifications((prev) => [data.data, ...prev]);
            // Invalidate queries to update counters
            utils.notifications.getUnreadCount.invalidate();
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        // Close on error - will fall back to polling
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    } catch {
      // SSE not supported or error - rely on polling
    }
  }, [utils]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync({ notificationId });

    // Update locally
    setLocalNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    // Invalidate queries
    utils.notifications.getUnreadCount.invalidate();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();

    // Update locally
    setLocalNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );

    // Invalidate queries
    utils.notifications.getUnreadCount.invalidate();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteMutation.mutateAsync({ notificationId });

    // Remove locally
    setLocalNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    // Invalidate queries
    utils.notifications.list.invalidate();
    utils.notifications.getUnreadCount.invalidate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if exists in data
    const actionUrl = notification.data?.actionUrl as string | undefined;
    if (actionUrl) {
      navigate(actionUrl);
      setOpen(false);
    }
  };

  const unreadCount = unreadData?.unread || 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {localNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.read ? "bg-accent/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marquer comme lu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
