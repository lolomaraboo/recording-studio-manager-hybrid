import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

interface Notification {
  id: number;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: "session" | "invoice" | "client" | "system";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "success",
      title: "Session confirmée",
      message: "Marie Dubois a confirmé sa session pour vendredi 14h00",
      timestamp: new Date(2025, 11, 23, 10, 30),
      read: false,
      category: "session",
    },
    {
      id: 2,
      type: "warning",
      title: "Facture en retard",
      message: "Facture #2024-156 en retard de 5 jours (Client: Thomas Martin)",
      timestamp: new Date(2025, 11, 23, 9, 15),
      read: false,
      category: "invoice",
    },
    {
      id: 3,
      type: "info",
      title: "Nouveau client",
      message: "Sophie Bernard s'est inscrite sur le portail client",
      timestamp: new Date(2025, 11, 22, 16, 45),
      read: true,
      category: "client",
    },
    {
      id: 4,
      type: "success",
      title: "Paiement reçu",
      message: "Paiement de 450,00 € reçu pour la facture #2024-145",
      timestamp: new Date(2025, 11, 22, 14, 20),
      read: true,
      category: "invoice",
    },
    {
      id: 5,
      type: "info",
      title: "Session dans 24h",
      message: "Rappel: Session avec Jean Dupont demain à 10h00 (Salle A)",
      timestamp: new Date(2025, 11, 22, 10, 0),
      read: true,
      category: "session",
    },
  ]);

  const [selectedTab, setSelectedTab] = useState("all");

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: Notification["category"]) => {
    switch (category) {
      case "session":
        return <Calendar className="h-4 w-4" />;
      case "invoice":
        return <DollarSign className="h-4 w-4" />;
      case "client":
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const filteredNotifications =
    selectedTab === "all"
      ? notifications
      : selectedTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.category === selectedTab);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <Bell className="h-8 w-8 text-primary" />
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <Badge variant="default">{unreadCount} non lues</Badge>
                )}
              </div>
            </div>
          </div>
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">
              Toutes ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Non lues ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="session">
              <Calendar className="mr-2 h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="invoice">
              <DollarSign className="mr-2 h-4 w-4" />
              Factures
            </TabsTrigger>
            <TabsTrigger value="client">
              <Users className="mr-2 h-4 w-4" />
              Clients
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4 mt-6">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <Bell className="h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`${
                      !notification.read
                        ? "border-l-4 border-l-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{notification.title}</h3>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            <Badge variant="outline" className="ml-auto">
                              {getCategoryIcon(notification.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp.toLocaleString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="Marquer comme lu"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
