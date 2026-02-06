import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAssistant } from "./AssistantContext";

interface ChatbotContextType {
  isOpen: boolean;
  isMinimized: boolean;
  isFloating: boolean;
  setIsOpen: (open: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setIsFloating: (floating: boolean) => void;
  getChatbotWidth: () => number;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const { isOpen: assistantIsOpen } = useAssistant();
  const [isOpen, setIsOpen] = useState(assistantIsOpen);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('chatbot_minimized') === 'true';
  });
  const [isFloating, setIsFloating] = useState(() => {
    return localStorage.getItem('chatbot_floating') === 'true';
  });

  // Synchroniser avec AssistantContext
  useEffect(() => {
    setIsOpen(assistantIsOpen);
  }, [assistantIsOpen]);

  // Persister isMinimized dans localStorage
  useEffect(() => {
    localStorage.setItem('chatbot_minimized', String(isMinimized));
  }, [isMinimized]);

  // Persister isFloating dans localStorage
  useEffect(() => {
    localStorage.setItem('chatbot_floating', String(isFloating));
  }, [isFloating]);

  const getChatbotWidth = () => {
    if (!isOpen) return 0; // Fermé: 0px
    if (isFloating) return 0; // Flottant: 0px (ne prend pas d'espace)
    if (isMinimized) return 64; // Mini: 64px (w-16)
    return 384; // Ouvert: 384px (w-96)
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        isMinimized,
        isFloating,
        setIsOpen,
        setIsMinimized,
        setIsFloating,
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
