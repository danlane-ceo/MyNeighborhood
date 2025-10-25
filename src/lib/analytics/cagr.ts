/**
 * Compound Annual Growth Rate (CAGR) calculation utilities
 */

export interface CAGRResult {
  cagr: number;
  years: number;
  startValue: number;
  endValue: number;
}

/**
 * Calculate Compound Annual Growth Rate
 * @param startValue Starting value
 * @param endValue Ending value  
 * @param years Number of years
 * @returns CAGR as a decimal (e.g., 0.05 for 5% growth)
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) {
    return 0;
  }
  
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

/**
 * Calculate CAGR with additional metadata
 */
export function calculateCAGRWithMetadata(
  startValue: number, 
  endValue: number, 
  years: number
): CAGRResult {
  return {
    cagr: calculateCAGR(startValue, endValue, years),
    years,
    startValue,
    endValue
  };
}

/**
 * Classify growth trend based on CAGR
 */
export function classifyGrowthTrend(cagr: number): 'growing' | 'declining' | 'stable' {
  if (cagr > 0.02) return 'growing'; // > 2% annual growth
  if (cagr < -0.02) return 'declining'; // < -2% annual decline
  return 'stable'; // -2% to +2%
}

/**
 * Format CAGR as percentage string
 */
export function formatCAGR(cagr: number): string {
  const percentage = cagr * 100;
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
}
