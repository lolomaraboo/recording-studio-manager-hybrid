/**
 * Constants for the client application
 */

// Cookie and session settings
export const COOKIE_NAME = "rsm_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_OAUTH_PORTAL_URL || "";
  const appId = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_APP_ID || "";

  if (!oauthPortalUrl || !appId) {
    // Fallback to local login if OAuth is not configured
    return "/login";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Client login URL for client portal
export const getClientLoginUrl = () => "/client/login";
