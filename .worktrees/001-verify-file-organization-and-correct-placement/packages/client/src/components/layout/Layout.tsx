import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIAssistant } from '../AIAssistant';
import { CommandPalette } from '../CommandPalette';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useChatbot } from '@/contexts/ChatbotContext';

export function Layout() {
  // Activer les notifications WebSocket en temps réel
  useWebSocket();
  const { getChatbotWidth } = useChatbot();
  const chatbotWidth = getChatbotWidth();

  return (
    <>
      <CommandPalette />
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar gauche */}
        <Sidebar />

        {/* Contenu principal avec header */}
        <div
          className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
          style={{ marginRight: `${chatbotWidth}px` }}
        >
          {/* Header fixe en haut */}
          <Header />

          {/* Contenu principal */}
          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <Outlet />
          </main>
        </div>

        {/* Assistant IA fixe à droite */}
        <AIAssistant />
      </div>
    </>
  );
}
