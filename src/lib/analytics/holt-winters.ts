/**
 * Holt-Winters exponential smoothing for projections
 * Used for 10-year population, income, and demographic forecasts
 */

export interface HoltWintersParams {
  alpha: number; // Level smoothing parameter (0-1)
  beta: number;  // Trend smoothing parameter (0-1)
}

export interface ProjectionResult {
  forecast: number[];
  confidenceBands: {
    lower: number[];
    upper: number[];
  };
  mape: number; // Mean Absolute Percentage Error
}

export interface TimeSeriesPoint {
  period: number; // Year or quarter
  value: number;
}

/**
 * Calculate Holt-Winters exponential smoothing forecast
 * Assumes no seasonality (appropriate for annual demographic data)
 */
export function holtWintersForecast(
  data: TimeSeriesPoint[],
  periods: number = 10,
  params: HoltWintersParams = { alpha: 0.3, beta: 0.1 }
): ProjectionResult {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for forecasting');
  }
  
  const values = data.map(d => d.value);
  const n = values.length;
  
  // Initialize level and trend
  let level = values[0];
  let trend = values.length > 1 ? values[1] - values[0] : 0;
  
  // Calculate smoothed values
  const smoothed: number[] = [level];
  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    level = params.alpha * values[i] + (1 - params.alpha) * (level + trend);
    trend = params.beta * (level - prevLevel) + (1 - params.beta) * trend;
    smoothed.push(level);
  }
  
  // Generate forecast
  const forecast: number[] = [];
  for (let i = 1; i <= periods; i++) {
    forecast.push(level + i * trend);
  }
  
  // Calculate MAPE for confidence assessment
  const errors = values.slice(1).map((actual, i) => 
    Math.abs((actual - smoothed[i]) / actual) * 100
  );
  const mape = errors.reduce((sum, err) => sum + err, 0) / errors.length;
  
  // Generate confidence bands (simplified approach)
  const confidenceBands = {
    lower: forecast.map(f => f * (1 - mape / 100)),
    upper: forecast.map(f => f * (1 + mape / 100))
  };
  
  return {
    forecast,
    confidenceBands,
    mape
  };
}

/**
 * Generate 10-year projections for key metrics
 */
export function generateProjections(
  incomeData: TimeSeriesPoint[],
  populationData: TimeSeriesPoint[],
  ageData: TimeSeriesPoint[]
): {
  income: ProjectionResult;
  population: ProjectionResult;
  age: ProjectionResult;
} {
  return {
    income: holtWintersForecast(incomeData, 10),
    population: holtWintersForecast(populationData, 10),
    age: holtWintersForecast(ageData, 10)
  };
}

/**
 * Format projection results for API response
 */
export function formatProjectionForAPI(
  result: ProjectionResult,
  baseYear: number
): {
  population_idx: number;
  hh_income_idx: number;
  age_median: number;
  p25: { hh_income_idx: number };
  p75: { hh_income_idx: number };
} {
  const finalYear = baseYear + 10;
  const finalForecast = result.forecast[result.forecast.length - 1];
  const finalLower = result.confidenceBands.lower[result.confidenceBands.lower.length - 1];
  const finalUpper = result.confidenceBands.upper[result.confidenceBands.upper.length - 1];
  
  return {
    population_idx: finalForecast,
    hh_income_idx: finalForecast,
    age_median: finalForecast,
    p25: { hh_income_idx: finalLower },
    p75: { hh_income_idx: finalUpper }
  };
}
