import { useAssistant } from "@/contexts/AssistantContext";
import { useChatbot } from "@/contexts/ChatbotContext";
import { Button } from "@/components/ui/button";
import { Bot, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIAssistant() {
  const { isOpen: assistantOpen } = useAssistant();
  const { isOpen, setIsOpen, isMinimized, setIsMinimized } = useChatbot();

  if (!assistantOpen || !isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-0 top-0 bottom-0 bg-card border-l border-border flex flex-col transition-all duration-300",
        isMinimized ? "w-16" : "w-96"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isMinimized && (
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Assistant</span>
          </div>
        )}
        {isMinimized && (
          <div className="mx-auto">
            <Bot className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Agrandir" : "Réduire"}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          {!isMinimized && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="space-y-4">
            <Bot className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Chatbot IA avec streaming, suggestions contextuelles, et stats du jour.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                En cours de développement...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
