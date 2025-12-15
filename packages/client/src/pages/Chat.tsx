import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import type { ConversationResponse, MessageResponse } from "../../../shared/api-types";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Types importés depuis shared/api-types.ts
type Conversation = ConversationResponse;
type Message = MessageResponse;

export default function Chat() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const organizationId = 1; // TODO: Get from context

  // Récupérer les conversations
  const { data: conversations, refetch: refetchConversations } = trpc.chat.conversations.useQuery(
    { organizationId },
    { refetchInterval: 10000 }
  );

  // Récupérer les messages de la conversation sélectionnée
  const { data: conversationMessages } = trpc.chat.messages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId, refetchInterval: 5000 }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const markAsReadMutation = trpc.chat.markAsRead.useMutation();

  const utils = trpc.useUtils();

  // Mettre à jour les messages localement
  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages);
    }
  }, [conversationMessages]);

  // Écouter les nouveaux messages via SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "notification" && data.data.type === "chat_message") {
        const chatData = data.data.data;
        
        // Si c'est pour la conversation actuelle, ajouter le message
        if (chatData.conversationId === selectedConversationId) {
          setMessages((prev) => [...prev, chatData.message]);
          // Marquer comme lu automatiquement
          markAsReadMutation.mutate({ conversationId: selectedConversationId! });
        }
        
        // Rafraîchir la liste des conversations
        refetchConversations();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [selectedConversationId, markAsReadMutation, refetchConversations]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marquer comme lu quand on ouvre une conversation
  useEffect(() => {
    if (selectedConversationId) {
      markAsReadMutation.mutate({ conversationId: selectedConversationId });
    }
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedConversationId) return;

    const content = messageContent;
    setMessageContent("");

    // Optimistic update
    const optimisticMessage: Message = {
      message: {
        id: Date.now(),
        content,
        type: "text",
        createdAt: new Date(),
        isEdited: false,
      },
      sender: {
        id: user!.id,
        openId: user!.openId,
        name: user!.name,
        email: user!.email,
        loginMethod: user!.loginMethod || null,
        role: user!.role,
        stripeCustomerId: user!.stripeCustomerId || null,
        createdAt: user!.createdAt,
        updatedAt: user!.updatedAt,
        lastSignedIn: user!.lastSignedIn,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content,
      });

      // Rafraîchir les conversations pour mettre à jour lastMessage
      refetchConversations();
    } catch (error) {
      // Retirer le message optimiste en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.message.id !== optimisticMessage.message.id));
      console.error("Failed to send message:", error);
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    // Pour les conversations directes, afficher le nom de l'autre participant
    const otherParticipant = conversation.participants.find((p: any) => p.id !== user?.id);
    return otherParticipant?.name || "Conversation";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find((p: any) => p.id !== user?.id);
    return otherParticipant?.name?.charAt(0).toUpperCase() || "?";
  };

  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  return (
    <AppLayout>
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Communiquez avec votre équipe et vos clients
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Liste des conversations */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            {!conversations || conversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Aucune conversation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedConversationId === conversation.id
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getConversationAvatar(conversation as unknown as Conversation)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">
                            {getConversationTitle(conversation as unknown as Conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="shrink-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessagePreview && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessagePreview}
                          </p>
                        )}
                        {conversation.lastMessageAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatMessageTime(conversation.lastMessageAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Zone de messagerie */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedConversationId ? (
            <>
              {/* En-tête */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {getConversationAvatar(
                        conversations?.find((c) => c.id === selectedConversationId)! as unknown as Conversation
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {getConversationTitle(
                        conversations?.find((c) => c.id === selectedConversationId)! as unknown as Conversation
                      )}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {conversations?.find((c) => c.id === selectedConversationId)
                          ?.participants.length || 0}{" "}
                        participants
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.sender.id === user?.id;
                    const showAvatar =
                      index === 0 ||
                      messages[index - 1].sender.id !== message.sender.id;

                    return (
                      <div
                        key={message.message.id}
                        className={`flex gap-3 ${
                          isOwnMessage ? "flex-row-reverse" : ""
                        }`}
                      >
                        {showAvatar ? (
                          <Avatar className="shrink-0">
                            <AvatarFallback>
                              {(message.sender.name || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 shrink-0" />
                        )}
                        <div
                          className={`flex flex-col ${
                            isOwnMessage ? "items-end" : "items-start"
                          } max-w-[70%]`}
                        >
                          {showAvatar && (
                            <p className="text-sm font-medium mb-1">
                              {message.sender.name || "Utilisateur"}
                            </p>
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent"
                            }`}
                          >
                            <p className="text-sm">{message.message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatMessageTime(message.message.createdAt)}
                            {message.message.isEdited && " (modifié)"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              {/* Zone de saisie */}
              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!messageContent.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choisissez une conversation dans la liste pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
    </AppLayout>
  );
}
