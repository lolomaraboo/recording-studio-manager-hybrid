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

/**
 * Sum a list of records that each carry their own currency, and format the
 * result per currency (the web has no FX rates, so we don't convert). Returns a
 * compact string like "600,00 $ · 200,00 €". Empty list → "0,00 €".
 */
export function formatCurrencyTotals(
  items: Array<{ amount: number | string | null | undefined; currency?: string | null }>,
): string {
  const sums = new Map<string, number>();
  for (const it of items) {
    const code = (it.currency || "EUR").toUpperCase();
    const num = typeof it.amount === "string" ? parseFloat(it.amount) : it.amount ?? 0;
    sums.set(code, (sums.get(code) || 0) + (Number.isFinite(num as number) ? (num as number) : 0));
  }
  if (sums.size === 0) return formatCurrency(0, "EUR");
  return Array.from(sums.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([code, val]) => formatCurrency(val, code))
    .join(" · ");
}
