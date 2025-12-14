/**
 * Currency Module
 *
 * Multi-currency support for invoices and quotes.
 * Features:
 * - Supported currencies list
 * - Exchange rate management
 * - Currency conversion utilities
 * - Formatting helpers
 */

import { eq, and, desc, isNull, lte } from "drizzle-orm";
import { exchangeRates, type ExchangeRate } from "@rsm/database/tenant";
import type { TenantDb } from "@rsm/database/connection";

// ============================================================================
// Supported Currencies
// ============================================================================

export interface Currency {
  code: string; // ISO 4217
  name: string;
  symbol: string;
  decimalPlaces: number;
  locale: string; // For Intl formatting
}

/**
 * List of supported currencies
 */
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "EUR", name: "Euro", symbol: "\u20ac", decimalPlaces: 2, locale: "fr-FR" },
  { code: "USD", name: "US Dollar", symbol: "$", decimalPlaces: 2, locale: "en-US" },
  { code: "GBP", name: "British Pound", symbol: "\u00a3", decimalPlaces: 2, locale: "en-GB" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalPlaces: 2, locale: "de-CH" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", decimalPlaces: 2, locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimalPlaces: 2, locale: "en-AU" },
  { code: "JPY", name: "Japanese Yen", symbol: "\u00a5", decimalPlaces: 0, locale: "ja-JP" },
  { code: "CNY", name: "Chinese Yuan", symbol: "\u00a5", decimalPlaces: 2, locale: "zh-CN" },
  { code: "INR", name: "Indian Rupee", symbol: "\u20b9", decimalPlaces: 2, locale: "en-IN" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimalPlaces: 2, locale: "pt-BR" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", decimalPlaces: 2, locale: "es-MX" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", decimalPlaces: 2, locale: "sv-SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", decimalPlaces: 2, locale: "nb-NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", decimalPlaces: 2, locale: "da-DK" },
  { code: "PLN", name: "Polish Zloty", symbol: "z\u0142", decimalPlaces: 2, locale: "pl-PL" },
  { code: "CZK", name: "Czech Koruna", symbol: "K\u010d", decimalPlaces: 2, locale: "cs-CZ" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", decimalPlaces: 0, locale: "hu-HU" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", decimalPlaces: 2, locale: "ro-RO" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", decimalPlaces: 2, locale: "bg-BG" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", decimalPlaces: 2, locale: "hr-HR" },
];

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code.toUpperCase());
}

/**
 * Check if a currency code is supported
 */
export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code.toUpperCase());
}

// ============================================================================
// Exchange Rate Functions
// ============================================================================

/**
 * Get current exchange rate between two currencies
 */
export async function getExchangeRate(
  db: TenantDb,
  baseCurrency: string,
  targetCurrency: string,
  date?: Date
): Promise<number | null> {
  // Same currency = rate is 1
  if (baseCurrency.toUpperCase() === targetCurrency.toUpperCase()) {
    return 1;
  }

  const targetDate = date || new Date();

  // Find the most recent rate that is valid for the given date
  const [rate] = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, baseCurrency.toUpperCase()),
        eq(exchangeRates.targetCurrency, targetCurrency.toUpperCase()),
        lte(exchangeRates.validFrom, targetDate),
        // Either no validTo or validTo is in the future
        // We'll use a workaround since drizzle doesn't have OR easily
      )
    )
    .orderBy(desc(exchangeRates.validFrom))
    .limit(1);

  if (!rate) {
    return null;
  }

  // Check if rate is still valid
  if (rate.validTo && rate.validTo < targetDate) {
    return null;
  }

  return Number(rate.rate);
}

/**
 * Set exchange rate (invalidates previous rate)
 */
export async function setExchangeRate(
  db: TenantDb,
  baseCurrency: string,
  targetCurrency: string,
  rate: number,
  source: string = "manual"
): Promise<ExchangeRate> {
  const now = new Date();

  // Invalidate previous current rate
  await db
    .update(exchangeRates)
    .set({ validTo: now })
    .where(
      and(
        eq(exchangeRates.baseCurrency, baseCurrency.toUpperCase()),
        eq(exchangeRates.targetCurrency, targetCurrency.toUpperCase()),
        isNull(exchangeRates.validTo)
      )
    );

  // Insert new rate
  const [newRate] = await db
    .insert(exchangeRates)
    .values({
      baseCurrency: baseCurrency.toUpperCase(),
      targetCurrency: targetCurrency.toUpperCase(),
      rate: rate.toString(),
      validFrom: now,
      validTo: null,
      source,
    })
    .returning();

  if (!newRate) {
    throw new Error("Failed to insert exchange rate");
  }

  return newRate;
}

/**
 * Get all current exchange rates for a base currency
 */
export async function getCurrentRates(
  db: TenantDb,
  baseCurrency: string
): Promise<ExchangeRate[]> {
  return db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, baseCurrency.toUpperCase()),
        isNull(exchangeRates.validTo)
      )
    )
    .orderBy(exchangeRates.targetCurrency);
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  db: TenantDb,
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: Date
): Promise<{ amount: number; rate: number } | null> {
  const rate = await getExchangeRate(db, fromCurrency, toCurrency, date);

  if (rate === null) {
    return null;
  }

  return {
    amount: amount * rate,
    rate,
  };
}

/**
 * Convert amount with fallback to base currency
 * Useful when direct rate is not available
 */
export async function convertCurrencyWithFallback(
  db: TenantDb,
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  baseCurrency: string = "EUR",
  date?: Date
): Promise<{ amount: number; rate: number } | null> {
  // Try direct conversion first
  const direct = await convertCurrency(db, amount, fromCurrency, toCurrency, date);
  if (direct) {
    return direct;
  }

  // Try through base currency
  const fromToBase = await getExchangeRate(db, fromCurrency, baseCurrency, date);
  const baseToTarget = await getExchangeRate(db, baseCurrency, toCurrency, date);

  if (fromToBase === null || baseToTarget === null) {
    return null;
  }

  const combinedRate = fromToBase * baseToTarget;
  return {
    amount: amount * combinedRate,
    rate: combinedRate,
  };
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format amount in a currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale?: string
): string {
  const currency = getCurrency(currencyCode);
  const formatLocale = locale || currency?.locale || "en-US";

  return new Intl.NumberFormat(formatLocale, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: currency?.decimalPlaces ?? 2,
    maximumFractionDigits: currency?.decimalPlaces ?? 2,
  }).format(amount);
}

/**
 * Format amount without currency symbol
 */
export function formatAmount(
  amount: number,
  currencyCode: string,
  locale?: string
): string {
  const currency = getCurrency(currencyCode);
  const formatLocale = locale || currency?.locale || "en-US";

  return new Intl.NumberFormat(formatLocale, {
    minimumFractionDigits: currency?.decimalPlaces ?? 2,
    maximumFractionDigits: currency?.decimalPlaces ?? 2,
  }).format(amount);
}

/**
 * Parse formatted amount string to number
 */
export function parseAmount(
  formattedAmount: string,
  currencyCode: string
): number {
  const currency = getCurrency(currencyCode);

  // Remove currency symbols and thousand separators
  let cleaned = formattedAmount
    .replace(/[^\d.,\-]/g, "")
    .replace(/\s/g, "");

  // Handle different decimal separators
  // European format: 1.234,56 -> US format: 1234.56
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Has both - determine which is decimal
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma > lastDot) {
      // European format: remove dots, replace comma with dot
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: remove commas
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    // Only comma - could be decimal or thousand separator
    const parts = cleaned.split(",");
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length <= 2 && currency?.decimalPlaces !== 0) {
      // Likely decimal separator
      cleaned = cleaned.replace(",", ".");
    } else {
      // Thousand separator
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  return parseFloat(cleaned);
}

// ============================================================================
// Default Rates
// ============================================================================

/**
 * Default exchange rates (approximate, for initial setup)
 * Should be updated regularly from a real source
 */
export const DEFAULT_RATES: Record<string, number> = {
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.95,
  CAD: 1.47,
  AUD: 1.65,
  JPY: 163.50,
  CNY: 7.85,
  INR: 90.50,
  BRL: 5.35,
  MXN: 18.45,
  SEK: 11.25,
  NOK: 11.65,
  DKK: 7.46,
  PLN: 4.32,
  CZK: 25.10,
  HUF: 390.00,
  RON: 4.97,
  BGN: 1.96,
  HRK: 7.53,
};

/**
 * Initialize default exchange rates for a tenant
 */
export async function initializeDefaultRates(
  db: TenantDb,
  baseCurrency: string = "EUR"
): Promise<void> {
  for (const [targetCurrency, rate] of Object.entries(DEFAULT_RATES)) {
    if (targetCurrency !== baseCurrency) {
      const existingRate = await getExchangeRate(db, baseCurrency, targetCurrency);
      if (existingRate === null) {
        await setExchangeRate(db, baseCurrency, targetCurrency, rate, "default");
      }
    }
  }
}
