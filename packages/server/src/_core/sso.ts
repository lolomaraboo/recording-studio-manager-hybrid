/**
 * SSO (Single Sign-On) Module
 *
 * Supports multiple SSO providers:
 * - SAML 2.0 (Okta, Azure AD, OneLogin)
 * - OpenID Connect (Auth0, Google, Microsoft)
 *
 * Features:
 * - Provider configuration management
 * - SAML assertion validation
 * - OIDC token exchange
 * - User provisioning (JIT)
 * - Attribute mapping
 */

import { eq, and } from "drizzle-orm";
import { getMasterDb } from "@rsm/database/connection";
import { organizations, users, organizationMembers } from "@rsm/database/master";
import crypto from "crypto";

// ============================================================================
// Types
// ============================================================================

export type SSOProviderType = "saml" | "oidc";
export type SSOProvider = "okta" | "azure_ad" | "auth0" | "google" | "onelogin" | "custom";

export interface SSOConfig {
  id: number;
  organizationId: number;
  providerType: SSOProviderType;
  provider: SSOProvider;
  enabled: boolean;
  // SAML configuration
  samlEntityId?: string;
  samlSsoUrl?: string;
  samlCertificate?: string;
  samlSignatureAlgorithm?: "sha256" | "sha512";
  // OIDC configuration
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcIssuer?: string;
  oidcAuthorizationUrl?: string;
  oidcTokenUrl?: string;
  oidcUserInfoUrl?: string;
  oidcScopes?: string[];
  // Common settings
  allowedDomains?: string[];
  autoProvision: boolean;
  defaultRole: string;
  attributeMapping: AttributeMapping;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttributeMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  groups?: string;
}

export interface SAMLAssertion {
  issuer: string;
  nameId: string;
  nameIdFormat: string;
  sessionIndex?: string;
  attributes: Record<string, string | string[]>;
  conditions?: {
    notBefore?: Date;
    notOnOrAfter?: Date;
    audience?: string;
  };
}

export interface OIDCTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface OIDCUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
}

export interface SSOUser {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  groups?: string[];
  externalId: string;
  provider: SSOProvider;
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_ATTRIBUTE_MAPPING: AttributeMapping = {
  email: "email",
  firstName: "firstName",
  lastName: "lastName",
  displayName: "displayName",
};

export const PROVIDER_CONFIGS: Record<SSOProvider, Partial<SSOConfig>> = {
  okta: {
    providerType: "saml",
    samlSignatureAlgorithm: "sha256",
    attributeMapping: {
      email: "email",
      firstName: "firstName",
      lastName: "lastName",
      displayName: "displayName",
      groups: "groups",
    },
  },
  azure_ad: {
    providerType: "saml",
    samlSignatureAlgorithm: "sha256",
    attributeMapping: {
      email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      firstName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
      lastName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
      displayName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
      groups: "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups",
    },
  },
  auth0: {
    providerType: "oidc",
    oidcScopes: ["openid", "profile", "email"],
    attributeMapping: {
      email: "email",
      firstName: "given_name",
      lastName: "family_name",
      displayName: "name",
    },
  },
  google: {
    providerType: "oidc",
    oidcIssuer: "https://accounts.google.com",
    oidcAuthorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    oidcTokenUrl: "https://oauth2.googleapis.com/token",
    oidcUserInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    oidcScopes: ["openid", "profile", "email"],
    attributeMapping: {
      email: "email",
      firstName: "given_name",
      lastName: "family_name",
      displayName: "name",
    },
  },
  onelogin: {
    providerType: "saml",
    samlSignatureAlgorithm: "sha256",
    attributeMapping: {
      email: "User.email",
      firstName: "User.FirstName",
      lastName: "User.LastName",
      displayName: "User.DisplayName",
    },
  },
  custom: {
    providerType: "saml",
    attributeMapping: DEFAULT_ATTRIBUTE_MAPPING,
  },
};

// ============================================================================
// SSO Configuration Management
// ============================================================================

/**
 * Get SSO configuration for an organization
 */
export async function getSSOConfig(organizationId: number): Promise<SSOConfig | null> {
  const db = await getMasterDb();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!org || !org.ssoEnabled) {
    return null;
  }

  return {
    id: org.id,
    organizationId: org.id,
    providerType: (org.ssoProviderType as SSOProviderType) ?? "saml",
    provider: (org.ssoProvider as SSOProvider) ?? "custom",
    enabled: org.ssoEnabled ?? false,
    samlEntityId: org.ssoSamlEntityId ?? undefined,
    samlSsoUrl: org.ssoSamlSsoUrl ?? undefined,
    samlCertificate: org.ssoSamlCertificate ?? undefined,
    samlSignatureAlgorithm: (org.ssoSamlSignatureAlgorithm as "sha256" | "sha512") ?? "sha256",
    oidcClientId: org.ssoOidcClientId ?? undefined,
    oidcClientSecret: org.ssoOidcClientSecret ?? undefined,
    oidcIssuer: org.ssoOidcIssuer ?? undefined,
    oidcAuthorizationUrl: org.ssoOidcAuthorizationUrl ?? undefined,
    oidcTokenUrl: org.ssoOidcTokenUrl ?? undefined,
    oidcUserInfoUrl: org.ssoOidcUserInfoUrl ?? undefined,
    oidcScopes: org.ssoOidcScopes ? JSON.parse(org.ssoOidcScopes) : undefined,
    allowedDomains: org.ssoAllowedDomains ? JSON.parse(org.ssoAllowedDomains) : undefined,
    autoProvision: org.ssoAutoProvision ?? true,
    defaultRole: org.ssoDefaultRole ?? "member",
    attributeMapping: org.ssoAttributeMapping
      ? JSON.parse(org.ssoAttributeMapping)
      : DEFAULT_ATTRIBUTE_MAPPING,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
}

/**
 * Update SSO configuration for an organization
 */
export async function updateSSOConfig(
  organizationId: number,
  config: Partial<Omit<SSOConfig, "id" | "organizationId" | "createdAt" | "updatedAt">>
): Promise<SSOConfig | null> {
  const db = await getMasterDb();

  await db
    .update(organizations)
    .set({
      ssoEnabled: config.enabled,
      ssoProviderType: config.providerType,
      ssoProvider: config.provider,
      ssoSamlEntityId: config.samlEntityId,
      ssoSamlSsoUrl: config.samlSsoUrl,
      ssoSamlCertificate: config.samlCertificate,
      ssoSamlSignatureAlgorithm: config.samlSignatureAlgorithm,
      ssoOidcClientId: config.oidcClientId,
      ssoOidcClientSecret: config.oidcClientSecret,
      ssoOidcIssuer: config.oidcIssuer,
      ssoOidcAuthorizationUrl: config.oidcAuthorizationUrl,
      ssoOidcTokenUrl: config.oidcTokenUrl,
      ssoOidcUserInfoUrl: config.oidcUserInfoUrl,
      ssoOidcScopes: config.oidcScopes ? JSON.stringify(config.oidcScopes) : undefined,
      ssoAllowedDomains: config.allowedDomains ? JSON.stringify(config.allowedDomains) : undefined,
      ssoAutoProvision: config.autoProvision,
      ssoDefaultRole: config.defaultRole,
      ssoAttributeMapping: config.attributeMapping
        ? JSON.stringify(config.attributeMapping)
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  return getSSOConfig(organizationId);
}

/**
 * Disable SSO for an organization
 */
export async function disableSSO(organizationId: number): Promise<void> {
  const db = await getMasterDb();

  await db
    .update(organizations)
    .set({
      ssoEnabled: false,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));
}

// ============================================================================
// SAML Functions
// ============================================================================

/**
 * Generate SAML service provider metadata
 */
export function generateSPMetadata(
  organizationId: number,
  baseUrl: string
): string {
  const entityId = `${baseUrl}/api/sso/saml/${organizationId}/metadata`;
  const acsUrl = `${baseUrl}/api/sso/saml/${organizationId}/acs`;
  const sloUrl = `${baseUrl}/api/sso/saml/${organizationId}/slo`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${entityId}">
  <SPSSODescriptor AuthnRequestsSigned="true"
                   WantAssertionsSigned="true"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${acsUrl}"
                              index="0"
                              isDefault="true"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                         Location="${sloUrl}"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
}

/**
 * Generate SAML authentication request
 */
export function generateSAMLRequest(
  config: SSOConfig,
  baseUrl: string
): { requestId: string; redirectUrl: string } {
  const requestId = `_${crypto.randomUUID()}`;
  const issueInstant = new Date().toISOString();
  const entityId = `${baseUrl}/api/sso/saml/${config.organizationId}/metadata`;
  const acsUrl = `${baseUrl}/api/sso/saml/${config.organizationId}/acs`;

  const samlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="${requestId}"
                    Version="2.0"
                    IssueInstant="${issueInstant}"
                    AssertionConsumerServiceURL="${acsUrl}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                      AllowCreate="true"/>
</samlp:AuthnRequest>`;

  // Base64 encode and URL encode the request
  const encodedRequest = Buffer.from(samlRequest).toString("base64");
  const redirectUrl = `${config.samlSsoUrl}?SAMLRequest=${encodeURIComponent(encodedRequest)}`;

  return { requestId, redirectUrl };
}

/**
 * Parse SAML response and extract user info
 * NOTE: In production, use a proper SAML library like saml2-js or passport-saml
 */
export function parseSAMLResponse(
  _samlResponse: string,
  _config: SSOConfig
): SAMLAssertion {
  // This is a simplified implementation
  // In production, use a proper SAML library for signature verification

  // Decode base64 response
  const decodedResponse = Buffer.from(_samlResponse, "base64").toString("utf-8");

  // Parse XML (simplified - use xml2js or similar in production)
  // Extract NameID and attributes from the assertion
  const nameIdMatch = decodedResponse.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
  const issuerMatch = decodedResponse.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/);

  if (!nameIdMatch || !issuerMatch) {
    throw new Error("Invalid SAML response: missing NameID or Issuer");
  }

  // Extract attributes (simplified)
  const attributes: Record<string, string> = {};
  const attributeRegex = /<saml:Attribute Name="([^"]+)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g;
  let match;
  while ((match = attributeRegex.exec(decodedResponse)) !== null) {
    if (match[1] && match[2]) {
      attributes[match[1]] = match[2];
    }
  }

  return {
    issuer: issuerMatch[1] ?? "",
    nameId: nameIdMatch[1] ?? "",
    nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    attributes,
  };
}

/**
 * Extract user from SAML assertion using attribute mapping
 */
export function extractUserFromSAML(
  assertion: SAMLAssertion,
  config: SSOConfig
): SSOUser {
  const mapping = config.attributeMapping;

  const getAttributeValue = (key: string): string | undefined => {
    const attrName = mapping[key as keyof AttributeMapping];
    if (!attrName) return undefined;

    const value = assertion.attributes[attrName];
    return Array.isArray(value) ? value[0] : value;
  };

  const email = getAttributeValue("email") ?? assertion.nameId;

  return {
    email,
    firstName: getAttributeValue("firstName"),
    lastName: getAttributeValue("lastName"),
    displayName: getAttributeValue("displayName"),
    role: getAttributeValue("role"),
    groups: mapping.groups
      ? (assertion.attributes[mapping.groups] as string[])
      : undefined,
    externalId: assertion.nameId,
    provider: config.provider,
  };
}

// ============================================================================
// OIDC Functions
// ============================================================================

/**
 * Generate OIDC authorization URL
 */
export function generateOIDCAuthUrl(
  config: SSOConfig,
  baseUrl: string,
  state: string
): string {
  const redirectUri = `${baseUrl}/api/sso/oidc/${config.organizationId}/callback`;

  const params = new URLSearchParams({
    client_id: config.oidcClientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: (config.oidcScopes ?? ["openid", "profile", "email"]).join(" "),
    state,
  });

  return `${config.oidcAuthorizationUrl}?${params.toString()}`;
}

/**
 * Exchange OIDC authorization code for tokens
 */
export async function exchangeOIDCCode(
  config: SSOConfig,
  code: string,
  baseUrl: string
): Promise<OIDCTokens> {
  const redirectUri = `${baseUrl}/api/sso/oidc/${config.organizationId}/callback`;

  const response = await fetch(config.oidcTokenUrl!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.oidcClientId!,
      client_secret: config.oidcClientSecret!,
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OIDC token exchange failed: ${error}`);
  }

  const data = await response.json() as {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

/**
 * Get user info from OIDC provider
 */
export async function getOIDCUserInfo(
  config: SSOConfig,
  accessToken: string
): Promise<OIDCUserInfo> {
  const response = await fetch(config.oidcUserInfoUrl!, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OIDC userinfo failed: ${error}`);
  }

  return response.json() as Promise<OIDCUserInfo>;
}

/**
 * Extract user from OIDC user info using attribute mapping
 */
export function extractUserFromOIDC(
  userInfo: OIDCUserInfo,
  config: SSOConfig
): SSOUser {
  const mapping = config.attributeMapping;

  const getAttributeValue = (key: string): string | undefined => {
    const attrName = mapping[key as keyof AttributeMapping];
    if (!attrName) return undefined;
    const value = userInfo[attrName];
    return typeof value === "string" ? value : undefined;
  };

  const email = getAttributeValue("email") ?? userInfo.email ?? "";

  return {
    email,
    firstName: getAttributeValue("firstName") ?? userInfo.given_name,
    lastName: getAttributeValue("lastName") ?? userInfo.family_name,
    displayName: getAttributeValue("displayName") ?? userInfo.name,
    externalId: userInfo.sub,
    provider: config.provider,
  };
}

// ============================================================================
// User Provisioning
// ============================================================================

/**
 * Provision or update user from SSO
 */
export async function provisionSSOUser(
  ssoUser: SSOUser,
  config: SSOConfig
): Promise<{ user: typeof users.$inferSelect; isNew: boolean }> {
  const db = await getMasterDb();

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, ssoUser.email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    // Update existing user
    const displayName = ssoUser.displayName ??
      [ssoUser.firstName, ssoUser.lastName].filter(Boolean).join(" ") ??
      ssoUser.email;

    await db
      .update(users)
      .set({
        name: displayName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id));

    // Ensure user is member of organization
    const [existingMembership] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, existingUser.id),
          eq(organizationMembers.organizationId, config.organizationId)
        )
      )
      .limit(1);

    if (!existingMembership) {
      await db.insert(organizationMembers).values({
        userId: existingUser.id,
        organizationId: config.organizationId,
        role: ssoUser.role ?? config.defaultRole,
      });
    }

    return { user: existingUser, isNew: false };
  }

  // Create new user (JIT provisioning)
  if (!config.autoProvision) {
    throw new Error("User not found and auto-provisioning is disabled");
  }

  const displayName = ssoUser.displayName ??
    [ssoUser.firstName, ssoUser.lastName].filter(Boolean).join(" ") ??
    ssoUser.email;

  const [newUser] = await db
    .insert(users)
    .values({
      email: ssoUser.email.toLowerCase(),
      name: displayName,
      role: ssoUser.role ?? config.defaultRole,
      isActive: true,
    })
    .returning();

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  // Add to organization
  await db.insert(organizationMembers).values({
    userId: newUser.id,
    organizationId: config.organizationId,
    role: ssoUser.role ?? config.defaultRole,
  });

  return { user: newUser, isNew: true };
}

/**
 * Validate email domain against allowed domains
 */
export function validateEmailDomain(
  email: string,
  allowedDomains?: string[]
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true; // No domain restriction
  }

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return allowedDomains.some((d) => d.toLowerCase() === domain);
}

// ============================================================================
// SSO State Management
// ============================================================================

// In-memory state store (use Redis in production)
const ssoStateStore = new Map<string, { organizationId: number; expiresAt: Date }>();

/**
 * Generate and store SSO state
 */
export function generateSSOState(organizationId: number): string {
  const state = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  ssoStateStore.set(state, { organizationId, expiresAt });

  // Cleanup expired states
  for (const [key, value] of ssoStateStore.entries()) {
    if (value.expiresAt < new Date()) {
      ssoStateStore.delete(key);
    }
  }

  return state;
}

/**
 * Validate and consume SSO state
 */
export function validateSSOState(state: string): number | null {
  const stored = ssoStateStore.get(state);

  if (!stored) {
    return null;
  }

  if (stored.expiresAt < new Date()) {
    ssoStateStore.delete(state);
    return null;
  }

  ssoStateStore.delete(state);
  return stored.organizationId;
}
