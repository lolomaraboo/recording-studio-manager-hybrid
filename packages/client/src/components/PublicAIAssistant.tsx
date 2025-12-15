/**
 * Public AI Assistant Component
 *
 * A floating chat assistant for the public landing page.
 * Provides information about Recording Studio Manager.
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function PublicAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Bonjour ! Je suis l'assistant IA de Recording Studio Manager. Je peux vous aider a comprendre notre plateforme et ses fonctionnalites. Que souhaitez-vous savoir ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getPublicAIResponse(input),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPublicAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("prix") || lowerInput.includes("tarif") || lowerInput.includes("cout") || lowerInput.includes("abonnement")) {
      return "Recording Studio Manager propose 3 plans d'abonnement:\n\nFree - Gratuit\n- 10 sessions/mois\n- 5 clients\n- 1 salle\n- Support communautaire\n\nPro - 49EUR/mois\n- Sessions illimitees\n- 50 clients\n- 5 salles\n- Support prioritaire\n- Analytics avances\n\nEnterprise - 199EUR/mois\n- Tout illimite\n- Multi-studios\n- API access\n- Support dedie\n\nCommencez gratuitement des maintenant !";
    }

    if (lowerInput.includes("fonctionnalit") || lowerInput.includes("feature") || lowerInput.includes("que fait") || lowerInput.includes("capacite")) {
      return "Recording Studio Manager vous offre une solution complete pour gerer votre studio:\n\nGestion des sessions - Planifiez et suivez vos enregistrements\nCalendrier interactif - Visualisez votre planning en un coup d'oeil\nGestion clients - Base de donnees centralisee\nFacturation automatique - Generez des factures professionnelles\nAnalytics - Suivez vos revenus et performances\nGestion equipement - Inventaire et maintenance\nGestion d'equipe - Roles et permissions\n\nTout ce dont vous avez besoin en une seule plateforme !";
    }

    if (lowerInput.includes("commenc") || lowerInput.includes("demarr") || lowerInput.includes("inscr") || lowerInput.includes("creer")) {
      return "Pour commencer avec Recording Studio Manager, c'est simple:\n\n1. Cliquez sur 'Acceder au Dashboard' en haut a droite\n2. Connectez-vous avec votre compte\n3. Creez votre organisation (nom de votre studio)\n4. Choisissez votre plan (commencez gratuitement !)\n5. Configurez votre studio (salles, equipement, equipe)\n\nVous serez operationnel en moins de 5 minutes !\n\nBesoin d'aide pour demarrer ?";
    }

    if (lowerInput.includes("multi-tenant") || lowerInput.includes("sous-domaine") || lowerInput.includes("plusieurs studios")) {
      return "Oui ! Recording Studio Manager est une plateforme SaaS multi-tenant:\n\nChaque studio a son propre sous-domaine (ex: votrestudio.rsm.app)\nIsolation complete des donnees - vos donnees restent privees\nGestion multi-studios avec le plan Enterprise\nPersonnalisation par organisation\n\nParfait pour les chaines de studios ou les gestionnaires multi-sites !";
    }

    if (lowerInput.includes("securit") || lowerInput.includes("donnees") || lowerInput.includes("confidential")) {
      return "La securite est notre priorite:\n\nIsolation des donnees - Chaque studio est isole\nAuthentification OAuth - Connexion securisee\nBackups automatiques - Vos donnees sont protegees\nChiffrement - Communications securisees\nConformite RGPD - Respect de la vie privee\n\nVos donnees sont en securite avec nous !";
    }

    if (lowerInput.includes("support") || lowerInput.includes("aide") || lowerInput.includes("assistance")) {
      return "Nous sommes la pour vous aider !\n\nSupport par email - Tous les plans\nChat en direct - Plans Pro et Enterprise\nDocumentation complete - Guides et tutoriels\nVideos de formation - Apprenez a votre rythme\nSupport dedie - Plan Enterprise\n\nContactez-nous a support@recordingstudio.com";
    }

    if (lowerInput.includes("integration") || lowerInput.includes("api") || lowerInput.includes("connecter")) {
      return "Recording Studio Manager s'integre avec vos outils favoris:\n\nStripe - Paiements en ligne\nSendGrid - Envoi d'emails automatiques\nZapier - Automatisation (bientot)\nAPI REST - Plan Enterprise\nExport de donnees - CSV, PDF\n\nConnectez votre ecosysteme facilement !";
    }

    return "Je suis la pour repondre a vos questions sur Recording Studio Manager !\n\nVoici ce que je peux vous expliquer:\n- Les tarifs et plans d'abonnement\n- Les fonctionnalites de la plateforme\n- Comment demarrer rapidement\n- Le systeme multi-tenant\n- La securite de vos donnees\n- Le support disponible\n- Les integrations possibles\n\nQue souhaitez-vous savoir ?";
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-6 bottom-6 w-96 border border-border bg-background shadow-2xl rounded-lg transition-all z-50",
        isMinimized && "w-16 h-16"
      )}
    >
      <Card className="h-full rounded-lg border-0">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            {!isMinimized && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <CardTitle className="text-base">Assistant IA</CardTitle>
              </div>
            )}
            <div className="flex items-center gap-1">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-96 p-4" ref={scrollRef}>
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
                          En train d'ecrire...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <Separator />

            <div className="p-4">
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
                  placeholder="Posez votre question..."
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
      </Card>
    </div>
  );
}
