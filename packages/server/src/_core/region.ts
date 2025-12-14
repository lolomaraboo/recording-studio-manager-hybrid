/**
 * Multi-Region Module
 *
 * Supports deployment across multiple geographic regions:
 * - us-east-1 (Primary - Virginia)
 * - eu-west-1 (Europe - Ireland)
 * - ap-southeast-1 (Asia Pacific - Singapore)
 *
 * Features:
 * - Region detection from request
 * - Geo-routing based on client location
 * - Cross-region replication status
 * - Failover configuration
 * - Latency-based routing
 */

// ============================================================================
// Types
// ============================================================================

export type RegionCode = "us-east-1" | "eu-west-1" | "ap-southeast-1";

export interface Region {
  code: RegionCode;
  name: string;
  location: string;
  isPrimary: boolean;
  endpoint: string;
  dbHost: string;
  s3Bucket: string;
  cdnDomain?: string;
  status: "active" | "degraded" | "maintenance" | "offline";
  latencyMs?: number;
}

export interface RegionHealth {
  region: RegionCode;
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck: Date;
  apiLatencyMs: number;
  dbLatencyMs: number;
  replicationLagMs?: number;
  errorRate: number;
  details?: Record<string, unknown>;
}

export interface GeoLocation {
  countryCode: string;
  regionCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface RoutingDecision {
  selectedRegion: RegionCode;
  reason: "geo" | "latency" | "affinity" | "failover" | "explicit";
  alternativeRegions: RegionCode[];
  clientLocation?: GeoLocation;
}

// ============================================================================
// Region Configuration
// ============================================================================

export const REGIONS: Record<RegionCode, Region> = {
  "us-east-1": {
    code: "us-east-1",
    name: "US East (N. Virginia)",
    location: "Virginia, USA",
    isPrimary: true,
    endpoint: process.env.US_EAST_ENDPOINT ?? "https://api-us.example.com",
    dbHost: process.env.US_EAST_DB_HOST ?? "db-us-east-1.example.com",
    s3Bucket: process.env.US_EAST_S3_BUCKET ?? "rsm-files-us-east-1",
    cdnDomain: process.env.US_EAST_CDN ?? "cdn-us.example.com",
    status: "active",
  },
  "eu-west-1": {
    code: "eu-west-1",
    name: "EU West (Ireland)",
    location: "Dublin, Ireland",
    isPrimary: false,
    endpoint: process.env.EU_WEST_ENDPOINT ?? "https://api-eu.example.com",
    dbHost: process.env.EU_WEST_DB_HOST ?? "db-eu-west-1.example.com",
    s3Bucket: process.env.EU_WEST_S3_BUCKET ?? "rsm-files-eu-west-1",
    cdnDomain: process.env.EU_WEST_CDN ?? "cdn-eu.example.com",
    status: "active",
  },
  "ap-southeast-1": {
    code: "ap-southeast-1",
    name: "Asia Pacific (Singapore)",
    location: "Singapore",
    isPrimary: false,
    endpoint: process.env.AP_SOUTHEAST_ENDPOINT ?? "https://api-ap.example.com",
    dbHost: process.env.AP_SOUTHEAST_DB_HOST ?? "db-ap-southeast-1.example.com",
    s3Bucket: process.env.AP_SOUTHEAST_S3_BUCKET ?? "rsm-files-ap-southeast-1",
    cdnDomain: process.env.AP_SOUTHEAST_CDN ?? "cdn-ap.example.com",
    status: "active",
  },
};

/**
 * Current region this instance is running in
 */
export const CURRENT_REGION: RegionCode =
  (process.env.AWS_REGION as RegionCode) ?? "us-east-1";

/**
 * Get current region configuration
 */
export function getCurrentRegion(): Region {
  return REGIONS[CURRENT_REGION];
}

/**
 * Get all active regions
 */
export function getActiveRegions(): Region[] {
  return Object.values(REGIONS).filter((r) => r.status === "active");
}

/**
 * Get primary region
 */
export function getPrimaryRegion(): Region {
  return Object.values(REGIONS).find((r) => r.isPrimary) ?? REGIONS["us-east-1"];
}

// ============================================================================
// Country to Region Mapping
// ============================================================================

/**
 * Map of country codes to preferred regions
 * Based on geographic proximity and data residency requirements
 */
const COUNTRY_REGION_MAP: Record<string, RegionCode> = {
  // North America
  US: "us-east-1",
  CA: "us-east-1",
  MX: "us-east-1",
  // Europe
  GB: "eu-west-1",
  DE: "eu-west-1",
  FR: "eu-west-1",
  ES: "eu-west-1",
  IT: "eu-west-1",
  NL: "eu-west-1",
  BE: "eu-west-1",
  AT: "eu-west-1",
  CH: "eu-west-1",
  SE: "eu-west-1",
  NO: "eu-west-1",
  DK: "eu-west-1",
  FI: "eu-west-1",
  PL: "eu-west-1",
  CZ: "eu-west-1",
  PT: "eu-west-1",
  IE: "eu-west-1",
  // Asia Pacific
  SG: "ap-southeast-1",
  JP: "ap-southeast-1",
  KR: "ap-southeast-1",
  AU: "ap-southeast-1",
  NZ: "ap-southeast-1",
  IN: "ap-southeast-1",
  TH: "ap-southeast-1",
  MY: "ap-southeast-1",
  ID: "ap-southeast-1",
  PH: "ap-southeast-1",
  VN: "ap-southeast-1",
  HK: "ap-southeast-1",
  TW: "ap-southeast-1",
  CN: "ap-southeast-1",
};

/**
 * Get preferred region for a country
 */
export function getRegionForCountry(countryCode: string): RegionCode {
  return COUNTRY_REGION_MAP[countryCode.toUpperCase()] ?? "us-east-1";
}

// ============================================================================
// Geo Detection
// ============================================================================

/**
 * Detect client location from request headers
 * Works with CloudFront, Cloudflare, or custom geo headers
 */
export function detectClientLocation(headers: Record<string, string | undefined>): GeoLocation | null {
  // CloudFront headers
  const cfCountry = headers["cloudfront-viewer-country"];
  const cfRegion = headers["cloudfront-viewer-country-region"];
  const cfCity = headers["cloudfront-viewer-city"];
  const cfLat = headers["cloudfront-viewer-latitude"];
  const cfLon = headers["cloudfront-viewer-longitude"];
  const cfTimezone = headers["cloudfront-viewer-time-zone"];

  // Cloudflare headers (alternative)
  const flareCountry = headers["cf-ipcountry"];

  // Custom X-Geo headers (from reverse proxy)
  const xGeoCountry = headers["x-geo-country"];
  const xGeoCity = headers["x-geo-city"];

  const countryCode = cfCountry ?? flareCountry ?? xGeoCountry;

  if (!countryCode) {
    return null;
  }

  return {
    countryCode: countryCode.toUpperCase(),
    regionCode: cfRegion,
    city: cfCity ?? xGeoCity,
    latitude: cfLat ? parseFloat(cfLat) : undefined,
    longitude: cfLon ? parseFloat(cfLon) : undefined,
    timezone: cfTimezone,
  };
}

/**
 * Determine optimal region for a client
 */
export function selectRegionForClient(
  clientLocation: GeoLocation | null,
  userPreference?: RegionCode,
  organizationRegion?: RegionCode
): RoutingDecision {
  const activeRegions = getActiveRegions();
  const activeRegionCodes = activeRegions.map((r) => r.code);

  // 1. Check explicit user preference
  if (userPreference && activeRegionCodes.includes(userPreference)) {
    return {
      selectedRegion: userPreference,
      reason: "explicit",
      alternativeRegions: activeRegionCodes.filter((r) => r !== userPreference),
      clientLocation: clientLocation ?? undefined,
    };
  }

  // 2. Check organization affinity (data residency)
  if (organizationRegion && activeRegionCodes.includes(organizationRegion)) {
    return {
      selectedRegion: organizationRegion,
      reason: "affinity",
      alternativeRegions: activeRegionCodes.filter((r) => r !== organizationRegion),
      clientLocation: clientLocation ?? undefined,
    };
  }

  // 3. Use geo-based routing
  if (clientLocation) {
    const geoRegion = getRegionForCountry(clientLocation.countryCode);
    if (activeRegionCodes.includes(geoRegion)) {
      return {
        selectedRegion: geoRegion,
        reason: "geo",
        alternativeRegions: activeRegionCodes.filter((r) => r !== geoRegion),
        clientLocation,
      };
    }
  }

  // 4. Fallback to primary region
  const primary = getPrimaryRegion();
  return {
    selectedRegion: primary.code,
    reason: "failover",
    alternativeRegions: activeRegionCodes.filter((r) => r !== primary.code),
    clientLocation: clientLocation ?? undefined,
  };
}

// ============================================================================
// Health Monitoring
// ============================================================================

// In-memory health cache (use Redis in production)
const healthCache = new Map<RegionCode, RegionHealth>();

/**
 * Update health status for a region
 */
export function updateRegionHealth(health: RegionHealth): void {
  healthCache.set(health.region, health);
}

/**
 * Get health status for a region
 */
export function getRegionHealth(region: RegionCode): RegionHealth | null {
  return healthCache.get(region) ?? null;
}

/**
 * Get health status for all regions
 */
export function getAllRegionHealth(): RegionHealth[] {
  return Array.from(healthCache.values());
}

/**
 * Check if a region is healthy
 */
export function isRegionHealthy(region: RegionCode): boolean {
  const health = healthCache.get(region);
  if (!health) return true; // Assume healthy if no data

  // Consider unhealthy if:
  // - Status is unhealthy
  // - Last check is more than 5 minutes ago
  // - Error rate > 10%
  // - API latency > 5000ms

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  if (health.status === "unhealthy") return false;
  if (health.lastCheck < fiveMinutesAgo) return false;
  if (health.errorRate > 0.1) return false;
  if (health.apiLatencyMs > 5000) return false;

  return true;
}

/**
 * Perform health check on current region
 */
export async function performHealthCheck(): Promise<RegionHealth> {
  const region = CURRENT_REGION;
  const startTime = Date.now();

  let dbLatencyMs = 0;
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  let errorRate = 0;

  try {
    // Test database connection
    const dbStart = Date.now();
    const { getMasterDb } = await import("@rsm/database/connection");
    const db = await getMasterDb();
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;

    // Check if DB is slow
    if (dbLatencyMs > 1000) {
      status = "degraded";
    }
  } catch (error) {
    status = "unhealthy";
    errorRate = 1;
    console.error(`Health check failed for region ${region}:`, error);
  }

  const apiLatencyMs = Date.now() - startTime;

  const health: RegionHealth = {
    region,
    status,
    lastCheck: new Date(),
    apiLatencyMs,
    dbLatencyMs,
    errorRate,
    details: {
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };

  updateRegionHealth(health);
  return health;
}

// ============================================================================
// Replication Status
// ============================================================================

export interface ReplicationStatus {
  primaryRegion: RegionCode;
  replicas: {
    region: RegionCode;
    lagMs: number;
    status: "synced" | "lagging" | "disconnected";
    lastSync: Date;
  }[];
}

/**
 * Get replication status across regions
 * In production, this would query PostgreSQL replication status
 */
export async function getReplicationStatus(): Promise<ReplicationStatus> {
  const primary = getPrimaryRegion();

  // Simulated replication status
  // In production, query pg_stat_replication
  return {
    primaryRegion: primary.code,
    replicas: Object.values(REGIONS)
      .filter((r) => !r.isPrimary)
      .map((r) => ({
        region: r.code,
        lagMs: Math.random() * 100, // Simulated
        status: "synced" as const,
        lastSync: new Date(),
      })),
  };
}

// ============================================================================
// Cross-Region API Calls
// ============================================================================

/**
 * Make an API call to a specific region
 */
export async function callRegionAPI<T>(
  region: RegionCode,
  path: string,
  options?: RequestInit
): Promise<T> {
  const regionConfig = REGIONS[region];

  if (!regionConfig || regionConfig.status !== "active") {
    throw new Error(`Region ${region} is not available`);
  }

  const url = `${regionConfig.endpoint}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Source-Region": CURRENT_REGION,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Region API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Broadcast an update to all regions
 * Used for cache invalidation, configuration updates, etc.
 */
export async function broadcastToRegions(
  path: string,
  data: unknown
): Promise<Map<RegionCode, boolean>> {
  const results = new Map<RegionCode, boolean>();

  const promises = Object.values(REGIONS)
    .filter((r) => r.code !== CURRENT_REGION && r.status === "active")
    .map(async (region) => {
      try {
        await callRegionAPI(region.code, path, {
          method: "POST",
          body: JSON.stringify(data),
        });
        results.set(region.code, true);
      } catch (error) {
        console.error(`Failed to broadcast to region ${region.code}:`, error);
        results.set(region.code, false);
      }
    });

  await Promise.all(promises);
  return results;
}

// ============================================================================
// S3 Region Configuration
// ============================================================================

/**
 * Get S3 bucket for a specific region
 */
export function getS3BucketForRegion(region: RegionCode): string {
  return REGIONS[region]?.s3Bucket ?? REGIONS["us-east-1"].s3Bucket;
}

/**
 * Get CDN URL for a file
 */
export function getCDNUrl(region: RegionCode, path: string): string {
  const regionConfig = REGIONS[region];
  const cdnDomain = regionConfig?.cdnDomain ?? "cdn.example.com";
  return `https://${cdnDomain}/${path}`;
}

// ============================================================================
// Region Middleware Helper
// ============================================================================

/**
 * Create region context from request
 */
export function createRegionContext(headers: Record<string, string | undefined>): {
  currentRegion: RegionCode;
  clientLocation: GeoLocation | null;
  routing: RoutingDecision;
} {
  const clientLocation = detectClientLocation(headers);
  const routing = selectRegionForClient(clientLocation);

  return {
    currentRegion: CURRENT_REGION,
    clientLocation,
    routing,
  };
}
