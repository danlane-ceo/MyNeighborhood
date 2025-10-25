/**
 * Migration signal analysis utilities
 * Focus on 18-34 age cohort migration patterns
 */

export interface MigrationSignal {
  netMigration: number;
  rollingAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: 'high' | 'medium' | 'low';
}

export interface MigrationDataPoint {
  year: number;
  netMigration1834: number;
}

/**
 * Calculate 3-year rolling average of net migration
 */
export function calculateRollingAverage(
  data: MigrationDataPoint[],
  currentYear: number
): number {
  const recentYears = data
    .filter(d => d.year >= currentYear - 2 && d.year <= currentYear)
    .map(d => d.netMigration1834);
  
  if (recentYears.length === 0) return 0;
  
  return recentYears.reduce((sum, val) => sum + val, 0) / recentYears.length;
}

/**
 * Analyze migration signal strength and trend
 */
export function analyzeMigrationSignal(
  data: MigrationDataPoint[],
  currentYear: number = new Date().getFullYear()
): MigrationSignal {
  const currentData = data.find(d => d.year === currentYear);
  const rollingAverage = calculateRollingAverage(data, currentYear);
  
  // Calculate trend by comparing recent 3-year average to previous 3-year average
  const recentAverage = calculateRollingAverage(data, currentYear);
  const previousAverage = calculateRollingAverage(data, currentYear - 3);
  
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (recentAverage > previousAverage + 10) {
    trend = 'increasing';
  } else if (recentAverage < previousAverage - 10) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }
  
  // Determine confidence based on data availability and consistency
  let confidence: 'high' | 'medium' | 'low';
  const dataPoints = data.filter(d => d.year >= currentYear - 4).length;
  
  if (dataPoints >= 4 && Math.abs(recentAverage - previousAverage) > 20) {
    confidence = 'high';
  } else if (dataPoints >= 3) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    netMigration: currentData?.netMigration1834 || 0,
    rollingAverage,
    trend,
    confidence
  };
}

/**
 * Generate migration signal description
 */
export function generateMigrationDescription(signal: MigrationSignal): string {
  const { rollingAverage, trend, confidence } = signal;
  
  let description = '';
  
  if (rollingAverage > 50) {
    description = 'Significant influx of young adults';
  } else if (rollingAverage > 10) {
    description = 'Moderate influx of young adults';
  } else if (rollingAverage < -50) {
    description = 'Significant outflow of young adults';
  } else if (rollingAverage < -10) {
    description = 'Moderate outflow of young adults';
  } else {
    description = 'Stable young adult population';
  }
  
  if (trend === 'increasing') {
    description += ' (trending upward)';
  } else if (trend === 'decreasing') {
    description += ' (trending downward)';
  }
  
  if (confidence === 'low') {
    description += ' (limited data)';
  }
  
  return description;
}
