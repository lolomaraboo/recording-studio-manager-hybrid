import { describe, it, expect } from 'vitest';
import { calculateTax, validateTaxCalculation, FRENCH_VAT_RATES, getDefaultTaxRate } from '../tax-calculator';

describe('Tax Calculator', () => {
  it('calculates tax correctly for 20% rate', () => {
    const result = calculateTax(100, 20);
    expect(result.subtotal).toBe('100.00');
    expect(result.taxRate).toBe('20.00');
    expect(result.taxAmount).toBe('20.00');
    expect(result.total).toBe('120.00');
  });

  it('calculates tax correctly for 10% rate', () => {
    const result = calculateTax(99.99, 10);
    expect(result.subtotal).toBe('99.99');
    expect(result.taxRate).toBe('10.00');
    expect(result.taxAmount).toBe('10.00');
    expect(result.total).toBe('109.99');
  });

  it('handles decimal subtotals correctly', () => {
    const result = calculateTax(123.45, 20);
    expect(result.taxAmount).toBe('24.69'); // 123.45 * 0.20 = 24.69
    expect(result.total).toBe('148.14');
  });

  it('handles string inputs', () => {
    const result = calculateTax('100.00', '20.00');
    expect(result.total).toBe('120.00');
  });

  it('throws error for negative subtotal', () => {
    expect(() => calculateTax(-10, 20)).toThrow('Invalid subtotal');
  });

  it('throws error for invalid tax rate', () => {
    expect(() => calculateTax(100, -5)).toThrow('Invalid tax rate');
    expect(() => calculateTax(100, 150)).toThrow('Invalid tax rate');
  });

  it('validates correct calculation', () => {
    const result = calculateTax(100, 20);
    expect(() => validateTaxCalculation(result)).not.toThrow();
  });

  it('detects invalid calculation', () => {
    const invalidResult = {
      subtotal: '100.00',
      taxRate: '20.00',
      taxAmount: '20.00',
      total: '125.00', // Wrong! Should be 120.00
    };
    expect(() => validateTaxCalculation(invalidResult)).toThrow('Tax calculation invalid');
  });

  it('supports all French VAT rates', () => {
    expect(FRENCH_VAT_RATES.NORMAL).toBe(20.00);
    expect(FRENCH_VAT_RATES.REDUCED).toBe(10.00);
    expect(FRENCH_VAT_RATES.FURTHER_REDUCED).toBe(5.5);
    expect(FRENCH_VAT_RATES.SUPER_REDUCED).toBe(2.1);
  });

  it('returns default tax rate', () => {
    const rate = getDefaultTaxRate();
    expect(rate).toBe(20.00); // Should default to NORMAL rate
  });
});
