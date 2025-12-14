/**
 * SSO Router
 *
 * Endpoints for Single Sign-On management:
 * - Configure SAML/OIDC providers
 * - Initiate SSO login flow
 * - Handle callbacks (ACS for SAML, callback for OIDC)
 * - Get SP metadata
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure, publicProcedure } from "../_core/trpc";
import {
  getSSOConfig,
  updateSSOConfig,
  disableSSO,
  generateSPMetadata,
  generateSAMLRequest,
  parseSAMLResponse,
  extractUserFromSAML,
  generateOIDCAuthUrl,
  exchangeOIDCCode,
  getOIDCUserInfo,
  extractUserFromOIDC,
  provisionSSOUser,
  validateEmailDomain,
  generateSSOState,
  validateSSOState,
  PROVIDER_CONFIGS,
  type SSOProvider,
  type SSOProviderType,
} from "../_core/sso";
import { generateAccessToken, generateRefreshToken } from "../_core/auth";

// ============================================================================
// Input Schemas
// ============================================================================

const ssoProviderSchema = z.enum(["okta", "azure_ad", "auth0", "google", "onelogin", "custom"]);

const attributeMappingSchema = z.object({
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  role: z.string().optional(),
  groups: z.string().optional(),
});

const configureSAMLInput = z.object({
  provider: ssoProviderSchema,
  entityId: z.string().url(),
  ssoUrl: z.string().url(),
  certificate: z.string().min(100), // X.509 certificate
  signatureAlgorithm: z.enum(["sha256", "sha512"]).optional(),
  allowedDomains: z.array(z.string()).optional(),
  autoProvision: z.boolean().optional(),
  defaultRole: z.string().optional(),
  attributeMapping: attributeMappingSchema.optional(),
});

const configureOIDCInput = z.object({
  provider: ssoProviderSchema,
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  issuer: z.string().url().optional(),
  authorizationUrl: z.string().url().optional(),
  tokenUrl: z.string().url().optional(),
  userInfoUrl: z.string().url().optional(),
  scopes: z.array(z.string()).optional(),
  allowedDomains: z.array(z.string()).optional(),
  autoProvision: z.boolean().optional(),
  defaultRole: z.string().optional(),
  attributeMapping: attributeMappingSchema.optional(),
});

const initiateSSOInput = z.object({
  organizationSlug: z.string(),
});

const samlCallbackInput = z.object({
  organizationId: z.number(),
  samlResponse: z.string(),
});

const oidcCallbackInput = z.object({
  organizationId: z.number(),
  code: z.string(),
  state: z.string(),
});

// ============================================================================
// Router
// ============================================================================

export const ssoRouter = router({
  /**
   * Get SSO configuration for current organization
   * Requires admin role
   */
  getConfig: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const config = await getSSOConfig(ctx.organizationId);

    if (!config) {
      return {
        enabled: false,
        providerType: null,
        provider: null,
      };
    }

    // Don't expose secrets
    return {
      enabled: config.enabled,
      providerType: config.providerType,
      provider: config.provider,
      // SAML (no secrets)
      samlEntityId: config.samlEntityId,
      samlSsoUrl: config.samlSsoUrl,
      samlCertificateConfigured: !!config.samlCertificate,
      samlSignatureAlgorithm: config.samlSignatureAlgorithm,
      // OIDC (hide secret)
      oidcClientId: config.oidcClientId,
      oidcClientSecretConfigured: !!config.oidcClientSecret,
      oidcIssuer: config.oidcIssuer,
      oidcAuthorizationUrl: config.oidcAuthorizationUrl,
      oidcTokenUrl: config.oidcTokenUrl,
      oidcUserInfoUrl: config.oidcUserInfoUrl,
      oidcScopes: config.oidcScopes,
      // Common
      allowedDomains: config.allowedDomains,
      autoProvision: config.autoProvision,
      defaultRole: config.defaultRole,
      attributeMapping: config.attributeMapping,
    };
  }),

  /**
   * Get available SSO providers with their default configurations
   */
  getProviders: protectedProcedure.query(() => {
    return Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
      id: key as SSOProvider,
      name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      type: config.providerType as SSOProviderType,
      description: getProviderDescription(key as SSOProvider),
    }));
  }),

  /**
   * Configure SAML SSO
   * Requires admin role
   */
  configureSAML: adminProcedure.input(configureSAMLInput).mutation(async ({ ctx, input }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const providerDefaults = PROVIDER_CONFIGS[input.provider];

    await updateSSOConfig(ctx.organizationId, {
      enabled: true,
      providerType: "saml",
      provider: input.provider,
      samlEntityId: input.entityId,
      samlSsoUrl: input.ssoUrl,
      samlCertificate: input.certificate,
      samlSignatureAlgorithm: input.signatureAlgorithm ?? "sha256",
      allowedDomains: input.allowedDomains,
      autoProvision: input.autoProvision ?? true,
      defaultRole: input.defaultRole ?? "member",
      attributeMapping: input.attributeMapping ?? providerDefaults.attributeMapping,
    });

    return { success: true };
  }),

  /**
   * Configure OIDC SSO
   * Requires admin role
   */
  configureOIDC: adminProcedure.input(configureOIDCInput).mutation(async ({ ctx, input }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const providerDefaults = PROVIDER_CONFIGS[input.provider];

    await updateSSOConfig(ctx.organizationId, {
      enabled: true,
      providerType: "oidc",
      provider: input.provider,
      oidcClientId: input.clientId,
      oidcClientSecret: input.clientSecret,
      oidcIssuer: input.issuer ?? providerDefaults.oidcIssuer,
      oidcAuthorizationUrl: input.authorizationUrl ?? providerDefaults.oidcAuthorizationUrl,
      oidcTokenUrl: input.tokenUrl ?? providerDefaults.oidcTokenUrl,
      oidcUserInfoUrl: input.userInfoUrl ?? providerDefaults.oidcUserInfoUrl,
      oidcScopes: input.scopes ?? providerDefaults.oidcScopes,
      allowedDomains: input.allowedDomains,
      autoProvision: input.autoProvision ?? true,
      defaultRole: input.defaultRole ?? "member",
      attributeMapping: input.attributeMapping ?? providerDefaults.attributeMapping,
    });

    return { success: true };
  }),

  /**
   * Disable SSO for organization
   * Requires admin role
   */
  disable: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    await disableSSO(ctx.organizationId);

    return { success: true };
  }),

  /**
   * Get SAML Service Provider metadata
   * Public endpoint for IdP configuration
   */
  getSPMetadata: publicProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(({ input }) => {
      const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
      const metadata = generateSPMetadata(input.organizationId, baseUrl);

      return {
        metadata,
        entityId: `${baseUrl}/api/sso/saml/${input.organizationId}/metadata`,
        acsUrl: `${baseUrl}/api/sso/saml/${input.organizationId}/acs`,
        sloUrl: `${baseUrl}/api/sso/saml/${input.organizationId}/slo`,
      };
    }),

  /**
   * Initiate SSO login flow
   * Returns redirect URL based on provider type
   */
  initiate: publicProcedure.input(initiateSSOInput).mutation(async ({ input }) => {
    // Find organization by slug
    const { getMasterDb } = await import("@rsm/database/connection");
    const { organizations } = await import("@rsm/database/master");
    const { eq } = await import("drizzle-orm");

    const db = await getMasterDb();
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, input.organizationSlug))
      .limit(1);

    if (!org) {
      throw new Error("Organization not found");
    }

    const config = await getSSOConfig(org.id);

    if (!config || !config.enabled) {
      throw new Error("SSO is not configured for this organization");
    }

    const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";

    if (config.providerType === "saml") {
      const { requestId, redirectUrl } = generateSAMLRequest(config, baseUrl);
      return {
        type: "saml" as const,
        redirectUrl,
        requestId,
      };
    } else {
      const state = generateSSOState(org.id);
      const redirectUrl = generateOIDCAuthUrl(config, baseUrl, state);
      return {
        type: "oidc" as const,
        redirectUrl,
        state,
      };
    }
  }),

  /**
   * Handle SAML ACS callback
   * Validates assertion and provisions user
   */
  samlCallback: publicProcedure.input(samlCallbackInput).mutation(async ({ input }) => {
    const config = await getSSOConfig(input.organizationId);

    if (!config || !config.enabled || config.providerType !== "saml") {
      throw new Error("SAML SSO is not configured");
    }

    // Parse and validate SAML response
    const assertion = parseSAMLResponse(input.samlResponse, config);

    // Extract user from assertion
    const ssoUser = extractUserFromSAML(assertion, config);

    // Validate email domain
    if (!validateEmailDomain(ssoUser.email, config.allowedDomains)) {
      throw new Error(`Email domain not allowed. Allowed domains: ${config.allowedDomains?.join(", ")}`);
    }

    // Provision or update user
    const { user, isNew } = await provisionSSOUser(ssoUser, config);

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "member" | "client",
      organizationId: config.organizationId,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      success: true,
      isNewUser: isNew,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }),

  /**
   * Handle OIDC callback
   * Exchanges code for tokens and provisions user
   */
  oidcCallback: publicProcedure.input(oidcCallbackInput).mutation(async ({ input }) => {
    // Validate state
    const organizationId = validateSSOState(input.state);

    if (!organizationId || organizationId !== input.organizationId) {
      throw new Error("Invalid or expired SSO state");
    }

    const config = await getSSOConfig(input.organizationId);

    if (!config || !config.enabled || config.providerType !== "oidc") {
      throw new Error("OIDC SSO is not configured");
    }

    const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";

    // Exchange code for tokens
    const tokens = await exchangeOIDCCode(config, input.code, baseUrl);

    // Get user info
    const userInfo = await getOIDCUserInfo(config, tokens.accessToken);

    // Extract user from user info
    const ssoUser = extractUserFromOIDC(userInfo, config);

    // Validate email domain
    if (!validateEmailDomain(ssoUser.email, config.allowedDomains)) {
      throw new Error(`Email domain not allowed. Allowed domains: ${config.allowedDomains?.join(", ")}`);
    }

    // Provision or update user
    const { user, isNew } = await provisionSSOUser(ssoUser, config);

    // Generate our own tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "member" | "client",
      organizationId: config.organizationId,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      success: true,
      isNewUser: isNew,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }),

  /**
   * Check if SSO is available for an organization
   * Public endpoint for login page
   */
  checkAvailability: publicProcedure
    .input(z.object({ organizationSlug: z.string() }))
    .query(async ({ input }) => {
      const { getMasterDb } = await import("@rsm/database/connection");
      const { organizations } = await import("@rsm/database/master");
      const { eq } = await import("drizzle-orm");

      const db = await getMasterDb();
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.organizationSlug))
        .limit(1);

      if (!org) {
        return { available: false, provider: null };
      }

      const config = await getSSOConfig(org.id);

      if (!config || !config.enabled) {
        return { available: false, provider: null };
      }

      return {
        available: true,
        provider: config.provider,
        providerType: config.providerType,
        organizationName: org.name,
      };
    }),

  /**
   * Test SSO configuration
   * Requires admin role
   */
  testConfiguration: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new Error("No organization context");
    }

    const config = await getSSOConfig(ctx.organizationId);

    if (!config) {
      return {
        success: false,
        error: "SSO not configured",
      };
    }

    // Basic validation
    const errors: string[] = [];

    if (config.providerType === "saml") {
      if (!config.samlEntityId) errors.push("SAML Entity ID is required");
      if (!config.samlSsoUrl) errors.push("SAML SSO URL is required");
      if (!config.samlCertificate) errors.push("SAML Certificate is required");
    } else if (config.providerType === "oidc") {
      if (!config.oidcClientId) errors.push("OIDC Client ID is required");
      if (!config.oidcClientSecret) errors.push("OIDC Client Secret is required");
      if (!config.oidcIssuer && !config.oidcAuthorizationUrl) {
        errors.push("OIDC Issuer or Authorization URL is required");
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      message: "Configuration is valid. Initiate a test login to verify end-to-end.",
    };
  }),
});

// ============================================================================
// Helper Functions
// ============================================================================

function getProviderDescription(provider: SSOProvider): string {
  const descriptions: Record<SSOProvider, string> = {
    okta: "Enterprise identity management with SAML 2.0",
    azure_ad: "Microsoft Azure Active Directory",
    auth0: "Flexible authentication platform with OIDC",
    google: "Google Workspace SSO",
    onelogin: "Cloud-based identity management",
    custom: "Custom SAML or OIDC provider",
  };
  return descriptions[provider];
}

export type SSORouter = typeof ssoRouter;
