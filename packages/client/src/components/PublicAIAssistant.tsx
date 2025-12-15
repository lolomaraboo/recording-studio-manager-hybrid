import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

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
      content: "Bonjour ! Je suis l'assistant IA de Recording Studio Manager. Je peux vous aider à comprendre notre plateforme et ses fonctionnalités. Que souhaitez-vous savoir ?",
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

    if (lowerInput.includes("prix") || lowerInput.includes("tarif") || lowerInput.includes("coût") || lowerInput.includes("abonnement")) {
      return "Recording Studio Manager propose **3 plans d'abonnement** :\n\n**Free** - Gratuit\n- 10 sessions/mois\n- 5 clients\n- 1 salle\n- Support communautaire\n\n**Pro** - 49€/mois\n- Sessions illimitées\n- 50 clients\n- 5 salles\n- Support prioritaire\n- Analytics avancés\n\n**Enterprise** - 199€/mois\n- Tout illimité\n- Multi-studios\n- API access\n- Support dédié\n\nCommencez gratuitement dès maintenant !";
    }

    if (lowerInput.includes("fonctionnalit") || lowerInput.includes("feature") || lowerInput.includes("que fait") || lowerInput.includes("capacité")) {
      return "Recording Studio Manager vous offre une **solution complète** pour gérer votre studio :\n\n🎵 **Gestion des sessions** - Planifiez et suivez vos enregistrements\n📅 **Calendrier interactif** - Visualisez votre planning en un coup d'œil\n👥 **Gestion clients** - Base de données centralisée\n💰 **Facturation automatique** - Générez des factures professionnelles\n📊 **Analytics** - Suivez vos revenus et performances\n🎛️ **Gestion équipement** - Inventaire et maintenance\n👨‍💼 **Gestion d'équipe** - Rôles et permissions\n\nTout ce dont vous avez besoin en une seule plateforme !";
    }

    if (lowerInput.includes("commenc") || lowerInput.includes("démarr") || lowerInput.includes("inscr") || lowerInput.includes("créer")) {
      return "Pour commencer avec Recording Studio Manager, c'est simple :\n\n1. **Cliquez sur \"Accéder au Dashboard\"** en haut à droite\n2. **Connectez-vous** avec votre compte Manus\n3. **Créez votre organisation** (nom de votre studio)\n4. **Choisissez votre plan** (commencez gratuitement !)\n5. **Configurez votre studio** (salles, équipement, équipe)\n\nVous serez opérationnel en **moins de 5 minutes** ! 🚀\n\nBesoin d'aide pour démarrer ?";
    }

    if (lowerInput.includes("multi-tenant") || lowerInput.includes("sous-domaine") || lowerInput.includes("plusieurs studios")) {
      return "Oui ! Recording Studio Manager est une **plateforme SaaS multi-tenant** :\n\n✅ Chaque studio a son **propre sous-domaine** (ex: votrestudio.manus.space)\n✅ **Isolation complète des données** - vos données restent privées\n✅ **Gestion multi-studios** avec le plan Enterprise\n✅ **Personnalisation** par organisation\n\nParfait pour les chaînes de studios ou les gestionnaires multi-sites !";
    }

    if (lowerInput.includes("sécurit") || lowerInput.includes("données") || lowerInput.includes("confidential")) {
      return "La **sécurité** est notre priorité :\n\n🔒 **Isolation des données** - Chaque studio est isolé\n🔐 **Authentification OAuth** - Connexion sécurisée\n💾 **Backups automatiques** - Vos données sont protégées\n🛡️ **Chiffrement** - Communications sécurisées\n✅ **Conformité RGPD** - Respect de la vie privée\n\nVos données sont en sécurité avec nous !";
    }

    if (lowerInput.includes("support") || lowerInput.includes("aide") || lowerInput.includes("assistance")) {
      return "Nous sommes là pour vous aider !\n\n📧 **Support par email** - Tous les plans\n💬 **Chat en direct** - Plans Pro et Enterprise\n📚 **Documentation complète** - Guides et tutoriels\n🎥 **Vidéos de formation** - Apprenez à votre rythme\n👨‍💼 **Support dédié** - Plan Enterprise\n\nContactez-nous à support@recordingstudio.com";
    }

    if (lowerInput.includes("intégration") || lowerInput.includes("api") || lowerInput.includes("connecter")) {
      return "Recording Studio Manager s'intègre avec vos outils favoris :\n\n💳 **Stripe** - Paiements en ligne\n📧 **SendGrid** - Envoi d'emails automatiques\n⚡ **Zapier** - Automatisation (bientôt)\n🔌 **API REST** - Plan Enterprise\n📊 **Export de données** - CSV, PDF\n\nConnectez votre écosystème facilement !";
    }

    return "Je suis là pour répondre à vos questions sur **Recording Studio Manager** !\n\nVoici ce que je peux vous expliquer :\n- 💰 Les **tarifs et plans d'abonnement**\n- ⚡ Les **fonctionnalités** de la plateforme\n- 🚀 Comment **démarrer** rapidement\n- 🏢 Le système **multi-tenant**\n- 🔒 La **sécurité** de vos données\n- 🤝 Le **support** disponible\n- 🔌 Les **intégrations** possibles\n\nQue souhaitez-vous savoir ?";
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
                        {message.role === "assistant" ? (
                          <Streamdown>{message.content}</Streamdown>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
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
