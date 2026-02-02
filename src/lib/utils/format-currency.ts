/**
 * Currency formatting utilities for the application.
 * Uses Peruvian Sol (PEN) with "S/" symbol.
 */

export const CURRENCY_SYMBOL = 'S/';
export const CURRENCY_CODE = 'PEN';
export const CURRENCY_LOCALE = 'es-PE';

/**
 * Format a number as currency with no decimal places.
 * Example: 1200 -> "S/ 1,200"
 */
export function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  const sign = value < 0 ? '-' : '';
  return `${sign}${CURRENCY_SYMBOL} ${formatted}`;
}

/**
 * Format a number as currency with 2 decimal places.
 * Example: 1200.50 -> "S/ 1,200.50"
 */
export function formatCurrencyWithDecimals(value: number): string {
  const formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  const sign = value < 0 ? '-' : '';
  return `${sign}${CURRENCY_SYMBOL} ${formatted}`;
}

/**
 * Format a number with locale formatting but no currency symbol.
 * Useful when the symbol is displayed separately.
 * Example: 1200 -> "1,200"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
