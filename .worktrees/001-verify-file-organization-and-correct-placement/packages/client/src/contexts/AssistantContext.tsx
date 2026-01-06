import React, { createContext, useContext, useState, useEffect } from "react";

interface AssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleAssistant: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    // Charger l'état depuis localStorage
    const stored = localStorage.getItem("assistantOpen");
    return stored !== null ? stored === "true" : true; // Ouvert par défaut
  });

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem("assistantOpen", String(isOpen));
  }, [isOpen]);

  const toggleAssistant = () => setIsOpen(!isOpen);

  return (
    <AssistantContext.Provider value={{ isOpen, setIsOpen, toggleAssistant }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}
