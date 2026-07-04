/**
 * Multi-currency helpers (web) — mirrors the macOS app's Money helper.
 * Amounts are stored per record with an ISO 4217 `currency` code; these
 * helpers format them consistently. Supported set matches the native app.
 */

export const SUPPORTED_CURRENCIES: { code: string; label: string }[] = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ Dollar US" },
  { code: "GBP", label: "£ Livre sterling" },
  { code: "CHF", label: "CHF Franc suisse" },
  { code: "CAD", label: "$ Dollar canadien" },
  { code: "JPY", label: "¥ Yen" },
  { code: "AUD", label: "$ Dollar australien" },
];

const SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "C$",
  JPY: "¥",
  AUD: "A$",
};

export function getCurrencySymbol(currency?: string | null): string {
  const code = (currency || "EUR").toUpperCase();
  return SYMBOLS[code] || code;
}

/**
 * Format an amount (number or decimal string) in the given currency.
 * Uses the fr-FR locale for grouping/decimals, with the currency symbol.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency?: string | null,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const value = Number.isFinite(num as number) ? (num as number) : 0;
  const formatted = value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${getCurrencySymbol(currency)}`;
}
