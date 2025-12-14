/**
 * Currency Router
 *
 * Endpoints for currency management:
 * - List supported currencies
 * - Get/Set exchange rates
 * - Convert amounts
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  SUPPORTED_CURRENCIES,
  getCurrency,
  isSupportedCurrency,
  getExchangeRate,
  setExchangeRate,
  getCurrentRates,
  convertCurrency,
  formatCurrency,
  initializeDefaultRates,
} from "../_core/currency";

// ============================================================================
// Input Schemas
// ============================================================================

const convertInput = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  date: z.string().datetime().optional(),
});

const setRateInput = z.object({
  baseCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  rate: z.number().positive(),
  source: z.string().optional(),
});

const getRateInput = z.object({
  baseCurrency: z.string().length(3),
  targetCurrency: z.string().length(3),
  date: z.string().datetime().optional(),
});

// ============================================================================
// Router
// ============================================================================

export const currencyRouter = router({
  /**
   * List all supported currencies
   */
  list: protectedProcedure.query(() => {
    return SUPPORTED_CURRENCIES;
  }),

  /**
   * Get a specific currency by code
   */
  getByCode: protectedProcedure
    .input(z.object({ code: z.string().length(3) }))
    .query(({ input }) => {
      const currency = getCurrency(input.code);
      if (!currency) {
        throw new Error(`Currency ${input.code} not found`);
      }
      return currency;
    }),

  /**
   * Check if a currency is supported
   */
  isSupported: protectedProcedure
    .input(z.object({ code: z.string().length(3) }))
    .query(({ input }) => {
      return { supported: isSupportedCurrency(input.code) };
    }),

  /**
   * Get current exchange rate between two currencies
   */
  getRate: protectedProcedure.input(getRateInput).query(async ({ ctx, input }) => {
    const db = await ctx.getTenantDb();
    const rate = await getExchangeRate(
      db,
      input.baseCurrency,
      input.targetCurrency,
      input.date ? new Date(input.date) : undefined
    );

    if (rate === null) {
      return {
        found: false,
        rate: null,
        baseCurrency: input.baseCurrency,
        targetCurrency: input.targetCurrency,
      };
    }

    return {
      found: true,
      rate,
      baseCurrency: input.baseCurrency,
      targetCurrency: input.targetCurrency,
    };
  }),

  /**
   * Get all current exchange rates for base currency
   */
  getCurrentRates: protectedProcedure
    .input(z.object({ baseCurrency: z.string().length(3).default("EUR") }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const rates = await getCurrentRates(db, input.baseCurrency);

      return rates.map((r) => ({
        id: r.id,
        baseCurrency: r.baseCurrency,
        targetCurrency: r.targetCurrency,
        rate: Number(r.rate),
        validFrom: r.validFrom,
        source: r.source,
      }));
    }),

  /**
   * Set exchange rate (admin only)
   */
  setRate: adminProcedure.input(setRateInput).mutation(async ({ ctx, input }) => {
    const db = await ctx.getTenantDb();

    // Validate currencies
    if (!isSupportedCurrency(input.baseCurrency)) {
      throw new Error(`Base currency ${input.baseCurrency} is not supported`);
    }
    if (!isSupportedCurrency(input.targetCurrency)) {
      throw new Error(`Target currency ${input.targetCurrency} is not supported`);
    }

    const rate = await setExchangeRate(
      db,
      input.baseCurrency,
      input.targetCurrency,
      input.rate,
      input.source || "manual"
    );

    return {
      success: true,
      rate: {
        id: rate.id,
        baseCurrency: rate.baseCurrency,
        targetCurrency: rate.targetCurrency,
        rate: Number(rate.rate),
        validFrom: rate.validFrom,
        source: rate.source,
      },
    };
  }),

  /**
   * Bulk set exchange rates (admin only)
   */
  setRates: adminProcedure
    .input(
      z.object({
        baseCurrency: z.string().length(3),
        rates: z.array(
          z.object({
            targetCurrency: z.string().length(3),
            rate: z.number().positive(),
          })
        ),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const results = [];
      for (const { targetCurrency, rate } of input.rates) {
        if (isSupportedCurrency(targetCurrency)) {
          const newRate = await setExchangeRate(
            db,
            input.baseCurrency,
            targetCurrency,
            rate,
            input.source || "bulk_update"
          );
          results.push({
            targetCurrency,
            rate: Number(newRate.rate),
            success: true,
          });
        } else {
          results.push({
            targetCurrency,
            rate: 0,
            success: false,
            error: "Unsupported currency",
          });
        }
      }

      return { results };
    }),

  /**
   * Convert amount between currencies
   */
  convert: protectedProcedure.input(convertInput).query(async ({ ctx, input }) => {
    const db = await ctx.getTenantDb();

    // Validate currencies
    if (!isSupportedCurrency(input.fromCurrency)) {
      throw new Error(`Source currency ${input.fromCurrency} is not supported`);
    }
    if (!isSupportedCurrency(input.toCurrency)) {
      throw new Error(`Target currency ${input.toCurrency} is not supported`);
    }

    const result = await convertCurrency(
      db,
      input.amount,
      input.fromCurrency,
      input.toCurrency,
      input.date ? new Date(input.date) : undefined
    );

    if (!result) {
      throw new Error(
        `No exchange rate found for ${input.fromCurrency} to ${input.toCurrency}`
      );
    }

    const fromCurrency = getCurrency(input.fromCurrency);
    const toCurrency = getCurrency(input.toCurrency);

    return {
      originalAmount: input.amount,
      convertedAmount: result.amount,
      rate: result.rate,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      formattedOriginal: formatCurrency(input.amount, input.fromCurrency),
      formattedConverted: formatCurrency(result.amount, input.toCurrency),
      fromCurrencyDetails: fromCurrency,
      toCurrencyDetails: toCurrency,
    };
  }),

  /**
   * Format amount in a currency
   */
  format: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        currency: z.string().length(3),
        locale: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return {
        formatted: formatCurrency(input.amount, input.currency, input.locale),
      };
    }),

  /**
   * Initialize default exchange rates (admin only)
   */
  initializeDefaults: adminProcedure
    .input(z.object({ baseCurrency: z.string().length(3).default("EUR") }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      await initializeDefaultRates(db, input.baseCurrency);
      return { success: true, baseCurrency: input.baseCurrency };
    }),
});

export type CurrencyRouter = typeof currencyRouter;
