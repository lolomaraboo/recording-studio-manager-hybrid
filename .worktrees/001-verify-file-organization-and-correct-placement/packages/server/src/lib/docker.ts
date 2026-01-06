import Docker from 'dockerode';

/**
 * Docker Utility Library
 *
 * Provides read-only Docker operations for superadmin monitoring:
 * - List containers with status
 * - Get container logs
 * - Get system metrics (CPU, memory, disk)
 *
 * Security:
 * - Read-only operations only (no restart/stop/exec)
 * - Graceful error handling if Docker socket not accessible
 * - Filtered safe data only (no raw Docker API exposure)
 */

// Initialize Docker client
let docker: Docker | null = null;

try {
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
} catch (error) {
  console.warn('⚠️ Docker socket not accessible - Docker monitoring disabled');
  docker = null;
}

/**
 * Container info returned to frontend
 */
export interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  state: string;
  image: string;
  created: string;
  uptime?: string;
}

/**
 * System metrics returned to frontend
 */
export interface SystemMetrics {
  containers: {
    total: number;
    running: number;
    stopped: number;
  };
  // Future: CPU, memory, disk usage from Docker API
}

/**
 * List all Docker containers
 *
 * Returns container name, status, uptime, image
 * Gracefully returns empty array if Docker not accessible
 */
export async function listContainers(): Promise<ContainerInfo[]> {
  if (!docker) {
    return [];
  }

  try {
    const containers = await docker.listContainers({ all: true });

    return containers.map((container) => {
      const name = container.Names[0]?.replace(/^\//, '') || 'unknown';
      const created = new Date(container.Created * 1000).toISOString();

      // Calculate uptime if running
      let uptime: string | undefined;
      if (container.State === 'running') {
        const uptimeSeconds = Math.floor(Date.now() / 1000) - container.Created;
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        uptime = `${hours}h ${minutes}m`;
      }

      return {
        id: container.Id,
        name,
        status: container.Status,
        state: container.State,
        image: container.Image,
        created,
        uptime,
      };
    });
  } catch (error) {
    console.error('Error listing containers:', error);
    return [];
  }
}

/**
 * Get logs for a specific container
 *
 * @param containerId - Container ID or name
 * @param tail - Number of lines to retrieve (default 100)
 * @returns Array of log lines
 */
export async function getContainerLogs(
  containerId: string,
  tail: number = 100
): Promise<string[]> {
  if (!docker) {
    return ['Docker not accessible'];
  }

  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });

    // Convert buffer to string and split into lines
    const logString = logs.toString('utf-8');
    const lines = logString.split('\n').filter((line) => line.trim());

    return lines;
  } catch (error: any) {
    console.error(`Error getting logs for container ${containerId}:`, error);
    return [`Error: ${error.message || 'Failed to retrieve logs'}`];
  }
}

/**
 * Get system metrics from Docker API
 *
 * Returns container counts (total, running, stopped)
 * Future: CPU usage, memory usage, disk usage
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  if (!docker) {
    return {
      containers: {
        total: 0,
        running: 0,
        stopped: 0,
      },
    };
  }

  try {
    const containers = await docker.listContainers({ all: true });

    const running = containers.filter((c) => c.State === 'running').length;
    const stopped = containers.filter((c) => c.State !== 'running').length;

    return {
      containers: {
        total: containers.length,
        running,
        stopped,
      },
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return {
      containers: {
        total: 0,
        running: 0,
        stopped: 0,
      },
    };
  }
}
