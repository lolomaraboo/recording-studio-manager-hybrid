import { useAssistant } from "@/contexts/AssistantContext";
import { useChatbot } from "@/contexts/ChatbotContext";
import { Button } from "@/components/ui/button";
import { Bot, Minimize2, Maximize2, ExternalLink, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

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
          <div className="flex-1 flex items-center justify-center p-8 text-center overflow-auto">
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
