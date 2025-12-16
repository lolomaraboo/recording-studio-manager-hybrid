import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAssistant } from "./AssistantContext";

interface ChatbotContextType {
  isOpen: boolean;
  isMinimized: boolean;
  setIsOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  getChatbotWidth: () => number;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const { isOpen: assistantIsOpen } = useAssistant();
  const [isOpen, setIsOpen] = useState(assistantIsOpen);
  const [isMinimized, setIsMinimized] = useState(false);

  // Synchroniser avec AssistantContext
  useEffect(() => {
    setIsOpen(assistantIsOpen);
  }, [assistantIsOpen]);

  const getChatbotWidth = () => {
    if (!isOpen) return 0; // Fermé: 0px
    if (isMinimized) return 64; // Mini: 64px (w-16)
    return 384; // Ouvert: 384px (w-96)
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        isMinimized,
        setIsOpen,
        setIsMinimized,
        getChatbotWidth,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
}
