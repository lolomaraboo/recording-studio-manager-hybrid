// Stub version - Real-time notifications will be implemented later
// For now, returns default values to allow Sidebar to compile

interface BadgeCounts {
  communication: number;
  finance: number;
  messages: number;
  notifications: number;
}

interface RealtimeNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
}

export function useRealtimeNotifications() {
  // TODO: Implement real SSE connection with backend
  // TODO: Create trpc.sidebar.getBadgeCounts router
  // TODO: Setup /api/sse endpoint

  const badgeCounts: BadgeCounts = {
    communication: 0,
    finance: 0,
    messages: 0,
    notifications: 0,
  };

  const latestNotification: RealtimeNotification | null = null;
  const isConnected = false;

  const markNotificationAsRead = () => {
    // Stub implementation
  };

  return {
    badgeCounts,
    latestNotification,
    isConnected,
    markNotificationAsRead,
  };
}
