/**
 * AI Assistant Component
 *
 * Provides AI-powered assistance for studio management.
 * Simplified version for Hybrid project.
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, Calendar, FileText, CheckSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AIAssistant({ isOpen = true, onClose }: AIAssistantProps) {
  const welcomeMessage: Message = {
    id: "welcome",
    role: "assistant",
    content: `Bonjour ! Je suis votre assistant IA pour la gestion du studio. Je peux vous aider à:

• Préparer vos sessions
• Gérer vos projets et checklists
• Vérifier les devis et paiements
• Créer des dossiers de travail
• Analyser le planning et les revenus

Que puis-je faire pour vous aujourd'hui ?`,
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: aiConfig } = trpc.ai.isEnabled.useQuery();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response - would integrate with AI router in production
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Je suis l'assistant AI du studio. Cette fonctionnalité sera bientôt disponible pour vous aider avec vos projets d'enregistrement.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleClearHistory = () => {
    if (confirm("Voulez-vous vraiment effacer l'historique de la conversation ?")) {
      setMessages([welcomeMessage]);
    }
  };

  if (!isOpen) {
    return null;
  }

  if (!aiConfig?.enabled) {
    return (
      <Card className="fixed right-6 bottom-6 w-80">
        <CardContent className="py-6 text-center text-muted-foreground">
          L'assistant AI n'est pas activé pour cette organisation.
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen w-96 border-l border-border bg-card shadow-xl transition-all flex flex-col z-[100]",
        isMinimized && "w-16"
      )}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="border-b border-border pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {!isMinimized && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Assistant IA</CardTitle>
                  {isLoading && (
                    <p className="text-xs text-muted-foreground">En train d'écrire...</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearHistory}
                  className="h-8 w-8"
                  title="Effacer l'historique"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" && "flex-row-reverse"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          message.role === "assistant"
                            ? "bg-primary"
                            : "bg-muted"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <span className="text-sm font-medium">U</span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex-1 rounded-lg px-4 py-2",
                          message.role === "assistant"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            message.role === "assistant"
                              ? "text-muted-foreground"
                              : "text-primary-foreground/70"
                          )}
                        >
                          {message.timestamp.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Bot className="h-4 w-4 text-primary-foreground animate-pulse" />
                      </div>
                      <div className="flex-1 rounded-lg bg-muted px-4 py-2">
                        <p className="text-sm text-muted-foreground">
                          En train d'écrire...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <Separator />

            {/* Quick action buttons */}
            <div className="px-4 py-2 border-b border-border flex-shrink-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Sessions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Devis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Checklist
                </Button>
              </div>
            </div>

            <div className="p-4 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez une question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="flex h-[calc(100vh-80px)] items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(false)}
              className="h-12 w-12"
            >
              <Bot className="h-6 w-6" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
