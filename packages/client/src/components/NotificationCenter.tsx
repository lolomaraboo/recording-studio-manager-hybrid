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
  id: number;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string; // tRPC serializes Date to string
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Récupérer les notifications
  const { data: notificationsList } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { refetchInterval: 30000 } // Rafraîchir toutes les 30 secondes
  );

  // Récupérer le nombre de notifications non lues
  const { data: unreadNotifications } = trpc.notifications.unread.useQuery(
    undefined,
    { refetchInterval: 10000 } // Rafraîchir toutes les 10 secondes
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteMutation = trpc.notifications.delete.useMutation();

  const utils = trpc.useUtils();

  // Mettre à jour la liste locale quand les données arrivent
  useEffect(() => {
    if (notificationsList) {
      setNotifications(notificationsList as Notification[]);
    }
  }, [notificationsList]);

  // Connexion SSE pour les notifications en temps réel
  useEffect(() => {
    // Use relative URL so Vite proxy forwards to backend with credentials
    // In dev mode, pass test credentials as query params (EventSource doesn't support headers)
    let url = "/api/notifications/stream";
    if (import.meta.env.DEV) {
      url += "?userId=4&orgId=16"; // admin@test-studio-ui.com, Test Studio UI
    }
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "notification") {
        // Ajouter la nouvelle notification en haut de la liste
        setNotifications((prev) => [data.data, ...prev]);
        // Invalider les queries pour mettre à jour les compteurs
        utils.notifications.unread.invalidate();
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Connection error, retrying...");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [utils]);

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsReadMutation.mutateAsync({ notificationId });

    // Mettre à jour localement
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );

    // Invalider les queries
    utils.notifications.unread.invalidate();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();

    // Mettre à jour localement
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );

    // Invalider les queries
    utils.notifications.unread.invalidate();
  };

  const handleDelete = async (notificationId: number) => {
    await deleteMutation.mutateAsync({ notificationId });

    // Retirer localement
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    // Invalider les queries
    utils.notifications.list.invalidate();
    utils.notifications.unread.invalidate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Naviguer vers l'URL d'action si elle existe
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setOpen(false);
    }
  };

  const unreadCount = unreadNotifications?.length || 0;

  const getNotificationIcon = (_type: string) => {
    // Retourner une icône selon le type de notification
    return <Bell className="h-4 w-4" />;
  };

  const formatDate = (date: string | Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(date).toLocaleDateString("fr-FR");
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
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-accent/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
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
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                        {!notification.isRead && (
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
