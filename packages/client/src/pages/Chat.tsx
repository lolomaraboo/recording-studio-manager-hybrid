import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
} from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");

  // Mock data
  const conversations: Conversation[] = [
    {
      id: 1,
      name: "Marie Dubois",
      lastMessage: "Merci pour la session d'hier !",
      timestamp: "10:30",
      unread: 2,
      online: true,
    },
    {
      id: 2,
      name: "Thomas Martin",
      lastMessage: "Est-ce que je peux venir plus tôt ?",
      timestamp: "09:15",
      unread: 0,
      online: false,
    },
    {
      id: 3,
      name: "Sophie Bernard",
      lastMessage: "Je t'envoie les fichiers ce soir",
      timestamp: "Hier",
      unread: 1,
      online: true,
    },
  ];

  const messages: Message[] = selectedConversation
    ? [
        {
          id: 1,
          senderId: 1,
          senderName: "Marie Dubois",
          content: "Bonjour ! Je voulais savoir si vous aviez du temps cette semaine pour une session ?",
          timestamp: new Date(2025, 11, 23, 9, 0),
          isOwn: false,
        },
        {
          id: 2,
          senderId: 2,
          senderName: "Vous",
          content: "Bonjour Marie ! Oui bien sûr, je suis disponible jeudi et vendredi après-midi.",
          timestamp: new Date(2025, 11, 23, 9, 15),
          isOwn: true,
        },
        {
          id: 3,
          senderId: 1,
          senderName: "Marie Dubois",
          content: "Parfait ! Je préfère vendredi si possible, vers 14h ?",
          timestamp: new Date(2025, 11, 23, 9, 20),
          isOwn: false,
        },
        {
          id: 4,
          senderId: 2,
          senderName: "Vous",
          content: "C'est noté, vendredi 14h. Je te prépare la salle A comme d'habitude ?",
          timestamp: new Date(2025, 11, 23, 9, 25),
          isOwn: true,
        },
        {
          id: 5,
          senderId: 1,
          senderName: "Marie Dubois",
          content: "Merci pour la session d'hier !",
          timestamp: new Date(2025, 11, 23, 10, 30),
          isOwn: false,
        },
      ]
    : [];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // TODO: Implement send message logic
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            Communiquez avec vos clients et collaborateurs
          </p>
        </div>
      </div>

      <Card className="h-[calc(100%-5rem)]">
        <div className="grid md:grid-cols-[350px_1fr] h-full">
          {/* Conversations List */}
          <div className="border-r">
            <CardHeader className="border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une conversation..."
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-5rem)]">
              <div className="p-2 space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>
                          {conv.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {conv.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {conv.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge variant="default" className="ml-auto">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Message Area */}
          <div className="flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {conversations
                          .find((c) => c.id === selectedConversation)
                          ?.name.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {
                          conversations.find((c) => c.id === selectedConversation)
                            ?.name
                        }
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {conversations.find((c) => c.id === selectedConversation)
                          ?.online
                          ? "En ligne"
                          : "Hors ligne"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une conversation</p>
                  <p className="text-sm">pour commencer à discuter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
