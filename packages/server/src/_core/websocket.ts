/**
 * WebSocket Module (Socket.IO)
 *
 * Real-time communication for the Recording Studio Manager:
 * - Session status updates
 * - Notifications
 * - Presence indicators
 * - Live chat
 * - Collaborative editing
 *
 * Usage:
 *   import { initWebSocket, emitToRoom, emitToUser } from './_core/websocket';
 *   initWebSocket(httpServer);
 *   emitToRoom('org:123', 'session:updated', { sessionId: 1, status: 'completed' });
 */

import type { Server as HTTPServer } from "http";

// =============================================================================
// Types
// =============================================================================

export interface SocketUser {
  id: number;
  organizationId: number;
  role: "admin" | "member" | "client";
  name: string;
  email: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface PresenceInfo {
  userId: number;
  name: string;
  status: "online" | "away" | "busy";
  currentPage?: string;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  recipientId?: number;
  roomId?: string;
  content: string;
  timestamp: Date;
  type: "text" | "system" | "file";
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  userId: number;
  type:
    | "session_reminder"
    | "session_started"
    | "session_completed"
    | "invoice_created"
    | "invoice_sent"
    | "invoice_paid"
    | "invoice_overdue"
    | "payment_received"
    | "booking_created"
    | "booking_confirmed"
    | "booking_cancelled"
    | "project_update"
    | "file_shared"
    | "message_received"
    | "mention"
    | "system_alert"
    | "welcome";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export type WebSocketEvent =
  | "session:created"
  | "session:updated"
  | "session:deleted"
  | "session:started"
  | "session:completed"
  | "invoice:created"
  | "invoice:paid"
  | "invoice:overdue"
  | "booking:created"
  | "booking:confirmed"
  | "booking:cancelled"
  | "project:updated"
  | "file:uploaded"
  | "notification"
  | "chat:message"
  | "presence:update"
  | "presence:typing"
  | "user:connected"
  | "user:disconnected";

// =============================================================================
// State Management
// =============================================================================

// Connected users by socket ID
const connectedUsers = new Map<string, SocketUser>();

// Socket IDs by user ID (for direct messaging)
const userSockets = new Map<number, Set<string>>();

// Online presence by organization
const orgPresence = new Map<number, Map<number, PresenceInfo>>();

// Notification queue (in production, use Redis)
const notificationQueue: Notification[] = [];

// Mock Socket.IO server (in production, use actual socket.io)
interface MockSocket {
  id: string;
  handshake: { auth: Record<string, unknown> };
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: unknown) => void;
  on: (event: string, callback: (data: unknown) => void) => void;
  disconnect: () => void;
}

interface MockIO {
  on: (event: string, callback: (socket: MockSocket) => void) => void;
  to: (room: string) => { emit: (event: string, data: unknown) => void };
  emit: (event: string, data: unknown) => void;
}

let io: MockIO | null = null;

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize WebSocket server
 */
export function initWebSocket(_httpServer: HTTPServer): void {
  // In production, this would use actual Socket.IO:
  // io = new Server(httpServer, {
  //   cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
  //   transports: ["websocket", "polling"],
  // });

  console.log("[WebSocket] Initializing Socket.IO server...");

  // Mock implementation for development
  io = createMockIO();

  io.on("connection", (socket: MockSocket) => {
    handleConnection(socket);

    socket.on("disconnect", () => handleDisconnect(socket));
    socket.on("presence:update", (data) => handlePresenceUpdate(socket, data as Partial<PresenceInfo>));
    socket.on("chat:message", (data) => handleChatMessage(socket, data as Partial<ChatMessage>));
    socket.on("typing:start", (data) => handleTyping(socket, data as { roomId: string }, true));
    socket.on("typing:stop", (data) => handleTyping(socket, data as { roomId: string }, false));
  });

  console.log("[WebSocket] Socket.IO server initialized");
}

/**
 * Create mock IO for development
 */
function createMockIO(): MockIO {
  const handlers = new Map<string, (socket: MockSocket) => void>();
  const rooms = new Map<string, Set<string>>();

  return {
    on: (event: string, callback: (socket: MockSocket) => void) => {
      handlers.set(event, callback);
    },
    to: (room: string) => ({
      emit: (event: string, data: unknown) => {
        const socketIds = rooms.get(room);
        if (socketIds) {
          console.log(`[WebSocket] Emit to room ${room}: ${event}`, data);
        }
      },
    }),
    emit: (event: string, data: unknown) => {
      console.log(`[WebSocket] Broadcast: ${event}`, data);
    },
  };
}

/**
 * Check if WebSocket is initialized
 */
export function isWebSocketInitialized(): boolean {
  return io !== null;
}

// =============================================================================
// Connection Handlers
// =============================================================================

/**
 * Handle new socket connection
 */
function handleConnection(socket: MockSocket): void {
  const auth = socket.handshake.auth;

  // Validate auth token (in production, verify JWT)
  if (!auth.userId || !auth.organizationId) {
    console.log(`[WebSocket] Invalid auth, disconnecting ${socket.id}`);
    socket.disconnect();
    return;
  }

  const user: SocketUser = {
    id: auth.userId as number,
    organizationId: auth.organizationId as number,
    role: (auth.role as SocketUser["role"]) ?? "member",
    name: (auth.name as string) ?? "Unknown",
    email: (auth.email as string) ?? "",
    socketId: socket.id,
    connectedAt: new Date(),
    lastActivity: new Date(),
  };

  // Store connection
  connectedUsers.set(socket.id, user);

  // Add to user's socket set
  if (!userSockets.has(user.id)) {
    userSockets.set(user.id, new Set());
  }
  userSockets.get(user.id)!.add(socket.id);

  // Join organization room
  socket.join(`org:${user.organizationId}`);

  // Join user's personal room
  socket.join(`user:${user.id}`);

  // Update presence
  updatePresence(user.organizationId, user.id, {
    userId: user.id,
    name: user.name,
    status: "online",
    lastSeen: new Date(),
  });

  // Notify organization
  emitToRoom(`org:${user.organizationId}`, "user:connected", {
    userId: user.id,
    name: user.name,
  });

  console.log(`[WebSocket] User connected: ${user.name} (${user.id}) - ${socket.id}`);
}

/**
 * Handle socket disconnection
 */
function handleDisconnect(socket: MockSocket): void {
  const user = connectedUsers.get(socket.id);
  if (!user) return;

  // Remove from connections
  connectedUsers.delete(socket.id);

  // Remove from user's socket set
  const sockets = userSockets.get(user.id);
  if (sockets) {
    sockets.delete(socket.id);
    if (sockets.size === 0) {
      userSockets.delete(user.id);

      // User fully disconnected, update presence
      updatePresence(user.organizationId, user.id, {
        userId: user.id,
        name: user.name,
        status: "online", // Will be removed
        lastSeen: new Date(),
      });

      // Remove from presence
      const orgMap = orgPresence.get(user.organizationId);
      if (orgMap) {
        orgMap.delete(user.id);
      }

      // Notify organization
      emitToRoom(`org:${user.organizationId}`, "user:disconnected", {
        userId: user.id,
        name: user.name,
      });
    }
  }

  console.log(`[WebSocket] User disconnected: ${user.name} (${user.id})`);
}

// =============================================================================
// Presence Management
// =============================================================================

/**
 * Update user presence
 */
function updatePresence(
  organizationId: number,
  userId: number,
  info: PresenceInfo
): void {
  if (!orgPresence.has(organizationId)) {
    orgPresence.set(organizationId, new Map());
  }

  const orgMap = orgPresence.get(organizationId)!;
  orgMap.set(userId, info);

  // Broadcast presence update to organization
  emitToRoom(`org:${organizationId}`, "presence:update", {
    userId,
    status: info.status,
    currentPage: info.currentPage,
    lastSeen: info.lastSeen.toISOString(),
  });
}

/**
 * Handle presence update from client
 */
function handlePresenceUpdate(socket: MockSocket, data: Partial<PresenceInfo>): void {
  const user = connectedUsers.get(socket.id);
  if (!user) return;

  const orgMap = orgPresence.get(user.organizationId);
  if (!orgMap) return;

  const current = orgMap.get(user.id);
  if (!current) return;

  updatePresence(user.organizationId, user.id, {
    ...current,
    status: data.status ?? current.status,
    currentPage: data.currentPage ?? current.currentPage,
    lastSeen: new Date(),
  });

  // Update last activity
  user.lastActivity = new Date();
}

/**
 * Get online users for organization
 */
export function getOnlineUsers(organizationId: number): PresenceInfo[] {
  const orgMap = orgPresence.get(organizationId);
  if (!orgMap) return [];

  return Array.from(orgMap.values());
}

// =============================================================================
// Chat
// =============================================================================

/**
 * Handle chat message
 */
function handleChatMessage(socket: MockSocket, data: Partial<ChatMessage>): void {
  const user = connectedUsers.get(socket.id);
  if (!user) return;

  const message: ChatMessage = {
    id: generateId(),
    senderId: user.id,
    senderName: user.name,
    recipientId: data.recipientId,
    roomId: data.roomId ?? `org:${user.organizationId}`,
    content: data.content ?? "",
    timestamp: new Date(),
    type: data.type ?? "text",
    metadata: data.metadata,
  };

  if (message.recipientId) {
    // Direct message
    emitToUser(message.recipientId, "chat:message", message);
    emitToUser(user.id, "chat:message", message); // Echo to sender
  } else if (message.roomId) {
    // Room message
    emitToRoom(message.roomId, "chat:message", message);
  }
}

/**
 * Handle typing indicator
 */
function handleTyping(socket: MockSocket, data: { roomId: string }, isTyping: boolean): void {
  const user = connectedUsers.get(socket.id);
  if (!user) return;

  emitToRoom(data.roomId, "presence:typing", {
    userId: user.id,
    name: user.name,
    isTyping,
  });
}

// =============================================================================
// Emit Functions
// =============================================================================

/**
 * Emit event to all sockets in a room
 */
export function emitToRoom(room: string, event: WebSocketEvent, data: unknown): void {
  if (!io) {
    console.log(`[WebSocket] Not initialized, would emit to room ${room}: ${event}`);
    return;
  }

  io.to(room).emit(event, data);
}

/**
 * Emit event to a specific user (all their connections)
 */
export function emitToUser(userId: number, event: WebSocketEvent, data: unknown): void {
  emitToRoom(`user:${userId}`, event, data);
}

/**
 * Emit event to all users in an organization
 */
export function emitToOrganization(organizationId: number, event: WebSocketEvent, data: unknown): void {
  emitToRoom(`org:${organizationId}`, event, data);
}

/**
 * Broadcast event to all connected users
 */
export function broadcast(event: WebSocketEvent, data: unknown): void {
  if (!io) {
    console.log(`[WebSocket] Not initialized, would broadcast: ${event}`);
    return;
  }

  io.emit(event, data);
}

// =============================================================================
// Notifications
// =============================================================================

/**
 * Send notification to user
 */
export function sendNotification(notification: Omit<Notification, "id" | "read" | "createdAt">): void {
  const fullNotification: Notification = {
    ...notification,
    id: generateId(),
    read: false,
    createdAt: new Date(),
  };

  // Store notification
  notificationQueue.push(fullNotification);

  // Keep only last 10000 notifications (in production, use database)
  if (notificationQueue.length > 10000) {
    notificationQueue.shift();
  }

  // Send via WebSocket
  emitToUser(notification.userId, "notification", fullNotification);
}

/**
 * Get unread notifications for user
 */
export function getUnreadNotifications(userId: number): Notification[] {
  return notificationQueue.filter((n) => n.userId === userId && !n.read);
}

/**
 * Mark notification as read
 */
export function markNotificationRead(notificationId: string): void {
  const notification = notificationQueue.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
}

// =============================================================================
// Event Helpers
// =============================================================================

/**
 * Notify about session update
 */
export function notifySessionUpdate(
  organizationId: number,
  sessionId: number,
  event: "created" | "updated" | "deleted" | "started" | "completed",
  data: Record<string, unknown>
): void {
  emitToOrganization(organizationId, `session:${event}` as WebSocketEvent, {
    sessionId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notify about invoice update
 */
export function notifyInvoiceUpdate(
  organizationId: number,
  clientId: number,
  invoiceId: number,
  event: "created" | "paid" | "overdue",
  data: Record<string, unknown>
): void {
  // Notify organization staff
  emitToOrganization(organizationId, `invoice:${event}` as WebSocketEvent, {
    invoiceId,
    ...data,
    timestamp: new Date().toISOString(),
  });

  // Notify client
  emitToUser(clientId, `invoice:${event}` as WebSocketEvent, {
    invoiceId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notify about booking update
 */
export function notifyBookingUpdate(
  organizationId: number,
  clientId: number,
  bookingId: number,
  event: "created" | "confirmed" | "cancelled",
  data: Record<string, unknown>
): void {
  emitToOrganization(organizationId, `booking:${event}` as WebSocketEvent, {
    bookingId,
    ...data,
    timestamp: new Date().toISOString(),
  });

  emitToUser(clientId, `booking:${event}` as WebSocketEvent, {
    bookingId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Get connection statistics
 */
export function getConnectionStats(): {
  totalConnections: number;
  uniqueUsers: number;
  organizationCounts: Record<number, number>;
} {
  const orgCounts: Record<number, number> = {};

  for (const user of connectedUsers.values()) {
    orgCounts[user.organizationId] = (orgCounts[user.organizationId] ?? 0) + 1;
  }

  return {
    totalConnections: connectedUsers.size,
    uniqueUsers: userSockets.size,
    organizationCounts: orgCounts,
  };
}
