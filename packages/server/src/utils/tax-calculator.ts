/**
 * Tax Calculator Utility
 *
 * Provides robust tax calculation with support for multiple tax rates
 * and proper decimal handling to avoid floating point errors.
 */

export interface TaxCalculationResult {
  subtotal: string;      // Original amount (2 decimals)
  taxRate: string;       // Tax rate percentage (2 decimals)
  taxAmount: string;     // Calculated tax (2 decimals)
  total: string;         // subtotal + taxAmount (2 decimals)
}

/**
 * Calculate tax amount and total from subtotal and tax rate
 *
 * @param subtotal - Amount before tax (number or string)
 * @param taxRate - Tax rate percentage (e.g., 20 for 20%)
 * @returns Calculation result with all values as strings (2 decimal precision)
 *
 * @example
 * calculateTax(100, 20) // => { subtotal: "100.00", taxRate: "20.00", taxAmount: "20.00", total: "120.00" }
 * calculateTax("99.99", 10) // => { subtotal: "99.99", taxRate: "10.00", taxAmount: "10.00", total: "109.99" }
 */
export function calculateTax(
  subtotal: number | string,
  taxRate: number | string
): TaxCalculationResult {
  // Validate inputs
  const subtotalNum = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
  const taxRateNum = typeof taxRate === 'string' ? parseFloat(taxRate) : taxRate;

  if (isNaN(subtotalNum) || subtotalNum < 0) {
    throw new Error(`Invalid subtotal: ${subtotal}. Must be a positive number.`);
  }

  if (isNaN(taxRateNum) || taxRateNum < 0 || taxRateNum > 100) {
    throw new Error(`Invalid tax rate: ${taxRate}. Must be between 0 and 100.`);
  }

  // Convert to integer cents to avoid floating point errors
  const subtotalCents = Math.round(subtotalNum * 100);
  const taxRateCents = Math.round(taxRateNum * 100);

  // Calculate tax in cents
  const taxAmountCents = Math.round((subtotalCents * taxRateCents) / 10000);

  // Calculate total in cents
  const totalCents = subtotalCents + taxAmountCents;

  // Convert back to euros with 2 decimal precision
  return {
    subtotal: (subtotalCents / 100).toFixed(2),
    taxRate: (taxRateCents / 100).toFixed(2),
    taxAmount: (taxAmountCents / 100).toFixed(2),
    total: (totalCents / 100).toFixed(2),
  };
}

/**
 * Validate tax calculation result (ensures total = subtotal + taxAmount)
 *
 * @param result - Tax calculation result
 * @throws Error if calculation is invalid
 */
export function validateTaxCalculation(result: TaxCalculationResult): void {
  const subtotal = parseFloat(result.subtotal);
  const taxAmount = parseFloat(result.taxAmount);
  const total = parseFloat(result.total);

  const calculatedTotal = subtotal + taxAmount;
  const difference = Math.abs(total - calculatedTotal);

  // Allow 0.01 difference due to rounding (but should be 0 with cents arithmetic)
  if (difference > 0.01) {
    throw new Error(
      `Tax calculation invalid: subtotal (${result.subtotal}) + taxAmount (${result.taxAmount}) != total (${result.total})`
    );
  }
}

/**
 * Common French VAT rates
 */
export const FRENCH_VAT_RATES = {
  NORMAL: 20.00,        // Taux normal (most services)
  REDUCED: 10.00,       // Taux réduit (restaurants, transport)
  FURTHER_REDUCED: 5.5, // Taux super réduit (books, food)
  SUPER_REDUCED: 2.1,   // Taux particulier (medicine, press)
} as const;

/**
 * Get default tax rate for organization (from env or constant)
 */
export function getDefaultTaxRate(): number {
  const envRate = process.env.DEFAULT_TAX_RATE;
  if (envRate) {
    const rate = parseFloat(envRate);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      return rate;
    }
  }
  return FRENCH_VAT_RATES.NORMAL; // Default to 20%
}
