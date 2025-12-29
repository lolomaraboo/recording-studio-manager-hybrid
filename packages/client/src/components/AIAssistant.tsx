import { useAssistant } from "@/contexts/AssistantContext";
import { useChatbot } from "@/contexts/ChatbotContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Minimize2, Maximize2, ExternalLink, Maximize, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const { isOpen: assistantOpen } = useAssistant();
  const { isOpen, isMinimized, setIsMinimized, isFloating, setIsFloating } = useChatbot();
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 100 });
  const [size, setSize] = useState({ width: 384, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const chatMutation = trpc.ai.chat.useMutation();
  const utils = trpc.useUtils();

  // Load sessionId and conversation history from localStorage/DB on component mount
  useEffect(() => {
    const loadConversationHistory = async () => {
      const savedSessionId = localStorage.getItem('chatbot_sessionId');
      if (savedSessionId) {
        setSessionId(savedSessionId);

        // Load conversation history from backend
        try {
          const response = await utils.ai.getHistory.fetch({ sessionId: savedSessionId });
          if (response && response.messages && response.messages.length > 0) {
            // Convert DB messages to UI Message format
            const loadedMessages: Message[] = response.messages.map((msg: any, index: number) => ({
              id: `${Date.now()}_${index}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            }));
            setMessages(loadedMessages);
          }
        } catch (error) {
          console.error('Failed to load conversation history:', error);
          // If history fails to load, keep sessionId but start with empty messages
        }
      }
    };

    loadConversationHistory();
  }, []);

  // Handle mouse down on header (start dragging) - only in floating mode and not fullscreen
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFloating || isFullscreen) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.resize-handle')) {
      return; // Don't drag when clicking buttons or resize handle
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle mouse down on resize handle - only in floating mode and not fullscreen
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isFloating || isFullscreen) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  // Handle mouse move (dragging & resizing) - only in floating mode
  useEffect(() => {
    if (!isFloating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - 100;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        const newWidth = Math.max(300, Math.min(resizeStart.width + deltaX, window.innerWidth - position.x));
        const newHeight = Math.max(300, Math.min(resizeStart.height + deltaY, window.innerHeight - position.y));

        setSize({
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, isFloating, size, position]);

  // Toggle floating mode
  const toggleFloating = () => {
    setIsFloating(!isFloating);
    if (!isFloating) {
      // When switching to floating, reset minimized state
      setIsMinimized(false);
      setIsFullscreen(false);
    } else {
      // When docking back, reset fullscreen
      setIsFullscreen(false);
    }
  };

  // Toggle fullscreen mode - only available when floating
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input after sending a message and when chatbot opens
  useEffect(() => {
    if (!isMinimized && isOpen) {
      // Focus immediately
      inputRef.current?.focus();
    }
  }, [isMinimized, isOpen]);

  // Re-focus after bot response completes
  useEffect(() => {
    if (!isLoading && !isMinimized && isOpen) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: userMessage.content,
        sessionId: sessionId || undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Store sessionId from response for subsequent messages
      if (response.sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem('chatbot_sessionId', response.sessionId);
      }

      // Invalidate tRPC caches based on actions performed by the chatbot
      if (response.actionsCalled && response.actionsCalled.length > 0) {
        for (const action of response.actionsCalled) {
          // Client actions
          if (action.includes('client')) {
            utils.clients.list.invalidate();
          }
          // Session actions
          if (action.includes('session')) {
            utils.sessions.list.invalidate();
          }
          // Invoice actions
          if (action.includes('invoice')) {
            utils.invoices.list.invalidate();
          }
          // Room actions
          if (action.includes('room')) {
            utils.rooms.list.invalidate();
          }
          // Equipment actions
          if (action.includes('equipment')) {
            utils.equipment.list.invalidate();
          }
          // Project actions
          if (action.includes('project')) {
            utils.projects.list.invalidate();
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation and start fresh
  const startNewConversation = () => {
    setSessionId(null);
    localStorage.removeItem('chatbot_sessionId');
    setMessages([]);
  };

  if (!assistantOpen || !isOpen) {
    return null;
  }

  return (
    <div
      ref={chatRef}
      className={cn(
        "bg-card border-l border-border flex flex-col transition-all duration-300",
        // Docked mode (default) - fixed to right
        !isFloating && "fixed right-0 top-0 bottom-0",
        !isFloating && (isMinimized ? "w-16" : "w-96"),
        // Floating mode - custom position
        isFloating && !isFullscreen && "fixed border rounded-lg shadow-2xl z-50",
        // Fullscreen mode - covers entire viewport
        isFloating && isFullscreen && "fixed inset-0 z-50 border-0 rounded-none",
        isDragging && "cursor-move",
        isResizing && "cursor-nwse-resize"
      )}
      style={isFloating && !isFullscreen ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      } : undefined}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b border-border shrink-0",
          isFloating && "cursor-move",
          isDragging && "opacity-80"
        )}
        onMouseDown={handleMouseDown}
      >
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
          {/* Fullscreen toggle - only show when floating and not minimized */}
          {isFloating && !isMinimized && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          )}
          {/* Floating toggle - only show when not minimized */}
          {!isMinimized && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleFloating}
              title={isFloating ? "Ancrer à droite" : "Mode fenêtre flottante"}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {/* Minimize/Maximize - only in docked mode */}
          {!isFloating && (
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
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Bot className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Posez-moi une question sur le studio ou demandez-moi d'effectuer une action.
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Exemples: "Crée une facture", "Liste les clients", "Crée un projet"
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => {
                  // Re-focus immediately if lost (unless clicking button)
                  setTimeout(() => {
                    if (!isLoading && document.activeElement?.tagName !== 'BUTTON') {
                      inputRef.current?.focus();
                    }
                  }, 0);
                }}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Resize handle - only in floating mode and not fullscreen */}
          {isFloating && !isFullscreen && (
            <div
              className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
              onMouseDown={handleResizeStart}
            >
              <svg
                className="absolute bottom-1 right-1 text-muted-foreground opacity-50 hover:opacity-100"
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <path
                  d="M 11 1 L 1 11 M 11 5 L 5 11 M 11 9 L 9 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
}
