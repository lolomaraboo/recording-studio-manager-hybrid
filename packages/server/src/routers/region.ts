/**
 * Region Router
 *
 * Endpoints for multi-region management:
 * - Get current region info
 * - Get all regions status
 * - Perform health checks
 * - Get replication status
 * - Get optimal region for client
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  CURRENT_REGION,
  REGIONS,
  getCurrentRegion,
  getActiveRegions,
  getPrimaryRegion,
  getRegionForCountry,
  detectClientLocation,
  selectRegionForClient,
  getRegionHealth,
  getAllRegionHealth,
  isRegionHealthy,
  performHealthCheck,
  getReplicationStatus,
  getS3BucketForRegion,
  getCDNUrl,
  type GeoLocation,
} from "../_core/region";

// ============================================================================
// Input Schemas
// ============================================================================

const regionCodeSchema = z.enum(["us-east-1", "eu-west-1", "ap-southeast-1"]);

const getOptimalRegionInput = z.object({
  countryCode: z.string().length(2).optional(),
  userPreference: regionCodeSchema.optional(),
  organizationRegion: regionCodeSchema.optional(),
});

const getCDNUrlInput = z.object({
  region: regionCodeSchema.optional(),
  path: z.string(),
});

// ============================================================================
// Router
// ============================================================================

export const regionRouter = router({
  /**
   * Get current region this server is running in
   * Public endpoint for client awareness
   */
  getCurrent: publicProcedure.query(() => {
    const region = getCurrentRegion();
    return {
      code: region.code,
      name: region.name,
      location: region.location,
      isPrimary: region.isPrimary,
      status: region.status,
    };
  }),

  /**
   * Get all available regions
   * Public endpoint for region selection UI
   */
  getAll: publicProcedure.query(() => {
    return Object.values(REGIONS).map((region) => ({
      code: region.code,
      name: region.name,
      location: region.location,
      isPrimary: region.isPrimary,
      status: region.status,
      isHealthy: isRegionHealthy(region.code),
    }));
  }),

  /**
   * Get active (non-maintenance) regions
   */
  getActive: publicProcedure.query(() => {
    return getActiveRegions().map((region) => ({
      code: region.code,
      name: region.name,
      location: region.location,
      isPrimary: region.isPrimary,
    }));
  }),

  /**
   * Get primary region info
   */
  getPrimary: publicProcedure.query(() => {
    const primary = getPrimaryRegion();
    return {
      code: primary.code,
      name: primary.name,
      location: primary.location,
      endpoint: primary.endpoint,
    };
  }),

  /**
   * Get optimal region for client based on location
   * Uses geo headers or provided country code
   */
  getOptimal: publicProcedure
    .input(getOptimalRegionInput)
    .query(({ input, ctx }) => {
      // Try to detect location from headers if not provided
      let clientLocation: GeoLocation | null = null;

      if (input.countryCode) {
        clientLocation = { countryCode: input.countryCode };
      } else if (ctx.req?.headers) {
        // Convert Express headers to Record<string, string | undefined>
        const headerRecord: Record<string, string | undefined> = {};
        const headers = ctx.req.headers;
        for (const [key, value] of Object.entries(headers)) {
          headerRecord[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
        }
        clientLocation = detectClientLocation(headerRecord);
      }

      const routing = selectRegionForClient(
        clientLocation,
        input.userPreference,
        input.organizationRegion
      );

      return {
        selectedRegion: routing.selectedRegion,
        reason: routing.reason,
        alternativeRegions: routing.alternativeRegions,
        detectedCountry: clientLocation?.countryCode ?? null,
        detectedCity: clientLocation?.city ?? null,
      };
    }),

  /**
   * Get region for a specific country
   */
  getForCountry: publicProcedure
    .input(z.object({ countryCode: z.string().length(2) }))
    .query(({ input }) => {
      const regionCode = getRegionForCountry(input.countryCode);
      const region = REGIONS[regionCode];
      return {
        code: region.code,
        name: region.name,
        location: region.location,
      };
    }),

  /**
   * Perform health check on current region
   * Admin endpoint for monitoring
   */
  healthCheck: adminProcedure.mutation(async () => {
    const health = await performHealthCheck();
    return {
      region: health.region,
      status: health.status,
      lastCheck: health.lastCheck.toISOString(),
      apiLatencyMs: health.apiLatencyMs,
      dbLatencyMs: health.dbLatencyMs,
      errorRate: health.errorRate,
      details: health.details,
    };
  }),

  /**
   * Get health status for all regions
   * Admin endpoint for dashboard
   */
  getAllHealth: adminProcedure.query(() => {
    const healthData = getAllRegionHealth();

    // Include regions without health data
    const allRegions = Object.values(REGIONS).map((region) => {
      const health = healthData.find((h) => h.region === region.code);
      return {
        region: region.code,
        regionName: region.name,
        status: health?.status ?? "unknown",
        lastCheck: health?.lastCheck?.toISOString() ?? null,
        apiLatencyMs: health?.apiLatencyMs ?? null,
        dbLatencyMs: health?.dbLatencyMs ?? null,
        replicationLagMs: health?.replicationLagMs ?? null,
        errorRate: health?.errorRate ?? null,
        isHealthy: isRegionHealthy(region.code),
      };
    });

    return allRegions;
  }),

  /**
   * Get health for specific region
   */
  getHealth: protectedProcedure
    .input(z.object({ region: regionCodeSchema }))
    .query(({ input }) => {
      const health = getRegionHealth(input.region);

      if (!health) {
        return {
          region: input.region,
          status: "unknown" as const,
          isHealthy: true, // Assume healthy if no data
        };
      }

      return {
        region: health.region,
        status: health.status,
        lastCheck: health.lastCheck.toISOString(),
        apiLatencyMs: health.apiLatencyMs,
        dbLatencyMs: health.dbLatencyMs,
        replicationLagMs: health.replicationLagMs,
        errorRate: health.errorRate,
        isHealthy: isRegionHealthy(input.region),
      };
    }),

  /**
   * Get database replication status across regions
   * Admin endpoint for monitoring
   */
  getReplicationStatus: adminProcedure.query(async () => {
    const status = await getReplicationStatus();

    return {
      primaryRegion: status.primaryRegion,
      primaryRegionName: REGIONS[status.primaryRegion].name,
      replicas: status.replicas.map((replica) => ({
        region: replica.region,
        regionName: REGIONS[replica.region].name,
        lagMs: replica.lagMs,
        status: replica.status,
        lastSync: replica.lastSync.toISOString(),
      })),
    };
  }),

  /**
   * Get S3 bucket for file storage
   * Protected endpoint for file operations
   */
  getS3Bucket: protectedProcedure
    .input(z.object({ region: regionCodeSchema.optional() }))
    .query(({ input }) => {
      const region = input.region ?? CURRENT_REGION;
      return {
        bucket: getS3BucketForRegion(region),
        region,
      };
    }),

  /**
   * Get CDN URL for a file path
   * Public endpoint for asset loading
   */
  getCDNUrl: publicProcedure.input(getCDNUrlInput).query(({ input }) => {
    const region = input.region ?? CURRENT_REGION;
    return {
      url: getCDNUrl(region, input.path),
      region,
    };
  }),

  /**
   * Get latency to all regions (ping test)
   * Returns estimated latency based on last health checks
   */
  getLatencies: protectedProcedure.query(() => {
    const healthData = getAllRegionHealth();

    return Object.values(REGIONS).map((region) => {
      const health = healthData.find((h) => h.region === region.code);
      return {
        region: region.code,
        name: region.name,
        latencyMs: health?.apiLatencyMs ?? null,
        status: region.status,
      };
    });
  }),

  /**
   * Get region configuration summary
   * Admin endpoint for configuration view
   */
  getConfig: adminProcedure.query(() => {
    return {
      currentRegion: CURRENT_REGION,
      primaryRegion: getPrimaryRegion().code,
      regions: Object.values(REGIONS).map((region) => ({
        code: region.code,
        name: region.name,
        location: region.location,
        isPrimary: region.isPrimary,
        endpoint: region.endpoint,
        s3Bucket: region.s3Bucket,
        cdnDomain: region.cdnDomain ?? null,
        status: region.status,
      })),
    };
  }),

  /**
   * Update region status (for maintenance mode)
   * Admin endpoint
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        region: regionCodeSchema,
        status: z.enum(["active", "degraded", "maintenance", "offline"]),
      })
    )
    .mutation(({ input }) => {
      // In production, this would update a distributed config (Redis/Consul)
      // For now, update in-memory (only affects this instance)
      const region = REGIONS[input.region];
      if (region) {
        region.status = input.status;
      }

      return {
        success: true,
        region: input.region,
        newStatus: input.status,
        note: "Status updated for this instance only. In production, use distributed config.",
      };
    }),
});

export type RegionRouter = typeof regionRouter;
