import { Response } from 'express';

/**
 * Notification Broadcaster - SSE Event Manager
 *
 * Manages Server-Sent Events connections for real-time notifications
 * Each connected client receives notifications instantly when created
 */

interface SSEClient {
  userId: number;
  organizationId: number;
  response: Response;
}

class NotificationBroadcaster {
  private clients: Map<string, SSEClient> = new Map();

  /**
   * Register a new SSE client connection
   */
  addClient(userId: number, organizationId: number, response: Response): string {
    const clientId = `${userId}-${organizationId}-${Date.now()}`;

    this.clients.set(clientId, {
      userId,
      organizationId,
      response,
    });

    console.log(`[SSE] Client connected: ${clientId} (total: ${this.clients.size})`);

    return clientId;
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string) {
    if (this.clients.delete(clientId)) {
      console.log(`[SSE] Client disconnected: ${clientId} (total: ${this.clients.size})`);
    }
  }

  /**
   * Broadcast a notification to a specific user
   */
  sendToUser(userId: number, organizationId: number, notification: any) {
    let sent = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId && client.organizationId === organizationId) {
        try {
          const payload = JSON.stringify({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString(),
          });

          client.response.write(`data: ${payload}\n\n`);
          sent++;
        } catch (error) {
          console.error(`[SSE] Failed to send to ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }

    if (sent > 0) {
      console.log(`[SSE] Notification sent to ${sent} client(s) (userId=${userId}, orgId=${organizationId})`);
    }

    return sent;
  }

  /**
   * Broadcast to all users in an organization
   */
  sendToOrganization(organizationId: number, notification: any) {
    let sent = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.organizationId === organizationId) {
        try {
          const payload = JSON.stringify({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString(),
          });

          client.response.write(`data: ${payload}\n\n`);
          sent++;
        } catch (error) {
          console.error(`[SSE] Failed to send to ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }

    if (sent > 0) {
      console.log(`[SSE] Notification sent to ${sent} client(s) in organization ${organizationId}`);
    }

    return sent;
  }

  /**
   * Get count of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get count of clients for a specific user
   */
  getUserClientCount(userId: number, organizationId: number): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.userId === userId && client.organizationId === organizationId) {
        count++;
      }
    }
    return count;
  }
}

// Singleton instance
export const notificationBroadcaster = new NotificationBroadcaster();
