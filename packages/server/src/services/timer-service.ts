/**
 * Timer Service
 *
 * Business logic for time tracking operations.
 * Handles timer start/stop, time entry management, and cost calculations.
 */

import { eq, and, isNull, desc, between, inArray, type SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { taskTypes, timeEntries, type TimeEntry } from '@rsm/database';

type TenantDb = Awaited<ReturnType<typeof import('@rsm/database').getTenantDb>>;

interface StartTimerInput {
  taskTypeId: number;
  sessionId?: number;
  projectId?: number;
  notes?: string;
}

interface AdjustTimeEntryInput {
  startTime?: Date;
  endTime?: Date;
  notes?: string;
}

interface TimeHistoryFilters {
  dateRange?: { start: Date; end: Date };
  taskTypeIds?: number[];
  includeManuallyAdjusted?: boolean;
}

interface CalculatedCost {
  hours: number;
  minutes: number;
  cost: number;
  formattedCost: string;
}

interface TimeHistoryStats {
  totalHours: number;
  totalCost: number;
}

interface TimeHistoryResult {
  entries: (TimeEntry & { taskType: any })[];
  stats: TimeHistoryStats;
}

/**
 * Start new time entry
 *
 * Validates that:
 * - Task type exists
 * - Exactly one of sessionId OR projectId is provided
 * - No active timer already running for this session/project
 *
 * Fetches current hourlyRate from task_types for snapshot.
 */
export async function startTimer(
  db: TenantDb,
  data: StartTimerInput
): Promise<TimeEntry & { taskType: any }> {
  const { taskTypeId, sessionId, projectId, notes } = data;

  // Validation: Exactly one of sessionId OR projectId required
  if ((!sessionId && !projectId) || (sessionId && projectId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Exactly one of sessionId or projectId must be provided',
    });
  }

  // Check if task type exists and fetch hourlyRate
  const taskType = await db.query.taskTypes.findFirst({
    where: eq(taskTypes.id, taskTypeId),
  });

  if (!taskType) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Task type not found',
    });
  }

  if (!taskType.isActive) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cannot start timer: task type is inactive',
    });
  }

  // Check for active timer on this session/project
  const whereCondition = sessionId
    ? and(eq(timeEntries.sessionId, sessionId), isNull(timeEntries.endTime))
    : and(eq(timeEntries.projectId, projectId!), isNull(timeEntries.endTime));

  const activeTimer = await db.query.timeEntries.findFirst({
    where: whereCondition,
  });

  if (activeTimer) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cannot start timer: active timer already running for this session/project',
    });
  }

  // Create time entry
  const [newEntry] = await db
    .insert(timeEntries)
    .values({
      taskTypeId,
      sessionId: sessionId ?? null,
      projectId: projectId ?? null,
      startTime: new Date(),
      endTime: null,
      durationMinutes: null,
      hourlyRateSnapshot: taskType.hourlyRate,
      manuallyAdjusted: false,
      notes: notes ?? null,
    })
    .returning();

  // Return with task_type joined
  const result = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, newEntry.id),
    with: {
      taskType: true,
    },
  });

  if (!result) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve created time entry',
    });
  }

  return result;
}

/**
 * Stop running timer
 *
 * Validates that:
 * - Time entry exists
 * - endTime is null (timer is running)
 *
 * Calculates durationMinutes and sets endTime.
 */
export async function stopTimer(
  db: TenantDb,
  timeEntryId: number
): Promise<TimeEntry> {
  // Fetch time entry
  const entry = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, timeEntryId),
  });

  if (!entry) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Time entry not found',
    });
  }

  if (entry.endTime !== null) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Cannot stop timer: timer is not running',
    });
  }

  // Calculate duration
  const now = new Date();
  const durationMs = now.getTime() - entry.startTime.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  // Update entry
  const [updated] = await db
    .update(timeEntries)
    .set({
      endTime: now,
      durationMinutes,
      updatedAt: new Date(),
    })
    .where(eq(timeEntries.id, timeEntryId))
    .returning();

  return updated;
}

/**
 * Get currently running timer for session or project
 *
 * Returns active time entry (endTime IS NULL) with task_type joined.
 */
export async function getActiveTimer(
  db: TenantDb,
  sessionId?: number,
  projectId?: number
): Promise<(TimeEntry & { taskType: any }) | null> {
  if ((!sessionId && !projectId) || (sessionId && projectId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Exactly one of sessionId or projectId must be provided',
    });
  }

  const whereCondition = sessionId
    ? and(eq(timeEntries.sessionId, sessionId), isNull(timeEntries.endTime))
    : and(eq(timeEntries.projectId, projectId!), isNull(timeEntries.endTime));

  const activeTimer = await db.query.timeEntries.findFirst({
    where: whereCondition,
    with: {
      taskType: true,
    },
  });

  return activeTimer ?? null;
}

/**
 * Manual time adjustment
 *
 * Allows editing start/end times and notes.
 * Recalculates durationMinutes if times changed.
 * Sets manuallyAdjusted flag to true.
 */
export async function adjustTimeEntry(
  db: TenantDb,
  timeEntryId: number,
  data: AdjustTimeEntryInput
): Promise<TimeEntry> {
  const { startTime, endTime, notes } = data;

  // Fetch existing entry
  const entry = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, timeEntryId),
  });

  if (!entry) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Time entry not found',
    });
  }

  // Prepare update data
  const updateData: any = {
    manuallyAdjusted: true,
    updatedAt: new Date(),
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  // Use provided times or keep existing
  const finalStartTime = startTime ?? entry.startTime;
  const finalEndTime = endTime !== undefined ? endTime : entry.endTime;

  if (startTime) {
    updateData.startTime = startTime;
  }

  if (endTime !== undefined) {
    updateData.endTime = endTime;
  }

  // Recalculate duration if both times are set
  if (finalEndTime && finalStartTime) {
    const durationMs = finalEndTime.getTime() - finalStartTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);
    updateData.durationMinutes = durationMinutes;
  }

  // Update entry
  const [updated] = await db
    .update(timeEntries)
    .set(updateData)
    .where(eq(timeEntries.id, timeEntryId))
    .returning();

  return updated;
}

/**
 * Calculate cost from time entry
 *
 * Formula: (durationMinutes / 60) * hourlyRateSnapshot
 */
export function calculateCost(timeEntry: TimeEntry): CalculatedCost {
  if (!timeEntry.durationMinutes || !timeEntry.hourlyRateSnapshot) {
    return {
      hours: 0,
      minutes: 0,
      cost: 0,
      formattedCost: '$0.00',
    };
  }

  const hours = Math.floor(timeEntry.durationMinutes / 60);
  const minutes = timeEntry.durationMinutes % 60;
  const rateNumber = parseFloat(timeEntry.hourlyRateSnapshot.toString());
  const cost = (timeEntry.durationMinutes / 60) * rateNumber;

  return {
    hours,
    minutes,
    cost,
    formattedCost: `$${cost.toFixed(2)}`,
  };
}

/**
 * Get time history with filters
 *
 * Supports filters:
 * - dateRange: { start, end }
 * - taskTypeIds: number[]
 * - includeManuallyAdjusted: boolean (default: true)
 *
 * Returns entries with task_type joined, ordered by startTime DESC,
 * plus aggregated stats (totalHours, totalCost).
 */
export async function getTimeHistory(
  db: TenantDb,
  sessionId?: number,
  projectId?: number,
  filters?: TimeHistoryFilters
): Promise<TimeHistoryResult> {
  if ((!sessionId && !projectId) || (sessionId && projectId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Exactly one of sessionId or projectId must be provided',
    });
  }

  // Build WHERE conditions
  const conditions: SQL[] = [];

  if (sessionId) {
    conditions.push(eq(timeEntries.sessionId, sessionId));
  } else {
    conditions.push(eq(timeEntries.projectId, projectId!));
  }

  // Date range filter
  if (filters?.dateRange) {
    conditions.push(
      between(timeEntries.startTime, filters.dateRange.start, filters.dateRange.end)
    );
  }

  // Task type filter
  if (filters?.taskTypeIds && filters.taskTypeIds.length > 0) {
    conditions.push(inArray(timeEntries.taskTypeId, filters.taskTypeIds));
  }

  // Manually adjusted filter (exclude if explicitly false)
  if (filters?.includeManuallyAdjusted === false) {
    conditions.push(eq(timeEntries.manuallyAdjusted, false));
  }

  // Query entries
  const entries = await db.query.timeEntries.findMany({
    where: and(...conditions),
    with: {
      taskType: true,
    },
    orderBy: [desc(timeEntries.startTime)],
  });

  // Calculate aggregated stats
  let totalMinutes = 0;
  let totalCost = 0;

  for (const entry of entries) {
    if (entry.durationMinutes) {
      totalMinutes += entry.durationMinutes;
      const cost = calculateCost(entry);
      totalCost += cost.cost;
    }
  }

  const totalHours = totalMinutes / 60;

  return {
    entries,
    stats: {
      totalHours: parseFloat(totalHours.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
    },
  };
}
