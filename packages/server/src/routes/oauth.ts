/**
 * OAuth Routes — "Sign in with Google" & "Sign in with Apple"
 *
 * Flow (provider = google | apple):
 *   GET  /api/auth/oauth/:provider/start     → redirects to provider consent screen
 *   GET  /api/auth/oauth/google/callback     → code exchange, login, redirect to app
 *   POST /api/auth/oauth/apple/callback      → Apple uses response_mode=form_post
 *
 * Implementation notes:
 * - Zero external dependency: uses global fetch (Node 20+) and node:crypto.
 * - ID tokens are received directly from the provider's token endpoint over TLS,
 *   so signature verification is optional per OIDC Core 3.1.3.7. We still validate
 *   iss / aud / exp claims.
 * - State (+ PKCE verifier for Google) is stored in a short-lived httpOnly cookie,
 *   NOT in the session: Apple's form_post callback is a cross-site POST and the
 *   session cookie (SameSite=Lax) would not be sent with it.
 * - Account linking: if a user already exists with the same email, the OAuth
 *   identity is linked automatically to that account.
 * - New users: a user (no password) + an organization + a tenant database are
 *   created automatically, mirroring the classic register flow.
 */

import { Router, type Request, type Response } from "express";
import express from "express";
import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";
import {
  users,
  organizations,
  organizationMembers,
  oauthAccounts,
} from "@rsm/database/master/schema";
import { getMasterDb } from "@rsm/database/connection";
import { createTenantDatabase } from "../services/tenant-provisioning.js";

const router = Router();

// ============================================================================
// Config
// ============================================================================

const APP_URL = process.env.APP_URL || "http://localhost:5174";
const IS_PROD = process.env.NODE_ENV === "production";

const GOOGLE = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  issuers: ["https://accounts.google.com", "accounts.google.com"],
};

const APPLE = {
  clientId: process.env.APPLE_CLIENT_ID || "", // Services ID, e.g. com.example.app.web
  teamId: process.env.APPLE_TEAM_ID || "",
  keyId: process.env.APPLE_KEY_ID || "",
  privateKey: (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"), // .p8 contents
  authorizeUrl: "https://appleid.apple.com/auth/authorize",
  tokenUrl: "https://appleid.apple.com/auth/token",
  issuers: ["https://appleid.apple.com"],
};

const STATE_COOKIE = "rsm_oauth";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function redirectUri(provider: string): string {
  return `${APP_URL}/api/auth/oauth/${provider}/callback`;
}

// ============================================================================
// Small helpers (base64url, cookies, JWT)
// ============================================================================

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

interface OAuthStatePayload {
  provider: string;
  state: string;
  verifier?: string; // PKCE code_verifier (Google)
  exp: number;
}

function setStateCookie(res: Response, payload: OAuthStatePayload): void {
  res.cookie(STATE_COOKIE, b64url(JSON.stringify(payload)), {
    httpOnly: true,
    maxAge: STATE_TTL_MS,
    path: "/api/auth/oauth",
    // Apple's form_post callback is a cross-site POST → SameSite=None required.
    // SameSite=None needs Secure, hence Lax in local HTTP development
    // (Apple cannot target localhost anyway; Google works fine with Lax).
    sameSite: IS_PROD ? "none" : "lax",
    secure: IS_PROD,
  });
}

function readStateCookie(req: Request): OAuthStatePayload | null {
  const raw = parseCookies(req)[STATE_COOKIE];
  if (!raw) return null;
  try {
    const payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!payload.state || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function clearStateCookie(res: Response): void {
  res.clearCookie(STATE_COOKIE, { path: "/api/auth/oauth" });
}

/** Decode a JWT payload without signature verification (token received over TLS). */
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

/** Validate basic OIDC claims (iss / aud / exp). */
function validateIdTokenClaims(
  claims: Record<string, unknown>,
  issuers: string[],
  audience: string
): void {
  if (typeof claims.iss !== "string" || !issuers.includes(claims.iss)) {
    throw new Error(`Invalid id_token issuer: ${String(claims.iss)}`);
  }
  const aud = claims.aud;
  const audOk = Array.isArray(aud) ? aud.includes(audience) : aud === audience;
  if (!audOk) throw new Error("Invalid id_token audience");
  if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) {
    throw new Error("Expired id_token");
  }
}

/**
 * Build Apple's client_secret: an ES256-signed JWT (max 6 months validity).
 * Signed with the .p8 private key from the Apple Developer portal.
 */
function buildAppleClientSecret(): string {
  if (!APPLE.privateKey || !APPLE.teamId || !APPLE.keyId || !APPLE.clientId) {
    throw new Error("Apple Sign In is not configured (APPLE_* env vars missing)");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "ES256", kid: APPLE.keyId }));
  const payload = b64url(
    JSON.stringify({
      iss: APPLE.teamId,
      iat: now,
      exp: now + 300, // 5 minutes is plenty for a token exchange
      aud: "https://appleid.apple.com",
      sub: APPLE.clientId,
    })
  );
  const signingInput = `${header}.${payload}`;
  const key = crypto.createPrivateKey(APPLE.privateKey);
  // ES256 requires the IEEE P1363 (r||s) signature encoding, not ASN.1/DER
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${b64url(signature)}`;
}

function failRedirect(res: Response, code: string): void {
  clearStateCookie(res);
  res.redirect(`${APP_URL}/login?error=${encodeURIComponent(code)}`);
}

// ============================================================================
// User resolution (find / link / create) + session
// ============================================================================

interface OAuthProfile {
  provider: "google" | "apple";
  providerAccountId: string; // "sub" claim
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loginOrCreateUser(req: Request, profile: OAuthProfile): Promise<void> {
  const masterDb = await getMasterDb();

  // 1. Existing OAuth link?
  const existingLink = await masterDb
    .select()
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, profile.provider),
        eq(oauthAccounts.providerAccountId, profile.providerAccountId)
      )
    )
    .limit(1);

  let user: typeof users.$inferSelect | undefined;

  if (existingLink.length > 0) {
    const userList = await masterDb
      .select()
      .from(users)
      .where(eq(users.id, existingLink[0].userId))
      .limit(1);
    user = userList[0];
  }

  // 2. No link yet → match by email (auto-link), else create the user
  if (!user) {
    if (!profile.email) {
      throw new Error("no_email");
    }

    const byEmail = await masterDb
      .select()
      .from(users)
      .where(eq(users.email, profile.email))
      .limit(1);

    if (byEmail.length > 0) {
      user = byEmail[0];
      console.log(
        `[OAuth] Linking ${profile.provider} account to existing user ${user.id} (${profile.email})`
      );
    } else {
      const inserted = await masterDb
        .insert(users)
        .values({
          email: profile.email,
          name: profile.name,
          passwordHash: null, // OAuth-only account
          role: "admin",
        })
        .returning();
      user = inserted[0];
      console.log(`[OAuth] Created new user ${user.id} via ${profile.provider}`);
    }

    await masterDb.insert(oauthAccounts).values({
      userId: user.id,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
    });
  }

  if (!user.isActive) {
    throw new Error("account_disabled");
  }

  // 3. Resolve organization (owner first, then membership) — same as classic login
  let orgList = await masterDb
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.ownerId, user.id))
    .limit(1);

  if (orgList.length === 0) {
    orgList = await masterDb
      .select({ id: organizations.id, name: organizations.name })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, user.id))
      .limit(1);
  }

  // 4. Brand-new user without organization → create org + tenant DB (like register)
  if (orgList.length === 0) {
    const orgName = `Studio de ${user.name || user.email.split("@")[0]}`;
    let slug = slugify(orgName) || `studio-${user.id}`;

    const slugTaken = await masterDb
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (slugTaken.length > 0) {
      slug = `${slug}-${user.id}`;
    }

    const newOrg = await masterDb
      .insert(organizations)
      .values({ name: orgName, slug, subdomain: slug, ownerId: user.id })
      .returning();

    const tenantResult = await createTenantDatabase(newOrg[0].id);
    if (!tenantResult.success) {
      throw new Error(`tenant_creation_failed: ${tenantResult.error}`);
    }

    console.log(`[OAuth] Created organization ${newOrg[0].id} + tenant DB for user ${user.id}`);
    orgList = [{ id: newOrg[0].id, name: newOrg[0].name }];
  }

  const org = orgList[0];

  // 5. Session (identical to classic login)
  (req.session as any).userId = user.id;
  (req.session as any).organizationId = org.id;
  (req.session as any).email = user.email;
  (req.session as any).name = user.name;
  (req.session as any).role = user.role;

  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

  console.log(`[OAuth] ${profile.provider} login OK — user ${user.id}, org ${org.id}`);
}

// ============================================================================
// Routes — start
// ============================================================================

router.get("/google/start", (_req: Request, res: Response) => {
  if (!GOOGLE.clientId || !GOOGLE.clientSecret) {
    return failRedirect(res, "google_not_configured");
  }

  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());

  setStateCookie(res, { provider: "google", state, verifier, exp: Date.now() + STATE_TTL_MS });

  const params = new URLSearchParams({
    client_id: GOOGLE.clientId,
    redirect_uri: redirectUri("google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });

  res.redirect(`${GOOGLE.authorizeUrl}?${params.toString()}`);
});

router.get("/apple/start", (_req: Request, res: Response) => {
  if (!APPLE.clientId) {
    return failRedirect(res, "apple_not_configured");
  }

  const state = randomToken();
  setStateCookie(res, { provider: "apple", state, exp: Date.now() + STATE_TTL_MS });

  const params = new URLSearchParams({
    client_id: APPLE.clientId,
    redirect_uri: redirectUri("apple"),
    response_type: "code",
    scope: "name email",
    response_mode: "form_post", // required by Apple when requesting name/email
    state,
  });

  res.redirect(`${APPLE.authorizeUrl}?${params.toString()}`);
});

// ============================================================================
// Routes — callbacks
// ============================================================================

router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query as Record<string, string | undefined>;
    if (error) return failRedirect(res, error === "access_denied" ? "cancelled" : "oauth_failed");

    const saved = readStateCookie(req);
    if (!code || !saved || saved.provider !== "google" || saved.state !== state) {
      return failRedirect(res, "invalid_state");
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch(GOOGLE.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE.clientId,
        client_secret: GOOGLE.clientSecret,
        code,
        code_verifier: saved.verifier || "",
        grant_type: "authorization_code",
        redirect_uri: redirectUri("google"),
      }),
    });

    if (!tokenRes.ok) {
      console.error("[OAuth] Google token exchange failed:", await tokenRes.text());
      return failRedirect(res, "token_exchange_failed");
    }

    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) return failRedirect(res, "token_exchange_failed");

    const claims = decodeJwtPayload(tokens.id_token);
    validateIdTokenClaims(claims, GOOGLE.issuers, GOOGLE.clientId);

    await loginOrCreateUser(req, {
      provider: "google",
      providerAccountId: String(claims.sub),
      email: typeof claims.email === "string" ? claims.email : null,
      emailVerified: claims.email_verified === true,
      name: typeof claims.name === "string" ? claims.name : null,
    });

    clearStateCookie(res);
    res.redirect(`${APP_URL}/`);
  } catch (err: any) {
    console.error("[OAuth] Google callback error:", err);
    failRedirect(res, err?.message === "no_email" ? "no_email" : "oauth_failed");
  }
});

router.post(
  "/apple/callback",
  express.urlencoded({ extended: false }),
  async (req: Request, res: Response) => {
    try {
      const { code, state, error, user: appleUserJson } = req.body as Record<string, string | undefined>;
      if (error) return failRedirect(res, error === "user_cancelled_authorize" ? "cancelled" : "oauth_failed");

      const saved = readStateCookie(req);
      if (!code || !saved || saved.provider !== "apple" || saved.state !== state) {
        return failRedirect(res, "invalid_state");
      }

      // Exchange authorization code for tokens
      const tokenRes = await fetch(APPLE.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: APPLE.clientId,
          client_secret: buildAppleClientSecret(),
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri("apple"),
        }),
      });

      if (!tokenRes.ok) {
        console.error("[OAuth] Apple token exchange failed:", await tokenRes.text());
        return failRedirect(res, "token_exchange_failed");
      }

      const tokens = (await tokenRes.json()) as { id_token?: string };
      if (!tokens.id_token) return failRedirect(res, "token_exchange_failed");

      const claims = decodeJwtPayload(tokens.id_token);
      validateIdTokenClaims(claims, APPLE.issuers, APPLE.clientId);

      // Apple only sends the user's name on the FIRST authorization, as a
      // JSON string in the form body — never in the id_token.
      let name: string | null = null;
      if (appleUserJson) {
        try {
          const parsed = JSON.parse(appleUserJson) as {
            name?: { firstName?: string; lastName?: string };
          };
          name =
            [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(" ") || null;
        } catch {
          /* ignore malformed user JSON */
        }
      }

      await loginOrCreateUser(req, {
        provider: "apple",
        providerAccountId: String(claims.sub),
        email: typeof claims.email === "string" ? claims.email : null,
        emailVerified: claims.email_verified === true || claims.email_verified === "true",
        name,
      });

      clearStateCookie(res);
      res.redirect(`${APP_URL}/`);
    } catch (err: any) {
      console.error("[OAuth] Apple callback error:", err);
      failRedirect(res, err?.message === "no_email" ? "no_email" : "oauth_failed");
    }
  }
);

export default router;
