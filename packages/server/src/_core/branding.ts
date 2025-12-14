/**
 * White-Label Branding Module
 *
 * Provides organization-specific branding configuration:
 * - Custom colors (primary, secondary, accent)
 * - Logo and favicon URLs
 * - Email branding
 * - Custom domain support
 */

import { eq } from "drizzle-orm";
import { getMasterDb } from "@rsm/database/connection";
import { organizations } from "@rsm/database/master";

// ============================================================================
// Types
// ============================================================================

export interface BrandingConfig {
  // Organization identity
  organizationId: number;
  organizationName: string;
  slug: string;

  // Visual branding
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Email branding
  emailFromName: string | null;
  emailFooterText: string | null;

  // Custom domain
  customDomain: string | null;
  customDomainVerified: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  // Computed shades
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryDark: string;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_BRANDING: Omit<BrandingConfig, "organizationId" | "organizationName" | "slug"> = {
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#7c3aed", // Purple-600
  secondaryColor: "#a855f7", // Purple-500
  accentColor: "#6366f1", // Indigo-500
  emailFromName: null,
  emailFooterText: null,
  customDomain: null,
  customDomainVerified: false,
};

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate light and dark shades of a color
 */
export function generateColorShades(hex: string): { light: string; dark: string } {
  const hsl = hexToHsl(hex);

  // Light shade: increase lightness by 15%
  const light = hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 95));

  // Dark shade: decrease lightness by 15%
  const dark = hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 15, 5));

  return { light, dark };
}

/**
 * Generate full theme colors from primary, secondary, and accent
 */
export function generateThemeColors(
  primary: string,
  secondary: string,
  accent: string
): ThemeColors {
  const primaryShades = generateColorShades(primary);
  const secondaryShades = generateColorShades(secondary);

  return {
    primary,
    secondary,
    accent,
    primaryLight: primaryShades.light,
    primaryDark: primaryShades.dark,
    secondaryLight: secondaryShades.light,
    secondaryDark: secondaryShades.dark,
  };
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// ============================================================================
// Branding Functions
// ============================================================================

/**
 * Get branding configuration for an organization
 */
export async function getBrandingConfig(
  organizationId: number
): Promise<BrandingConfig | null> {
  const db = await getMasterDb();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!org) {
    return null;
  }

  return {
    organizationId: org.id,
    organizationName: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl,
    faviconUrl: org.faviconUrl,
    primaryColor: org.primaryColor ?? DEFAULT_BRANDING.primaryColor,
    secondaryColor: org.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
    accentColor: org.accentColor ?? DEFAULT_BRANDING.accentColor,
    emailFromName: org.emailFromName,
    emailFooterText: org.emailFooterText,
    customDomain: org.customDomain,
    customDomainVerified: org.customDomainVerified ?? false,
  };
}

/**
 * Update branding configuration for an organization
 */
export async function updateBrandingConfig(
  organizationId: number,
  updates: Partial<Omit<BrandingConfig, "organizationId" | "organizationName" | "slug">>
): Promise<BrandingConfig | null> {
  const db = await getMasterDb();

  // Validate colors if provided
  if (updates.primaryColor && !isValidHexColor(updates.primaryColor)) {
    throw new Error("Invalid primary color format. Use hex format: #RRGGBB");
  }
  if (updates.secondaryColor && !isValidHexColor(updates.secondaryColor)) {
    throw new Error("Invalid secondary color format. Use hex format: #RRGGBB");
  }
  if (updates.accentColor && !isValidHexColor(updates.accentColor)) {
    throw new Error("Invalid accent color format. Use hex format: #RRGGBB");
  }

  await db
    .update(organizations)
    .set({
      logoUrl: updates.logoUrl,
      faviconUrl: updates.faviconUrl,
      primaryColor: updates.primaryColor,
      secondaryColor: updates.secondaryColor,
      accentColor: updates.accentColor,
      emailFromName: updates.emailFromName,
      emailFooterText: updates.emailFooterText,
      customDomain: updates.customDomain,
      customDomainVerified: updates.customDomainVerified,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  return getBrandingConfig(organizationId);
}

/**
 * Generate CSS variables for theme
 */
export function generateCssVariables(colors: ThemeColors): Record<string, string> {
  const primaryHsl = hexToHsl(colors.primary);
  const secondaryHsl = hexToHsl(colors.secondary);
  const accentHsl = hexToHsl(colors.accent);

  return {
    "--primary": `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`,
    "--primary-foreground": primaryHsl.l > 50 ? "0 0% 0%" : "0 0% 100%",
    "--secondary": `${secondaryHsl.h} ${secondaryHsl.s}% ${secondaryHsl.l}%`,
    "--secondary-foreground": secondaryHsl.l > 50 ? "0 0% 0%" : "0 0% 100%",
    "--accent": `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`,
    "--accent-foreground": accentHsl.l > 50 ? "0 0% 0%" : "0 0% 100%",
    "--ring": `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`,
  };
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Generate branded email header HTML
 */
export function generateEmailHeader(branding: BrandingConfig): string {
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.organizationName}" style="max-height: 60px; max-width: 200px;" />`
    : `<h1 style="color: ${branding.primaryColor}; margin: 0;">${branding.organizationName}</h1>`;

  return `
    <div style="background-color: ${branding.primaryColor}; padding: 20px; text-align: center;">
      ${logoHtml}
    </div>
  `;
}

/**
 * Generate branded email footer HTML
 */
export function generateEmailFooter(branding: BrandingConfig): string {
  const footerText = branding.emailFooterText || `© ${new Date().getFullYear()} ${branding.organizationName}. All rights reserved.`;

  return `
    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
      <p style="margin: 0;">${footerText}</p>
    </div>
  `;
}

/**
 * Wrap email content with branding
 */
export function wrapEmailWithBranding(
  branding: BrandingConfig,
  content: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto;">
        ${generateEmailHeader(branding)}
        <div style="padding: 30px; background-color: #ffffff;">
          ${content}
        </div>
        ${generateEmailFooter(branding)}
      </div>
    </body>
    </html>
  `;
}
