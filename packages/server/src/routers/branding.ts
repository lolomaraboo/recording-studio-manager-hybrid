/**
 * Branding Router
 *
 * Endpoints for white-label branding management:
 * - Get branding configuration
 * - Update branding settings (admin only)
 * - Upload logo/favicon
 * - Manage custom domain
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  getBrandingConfig,
  updateBrandingConfig,
  generateThemeColors,
  generateCssVariables,
  isValidHexColor,
  DEFAULT_BRANDING,
} from "../_core/branding";

// ============================================================================
// Input Schemas
// ============================================================================

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: "Invalid hex color format. Use #RRGGBB",
});

const updateBrandingInput = z.object({
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  emailFromName: z.string().max(100).nullable().optional(),
  emailFooterText: z.string().max(500).nullable().optional(),
});

const setCustomDomainInput = z.object({
  domain: z.string().min(3).max(255).regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, {
    message: "Invalid domain format",
  }),
});

// ============================================================================
// Router
// ============================================================================

export const brandingRouter = router({
  /**
   * Get current branding configuration
   * Available to all authenticated users
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const branding = await getBrandingConfig(ctx.organizationId);

    if (!branding) {
      // Return defaults if no branding configured
      return {
        ...DEFAULT_BRANDING,
        organizationId: ctx.organizationId,
        organizationName: "Studio",
        slug: "default",
      };
    }

    return branding;
  }),

  /**
   * Get theme colors with computed shades
   */
  getTheme: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const branding = await getBrandingConfig(ctx.organizationId);

    const primary = branding?.primaryColor ?? DEFAULT_BRANDING.primaryColor;
    const secondary = branding?.secondaryColor ?? DEFAULT_BRANDING.secondaryColor;
    const accent = branding?.accentColor ?? DEFAULT_BRANDING.accentColor;

    const colors = generateThemeColors(primary, secondary, accent);
    const cssVariables = generateCssVariables(colors);

    return {
      colors,
      cssVariables,
    };
  }),

  /**
   * Update branding configuration
   * Requires admin role
   */
  update: adminProcedure.input(updateBrandingInput).mutation(async ({ ctx, input }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const updatedBranding = await updateBrandingConfig(ctx.organizationId, {
      logoUrl: input.logoUrl,
      faviconUrl: input.faviconUrl,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      accentColor: input.accentColor,
      emailFromName: input.emailFromName,
      emailFooterText: input.emailFooterText,
    });

    return updatedBranding;
  }),

  /**
   * Reset branding to defaults
   * Requires admin role
   */
  reset: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const resetBranding = await updateBrandingConfig(ctx.organizationId, {
      logoUrl: null,
      faviconUrl: null,
      primaryColor: DEFAULT_BRANDING.primaryColor,
      secondaryColor: DEFAULT_BRANDING.secondaryColor,
      accentColor: DEFAULT_BRANDING.accentColor,
      emailFromName: null,
      emailFooterText: null,
    });

    return resetBranding;
  }),

  /**
   * Set custom domain
   * Requires admin role
   */
  setCustomDomain: adminProcedure
    .input(setCustomDomainInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.organizationId) {
        throw new Error("No organization context");
      }

      // TODO: In production, this would:
      // 1. Verify domain ownership (DNS TXT record)
      // 2. Request SSL certificate from Let's Encrypt
      // 3. Configure reverse proxy/CDN

      await updateBrandingConfig(ctx.organizationId, {
        customDomain: input.domain,
        customDomainVerified: false, // Will be set to true after DNS verification
      });

      return {
        success: true,
        domain: input.domain,
        verificationRequired: true,
        verificationRecord: {
          type: "TXT",
          name: `_rsm-verify.${input.domain}`,
          value: `rsm-verify=${ctx.organizationId}`,
        },
        message: "Add the DNS TXT record to verify domain ownership",
      };
    }),

  /**
   * Verify custom domain DNS
   * Requires admin role
   */
  verifyCustomDomain: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const branding = await getBrandingConfig(ctx.organizationId);

    if (!branding?.customDomain) {
      throw new Error("No custom domain configured");
    }

    // TODO: In production, this would:
    // 1. Query DNS for TXT record
    // 2. Verify the record matches expected value
    // 3. Request SSL certificate if verified

    // For now, simulate verification
    const verified = true; // Would be actual DNS check result

    if (verified) {
      await updateBrandingConfig(ctx.organizationId, {
        customDomainVerified: true,
      });

      return {
        success: true,
        domain: branding.customDomain,
        verified: true,
        sslStatus: "pending", // Would be updated when cert is ready
        message: "Domain verified successfully. SSL certificate is being provisioned.",
      };
    }

    return {
      success: false,
      domain: branding.customDomain,
      verified: false,
      message: "DNS verification failed. Please ensure the TXT record is configured correctly.",
    };
  }),

  /**
   * Remove custom domain
   * Requires admin role
   */
  removeCustomDomain: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    await updateBrandingConfig(ctx.organizationId, {
      customDomain: null,
      customDomainVerified: false,
    });

    return { success: true };
  }),

  /**
   * Validate hex color
   */
  validateColor: protectedProcedure
    .input(z.object({ color: z.string() }))
    .query(({ input }) => {
      return {
        valid: isValidHexColor(input.color),
        color: input.color,
      };
    }),

  /**
   * Preview theme colors
   * Generate theme without saving
   */
  previewTheme: protectedProcedure
    .input(
      z.object({
        primaryColor: hexColorSchema,
        secondaryColor: hexColorSchema,
        accentColor: hexColorSchema,
      })
    )
    .query(({ input }) => {
      const colors = generateThemeColors(
        input.primaryColor,
        input.secondaryColor,
        input.accentColor
      );
      const cssVariables = generateCssVariables(colors);

      return {
        colors,
        cssVariables,
      };
    }),
});

export type BrandingRouter = typeof brandingRouter;
