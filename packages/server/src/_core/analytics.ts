/**
 * Analytics Module
 *
 * Comprehensive analytics and reporting system for studio management.
 *
 * Features:
 * - Revenue analytics (daily, weekly, monthly, yearly)
 * - Session analytics (utilization, occupancy, duration)
 * - Client analytics (acquisition, retention, lifetime value)
 * - Room performance metrics
 * - Engineer productivity
 * - Trend analysis and forecasting
 * - Custom report generation
 * - Export to CSV/PDF
 *
 * KPIs tracked:
 * - Total Revenue, Average Session Value
 * - Room Utilization Rate, Peak Hours
 * - Client Retention Rate, New vs Returning
 * - Project Completion Rate
 * - Invoice Collection Rate
 */

// =============================================================================
// Types
// =============================================================================

export type TimeGranularity = "hour" | "day" | "week" | "month" | "quarter" | "year";

export type MetricType =
  | "revenue"
  | "sessions"
  | "clients"
  | "rooms"
  | "projects"
  | "invoices"
  | "bookings";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  averageSessionValue: number;
  averageProjectValue: number;
  averageMonthlyRevenue: number;
  revenueByCategory: Record<string, number>;
  revenueByRoom: Record<string, number>;
  revenueByClient: Array<{ clientId: number; clientName: string; revenue: number }>;
  revenueGrowth: number; // percentage vs previous period
  projectedRevenue: number;
  outstandingInvoices: number;
  collectionRate: number;
}

export interface SessionMetrics {
  totalSessions: number;
  totalHours: number;
  averageDuration: number; // in minutes
  utilizationRate: number; // percentage
  peakHours: Array<{ hour: number; count: number }>;
  sessionsByDay: Array<{ day: string; count: number }>;
  sessionsByRoom: Record<string, number>;
  cancellationRate: number;
  noShowRate: number;
  repeatBookingRate: number;
}

export interface ClientMetrics {
  totalClients: number;
  activeClients: number; // had session in last 90 days
  newClients: number;
  returningClients: number;
  retentionRate: number; // percentage
  churnRate: number;
  averageLifetimeValue: number;
  topClients: Array<{
    clientId: number;
    clientName: string;
    totalSpent: number;
    sessionCount: number;
  }>;
  clientsBySource: Record<string, number>;
  averageSessionsPerClient: number;
}

export interface RoomMetrics {
  rooms: Array<{
    roomId: number;
    roomName: string;
    utilizationRate: number;
    revenue: number;
    sessionCount: number;
    averageSessionDuration: number;
    peakHours: number[];
    maintenanceHours: number;
  }>;
  mostProfitableRoom: { roomId: number; roomName: string; revenue: number };
  mostUtilizedRoom: { roomId: number; roomName: string; utilizationRate: number };
  averageUtilization: number;
}

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageProjectDuration: number; // in days
  averageTracksPerProject: number;
  projectsByStatus: Record<string, number>;
  onTimeCompletionRate: number;
  totalTracks: number;
  averageTrackDuration: number;
}

export interface InvoiceMetrics {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  averageInvoiceValue: number;
  paymentRate: number;
  averageDaysToPayment: number;
  overdueAmount: number;
  overdueCount: number;
  invoicesByStatus: Record<string, number>;
}

export interface DashboardData {
  revenue: RevenueMetrics;
  sessions: SessionMetrics;
  clients: ClientMetrics;
  rooms: RoomMetrics;
  projects: ProjectMetrics;
  invoices: InvoiceMetrics;
  trends: {
    revenue: TimeSeriesDataPoint[];
    sessions: TimeSeriesDataPoint[];
    clients: TimeSeriesDataPoint[];
  };
}

export interface ReportConfig {
  title: string;
  description?: string;
  metrics: MetricType[];
  dateRange: DateRange;
  granularity: TimeGranularity;
  groupBy?: string[];
  filters?: Record<string, unknown>;
  format: "json" | "csv" | "pdf";
}

export interface GeneratedReport {
  id: string;
  title: string;
  generatedAt: Date;
  dateRange: DateRange;
  data: Record<string, unknown>;
  format: "json" | "csv" | "pdf";
  fileUrl?: string;
}

// =============================================================================
// Mock Data (In production, this would query actual database)
// =============================================================================

const MOCK_ROOMS = [
  { id: 1, name: "Studio A", hourlyRate: 150 },
  { id: 2, name: "Studio B", hourlyRate: 100 },
  { id: 3, name: "Mix Room", hourlyRate: 75 },
  { id: 4, name: "Mastering Suite", hourlyRate: 200 },
];

const MOCK_CLIENTS = [
  { id: 1, name: "Acme Records" },
  { id: 2, name: "Indie Artist Co" },
  { id: 3, name: "Major Label Inc" },
  { id: 4, name: "Podcast Productions" },
  { id: 5, name: "Film Score Studios" },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get date range for a given period
 */
export function getDateRangeForPeriod(
  period: "today" | "week" | "month" | "quarter" | "year" | "custom",
  customRange?: DateRange
): DateRange {
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(now);

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate.setMonth(quarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (customRange) {
        return customRange;
      }
      break;
  }

  return { startDate, endDate };
}

/**
 * Generate time series data points
 */
function generateTimeSeries(
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity,
  baseValue: number,
  variance: number
): TimeSeriesDataPoint[] {
  const points: TimeSeriesDataPoint[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const randomVariance = (Math.random() - 0.5) * 2 * variance;
    const dayOfWeek = current.getDay();
    // Weekends have lower values
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;

    points.push({
      timestamp: new Date(current),
      value: Math.round((baseValue + randomVariance) * weekendMultiplier),
    });

    // Increment based on granularity
    switch (granularity) {
      case "hour":
        current.setHours(current.getHours() + 1);
        break;
      case "day":
        current.setDate(current.getDate() + 1);
        break;
      case "week":
        current.setDate(current.getDate() + 7);
        break;
      case "month":
        current.setMonth(current.getMonth() + 1);
        break;
      case "quarter":
        current.setMonth(current.getMonth() + 3);
        break;
      case "year":
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return points;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Calculate growth rate
 */
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

// =============================================================================
// Analytics Functions
// =============================================================================

/**
 * Get revenue analytics
 */
export async function getRevenueMetrics(
  _organizationId: number,
  dateRange: DateRange
): Promise<RevenueMetrics> {
  // In production, this would query the database
  const daysDiff = Math.ceil(
    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalRevenue = 15000 + Math.random() * 10000 * (daysDiff / 30);
  const previousRevenue = totalRevenue * (0.8 + Math.random() * 0.3);

  const revenueByRoom: Record<string, number> = {};
  MOCK_ROOMS.forEach((room) => {
    revenueByRoom[room.name] = Math.round(
      (totalRevenue / MOCK_ROOMS.length) * (0.7 + Math.random() * 0.6)
    );
  });

  const revenueByClient = MOCK_CLIENTS.map((client) => ({
    clientId: client.id,
    clientName: client.name,
    revenue: Math.round((totalRevenue / MOCK_CLIENTS.length) * (0.5 + Math.random())),
  })).sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue: Math.round(totalRevenue),
    averageSessionValue: Math.round(totalRevenue / (20 + Math.random() * 30)),
    averageProjectValue: Math.round(totalRevenue / (5 + Math.random() * 10)),
    averageMonthlyRevenue: Math.round(totalRevenue / Math.max(1, daysDiff / 30)),
    revenueByCategory: {
      "Recording Sessions": Math.round(totalRevenue * 0.45),
      Mixing: Math.round(totalRevenue * 0.25),
      Mastering: Math.round(totalRevenue * 0.15),
      Production: Math.round(totalRevenue * 0.1),
      Other: Math.round(totalRevenue * 0.05),
    },
    revenueByRoom,
    revenueByClient,
    revenueGrowth: calculateGrowthRate(totalRevenue, previousRevenue),
    projectedRevenue: Math.round(totalRevenue * 1.1),
    outstandingInvoices: Math.round(totalRevenue * 0.15),
    collectionRate: 0.85 + Math.random() * 0.1,
  };
}

/**
 * Get session analytics
 */
export async function getSessionMetrics(
  _organizationId: number,
  dateRange: DateRange
): Promise<SessionMetrics> {
  const daysDiff = Math.ceil(
    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalSessions = Math.round(50 + Math.random() * 100 * (daysDiff / 30));
  const totalHours = totalSessions * (2 + Math.random() * 4);

  const peakHours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: Math.round(
      totalSessions *
        (hour >= 10 && hour <= 20 ? 0.08 + Math.random() * 0.04 : 0.01 + Math.random() * 0.02)
    ),
  }));

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sessionsByDay = days.map((day, index) => ({
    day,
    count: Math.round(
      totalSessions * (index >= 1 && index <= 5 ? 0.16 + Math.random() * 0.04 : 0.06)
    ),
  }));

  const sessionsByRoom: Record<string, number> = {};
  MOCK_ROOMS.forEach((room) => {
    sessionsByRoom[room.name] = Math.round(
      (totalSessions / MOCK_ROOMS.length) * (0.7 + Math.random() * 0.6)
    );
  });

  return {
    totalSessions,
    totalHours: Math.round(totalHours),
    averageDuration: Math.round((totalHours / totalSessions) * 60),
    utilizationRate: 0.55 + Math.random() * 0.25,
    peakHours,
    sessionsByDay,
    sessionsByRoom,
    cancellationRate: 0.05 + Math.random() * 0.05,
    noShowRate: 0.02 + Math.random() * 0.03,
    repeatBookingRate: 0.6 + Math.random() * 0.2,
  };
}

/**
 * Get client analytics
 */
export async function getClientMetrics(
  _organizationId: number,
  _dateRange: DateRange
): Promise<ClientMetrics> {
  const totalClients = 50 + Math.round(Math.random() * 100);
  const activeClients = Math.round(totalClients * (0.5 + Math.random() * 0.3));
  const newClients = Math.round(activeClients * 0.2);

  const topClients = MOCK_CLIENTS.map((client, index) => ({
    clientId: client.id,
    clientName: client.name,
    totalSpent: Math.round(10000 - index * 1500 + Math.random() * 2000),
    sessionCount: Math.round(20 - index * 3 + Math.random() * 5),
  })).sort((a, b) => b.totalSpent - a.totalSpent);

  return {
    totalClients,
    activeClients,
    newClients,
    returningClients: activeClients - newClients,
    retentionRate: 0.7 + Math.random() * 0.2,
    churnRate: 0.05 + Math.random() * 0.1,
    averageLifetimeValue: 5000 + Math.random() * 5000,
    topClients,
    clientsBySource: {
      Referral: Math.round(totalClients * 0.4),
      Website: Math.round(totalClients * 0.25),
      "Social Media": Math.round(totalClients * 0.2),
      "Walk-in": Math.round(totalClients * 0.1),
      Other: Math.round(totalClients * 0.05),
    },
    averageSessionsPerClient: 3 + Math.random() * 4,
  };
}

/**
 * Get room performance analytics
 */
export async function getRoomMetrics(_organizationId: number): Promise<RoomMetrics> {
  const rooms = MOCK_ROOMS.map((room) => {
    const utilizationRate = 0.4 + Math.random() * 0.4;
    const sessionCount = Math.round(30 + Math.random() * 50);
    const avgDuration = 2 + Math.random() * 3;

    return {
      roomId: room.id,
      roomName: room.name,
      utilizationRate,
      revenue: Math.round(sessionCount * avgDuration * room.hourlyRate),
      sessionCount,
      averageSessionDuration: Math.round(avgDuration * 60),
      peakHours: [10, 11, 14, 15, 16, 17].slice(0, Math.round(3 + Math.random() * 3)),
      maintenanceHours: Math.round(5 + Math.random() * 10),
    };
  });

  const sortedByRevenue = [...rooms].sort((a, b) => b.revenue - a.revenue);
  const sortedByUtilization = [...rooms].sort((a, b) => b.utilizationRate - a.utilizationRate);

  const mostProfitable = sortedByRevenue[0] ?? rooms[0];
  const mostUtilized = sortedByUtilization[0] ?? rooms[0];

  return {
    rooms,
    mostProfitableRoom: mostProfitable ? {
      roomId: mostProfitable.roomId,
      roomName: mostProfitable.roomName,
      revenue: mostProfitable.revenue,
    } : { roomId: 0, roomName: "N/A", revenue: 0 },
    mostUtilizedRoom: mostUtilized ? {
      roomId: mostUtilized.roomId,
      roomName: mostUtilized.roomName,
      utilizationRate: mostUtilized.utilizationRate,
    } : { roomId: 0, roomName: "N/A", utilizationRate: 0 },
    averageUtilization: rooms.length > 0
      ? rooms.reduce((sum, r) => sum + r.utilizationRate, 0) / rooms.length
      : 0,
  };
}

/**
 * Get project analytics
 */
export async function getProjectMetrics(_organizationId: number): Promise<ProjectMetrics> {
  const totalProjects = 20 + Math.round(Math.random() * 30);
  const activeProjects = Math.round(totalProjects * 0.3);
  const completedProjects = Math.round(totalProjects * 0.6);

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    averageProjectDuration: 14 + Math.round(Math.random() * 21),
    averageTracksPerProject: 8 + Math.round(Math.random() * 6),
    projectsByStatus: {
      draft: Math.round(totalProjects * 0.1),
      active: activeProjects,
      "on-hold": Math.round(totalProjects * 0.05),
      completed: completedProjects,
      archived: Math.round(totalProjects * 0.15),
    },
    onTimeCompletionRate: 0.75 + Math.random() * 0.2,
    totalTracks: totalProjects * (8 + Math.round(Math.random() * 4)),
    averageTrackDuration: 180 + Math.round(Math.random() * 120),
  };
}

/**
 * Get invoice analytics
 */
export async function getInvoiceMetrics(
  _organizationId: number,
  dateRange: DateRange
): Promise<InvoiceMetrics> {
  const daysDiff = Math.ceil(
    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalInvoiced = 20000 + Math.random() * 15000 * (daysDiff / 30);
  const paymentRate = 0.8 + Math.random() * 0.15;
  const totalPaid = totalInvoiced * paymentRate;
  const totalOutstanding = totalInvoiced - totalPaid;

  return {
    totalInvoiced: Math.round(totalInvoiced),
    totalPaid: Math.round(totalPaid),
    totalOutstanding: Math.round(totalOutstanding),
    averageInvoiceValue: Math.round(totalInvoiced / (10 + Math.random() * 20)),
    paymentRate,
    averageDaysToPayment: Math.round(15 + Math.random() * 15),
    overdueAmount: Math.round(totalOutstanding * 0.3),
    overdueCount: Math.round(3 + Math.random() * 5),
    invoicesByStatus: {
      draft: Math.round(2 + Math.random() * 3),
      sent: Math.round(5 + Math.random() * 5),
      paid: Math.round(15 + Math.random() * 10),
      overdue: Math.round(3 + Math.random() * 5),
      cancelled: Math.round(1 + Math.random() * 2),
    },
  };
}

/**
 * Get complete dashboard data
 */
export async function getDashboardData(
  organizationId: number,
  dateRange: DateRange
): Promise<DashboardData> {
  // Fetch all metrics in parallel
  const [revenue, sessions, clients, rooms, projects, invoices] = await Promise.all([
    getRevenueMetrics(organizationId, dateRange),
    getSessionMetrics(organizationId, dateRange),
    getClientMetrics(organizationId, dateRange),
    getRoomMetrics(organizationId),
    getProjectMetrics(organizationId),
    getInvoiceMetrics(organizationId, dateRange),
  ]);

  // Generate trend data
  const trends = {
    revenue: generateTimeSeries(
      dateRange.startDate,
      dateRange.endDate,
      "day",
      revenue.totalRevenue / 30,
      200
    ),
    sessions: generateTimeSeries(
      dateRange.startDate,
      dateRange.endDate,
      "day",
      sessions.totalSessions / 30,
      2
    ),
    clients: generateTimeSeries(
      dateRange.startDate,
      dateRange.endDate,
      "day",
      clients.newClients / 30,
      1
    ),
  };

  return {
    revenue,
    sessions,
    clients,
    rooms,
    projects,
    invoices,
    trends,
  };
}

// =============================================================================
// Report Generation
// =============================================================================

/**
 * Generate a custom report
 */
export async function generateReport(
  organizationId: number,
  config: ReportConfig
): Promise<GeneratedReport> {
  const reportId = `rpt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const data: Record<string, unknown> = {};

  // Fetch requested metrics
  for (const metric of config.metrics) {
    switch (metric) {
      case "revenue":
        data.revenue = await getRevenueMetrics(organizationId, config.dateRange);
        break;
      case "sessions":
        data.sessions = await getSessionMetrics(organizationId, config.dateRange);
        break;
      case "clients":
        data.clients = await getClientMetrics(organizationId, config.dateRange);
        break;
      case "rooms":
        data.rooms = await getRoomMetrics(organizationId);
        break;
      case "projects":
        data.projects = await getProjectMetrics(organizationId);
        break;
      case "invoices":
        data.invoices = await getInvoiceMetrics(organizationId, config.dateRange);
        break;
    }
  }

  // In production, we would:
  // 1. Generate PDF if requested (using PDFKit or similar)
  // 2. Generate CSV if requested
  // 3. Upload to S3
  // 4. Return file URL

  const report: GeneratedReport = {
    id: reportId,
    title: config.title,
    generatedAt: new Date(),
    dateRange: config.dateRange,
    data,
    format: config.format,
  };

  if (config.format === "csv") {
    report.fileUrl = `https://storage.example.com/reports/${reportId}.csv`;
  } else if (config.format === "pdf") {
    report.fileUrl = `https://storage.example.com/reports/${reportId}.pdf`;
  }

  console.log(`[Analytics] Report generated: ${reportId}`);

  return report;
}

/**
 * Convert data to CSV format
 */
export function toCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) return `"${value}"`;
        return String(value);
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

// =============================================================================
// Forecasting (Simple Moving Average)
// =============================================================================

/**
 * Forecast future values using simple moving average
 */
export function forecastSimpleMovingAverage(
  historicalData: number[],
  periods: number,
  windowSize = 3
): number[] {
  const forecast: number[] = [];
  const data = [...historicalData];

  for (let i = 0; i < periods; i++) {
    const window = data.slice(-windowSize);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    forecast.push(Math.round(average));
    data.push(average);
  }

  return forecast;
}

/**
 * Calculate year-over-year comparison
 */
export async function getYearOverYearComparison(
  organizationId: number,
  year: number
): Promise<{
  currentYear: { revenue: number; sessions: number; clients: number };
  previousYear: { revenue: number; sessions: number; clients: number };
  growth: { revenue: number; sessions: number; clients: number };
}> {
  const currentYearRange: DateRange = {
    startDate: new Date(year, 0, 1),
    endDate: new Date(year, 11, 31),
  };

  const previousYearRange: DateRange = {
    startDate: new Date(year - 1, 0, 1),
    endDate: new Date(year - 1, 11, 31),
  };

  const [currentRevenue, previousRevenue, currentSessions, previousSessions] = await Promise.all([
    getRevenueMetrics(organizationId, currentYearRange),
    getRevenueMetrics(organizationId, previousYearRange),
    getSessionMetrics(organizationId, currentYearRange),
    getSessionMetrics(organizationId, previousYearRange),
  ]);

  return {
    currentYear: {
      revenue: currentRevenue.totalRevenue,
      sessions: currentSessions.totalSessions,
      clients: 75, // Would come from actual data
    },
    previousYear: {
      revenue: previousRevenue.totalRevenue,
      sessions: previousSessions.totalSessions,
      clients: 60,
    },
    growth: {
      revenue: calculateGrowthRate(currentRevenue.totalRevenue, previousRevenue.totalRevenue),
      sessions: calculateGrowthRate(currentSessions.totalSessions, previousSessions.totalSessions),
      clients: calculateGrowthRate(75, 60),
    },
  };
}

// =============================================================================
// Export utilities
// =============================================================================

export const analytics = {
  getRevenueMetrics,
  getSessionMetrics,
  getClientMetrics,
  getRoomMetrics,
  getProjectMetrics,
  getInvoiceMetrics,
  getDashboardData,
  generateReport,
  getYearOverYearComparison,
  forecastSimpleMovingAverage,
};
