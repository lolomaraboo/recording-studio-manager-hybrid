/**
 * Socket.IO Event Types
 *
 * Type-safe definitions for real-time WebSocket events.
 * Used by both server (emit) and client (listen).
 */

export interface TimerStartedEvent {
  timeEntryId: number;
  taskType: {
    id: number;
    name: string;
    color: string | null;
  };
  sessionId: number | null;
  projectId: number | null;
  startTime: Date;
  userId: number | undefined;
}

export interface TimerStoppedEvent {
  timeEntryId: number;
  endTime: Date | null;
  durationMinutes: number | null;
  cost: {
    hours: number;
    minutes: number;
    cost: number;
    formattedCost: string;
  } | null;
  userId: number | undefined;
}

export interface TimerAdjustedEvent {
  timeEntryId: number;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  userId: number | undefined;
}

/**
 * Type map for all Socket.IO events
 *
 * Usage (server):
 * io.to(`org:${orgId}`).emit('timer:started', data);
 *
 * Usage (client):
 * socket.on('timer:started', (data: TimerStartedEvent) => { ... });
 */
export type SocketEvents = {
  'timer:started': TimerStartedEvent;
  'timer:stopped': TimerStoppedEvent;
  'timer:adjusted': TimerAdjustedEvent;
};
