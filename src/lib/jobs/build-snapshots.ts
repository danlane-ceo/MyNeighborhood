/**
 * Snapshot builder job - aggregates raw data into cached KPIs
 * Runs periodically to build snapshot_cache table
 */

import { PrismaClient } from '@prisma/client';
import { calculateCAGR, classifyGrowthTrend } from '../analytics/cagr';
import { analyzeMigrationSignal } from '../analytics/migration-signal';
import { holtWintersForecast } from '../analytics/holt-winters';

const prisma = new PrismaClient();

export interface SnapshotBuilderConfig {
  asofDate?: Date;
  geoIds?: string[];
  forceRebuild?: boolean;
}

export interface SnapshotMetrics {
  geoId: string;
  asof: Date;
  incomePerCapita: number | null;
  hhIncomeMedian: number | null;
  ageMedian: number | null;
  netMigration1834: number | null;
  empGrowth5y: number | null;
  topGrowing: any[];
  topDeclining: any[];
  proj10: any;
}

/**
 * Main snapshot builder function
 */
export async function buildSnapshots(config: SnapshotBuilderConfig = {}): Promise<void> {
  const asofDate = config.asofDate || new Date();
  
  try {
    console.log(`Building snapshots for ${asofDate.toISOString().split('T')[0]}`);
    
    // Get all geo areas or specific ones
    const geoAreas = await prisma.geoArea.findMany({
      where: config.geoIds ? { geoId: { in: config.geoIds } } : {}
    });
    
    console.log(`Processing ${geoAreas.length} geographic areas`);
    
    for (const geoArea of geoAreas) {
      try {
        const snapshot = await buildSnapshotForGeo(geoArea.geoId, asofDate);
        
        if (snapshot) {
          await upsertSnapshot(snapshot);
          console.log(`✓ Built snapshot for ${geoArea.name} (${geoArea.geoId})`);
        }
      } catch (error) {
        console.error(`✗ Failed to build snapshot for ${geoArea.geoId}:`, error);
      }
    }
    
    console.log('Snapshot building completed');
  } catch (error) {
    console.error('Snapshot building failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Build snapshot for a specific geographic area
 */
async function buildSnapshotForGeo(geoId: string, asofDate: Date): Promise<SnapshotMetrics | null> {
  // Get latest income data
  const incomeData = await getLatestMetricData(geoId, 'hh_income_median', 5);
  const perCapitaData = await getLatestMetricData(geoId, 'income_per_capita', 5);
  const ageData = await getLatestMetricData(geoId, 'age_median', 5);
  const migrationData = await getMigrationData(geoId, 5);
  const employmentData = await getEmploymentTrends(geoId, 5);
  
  // Calculate projections
  const projections = await calculateProjections(geoId, {
    income: incomeData,
    age: ageData
  });
  
  // Build snapshot
  const snapshot: SnapshotMetrics = {
    geoId,
    asof: asofDate,
    incomePerCapita: perCapitaData.length > 0 ? Number(perCapitaData[perCapitaData.length - 1].value) : null,
    hhIncomeMedian: incomeData.length > 0 ? Number(incomeData[incomeData.length - 1].value) : null,
    ageMedian: ageData.length > 0 ? Number(ageData[ageData.length - 1].value) : null,
    netMigration1834: migrationData.length > 0 ? Number(migrationData[migrationData.length - 1].value) : null,
    empGrowth5y: employmentData.totalGrowth,
    topGrowing: employmentData.topGrowing,
    topDeclining: employmentData.topDeclining,
    proj10: projections
  };
  
  return snapshot;
}

/**
 * Get latest metric data for a geographic area
 */
async function getLatestMetricData(
  geoId: string, 
  metricCode: string, 
  years: number
): Promise<Array<{ period: Date; value: number }>> {
  const series = await prisma.metricSeries.findUnique({
    where: { code: metricCode }
  });
  
  if (!series) return [];
  
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years);
  
  const observations = await prisma.metricObs.findMany({
    where: {
      seriesId: series.id,
      geoId,
      period: { gte: cutoffDate }
    },
    orderBy: { period: 'asc' }
  });
  
  return observations.map((obs: any) => ({
    period: obs.period,
    value: Number(obs.value)
  }));
}

/**
 * Get migration data for analysis
 */
async function getMigrationData(geoId: string, years: number): Promise<Array<{ period: Date; value: number }>> {
  return getLatestMetricData(geoId, 'net_migration_18_34', years);
}

/**
 * Get employment trends and industry analysis
 */
async function getEmploymentTrends(geoId: string, years: number): Promise<{
  totalGrowth: number | null;
  topGrowing: any[];
  topDeclining: any[];
}> {
  // This would integrate with BLS QCEW data
  // For now, return mock data
  return {
    totalGrowth: 0.021, // 2.1% annual growth
    topGrowing: [
      { naics: '62', name: 'Health Care', cagr: 0.037 },
      { naics: '54', name: 'Professional Services', cagr: 0.025 }
    ],
    topDeclining: [
      { naics: '31-33', name: 'Manufacturing', cagr: -0.015 },
      { naics: '23', name: 'Construction', cagr: -0.008 }
    ]
  };
}

/**
 * Calculate 10-year projections
 */
async function calculateProjections(
  geoId: string, 
  data: { income: any[]; age: any[] }
): Promise<any> {
  try {
    const incomeProjection = holtWintersForecast(
      data.income.map(d => ({ period: d.period.getFullYear(), value: d.value })),
      10
    );
    
    const ageProjection = holtWintersForecast(
      data.age.map(d => ({ period: d.period.getFullYear(), value: d.value })),
      10
    );
    
    return {
      population_idx: 1.06,
      hh_income_idx: incomeProjection.forecast[incomeProjection.forecast.length - 1] / data.income[0]?.value || 1.0,
      age_median: ageProjection.forecast[ageProjection.forecast.length - 1],
      p25: { hh_income_idx: incomeProjection.confidenceBands.lower[incomeProjection.confidenceBands.lower.length - 1] / data.income[0]?.value || 1.0 },
      p75: { hh_income_idx: incomeProjection.confidenceBands.upper[incomeProjection.confidenceBands.upper.length - 1] / data.income[0]?.value || 1.0 }
    };
  } catch (error) {
    console.warn(`Failed to calculate projections for ${geoId}:`, error);
    return {
      population_idx: 1.0,
      hh_income_idx: 1.0,
      age_median: null,
      p25: { hh_income_idx: 1.0 },
      p75: { hh_income_idx: 1.0 }
    };
  }
}

/**
 * Upsert snapshot into cache table
 */
async function upsertSnapshot(snapshot: SnapshotMetrics): Promise<void> {
  await prisma.snapshotCache.upsert({
    where: {
      geoId_asof: {
        geoId: snapshot.geoId,
        asof: snapshot.asof
      }
    },
    update: {
      incomePerCapita: snapshot.incomePerCapita,
      hhIncomeMedian: snapshot.hhIncomeMedian,
      ageMedian: snapshot.ageMedian,
      netMigration1834: snapshot.netMigration1834,
      empGrowth5y: snapshot.empGrowth5y,
      topGrowing: snapshot.topGrowing,
      topDeclining: snapshot.topDeclining,
      proj10: snapshot.proj10
    },
    create: snapshot
  });
}

/**
 * CLI entry point for running snapshot builder
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: SnapshotBuilderConfig = {};
  
  if (args.includes('--force')) {
    config.forceRebuild = true;
  }
  
  if (args.includes('--geo-id')) {
    const geoIdIndex = args.indexOf('--geo-id');
    config.geoIds = [args[geoIdIndex + 1]];
  }
  
  buildSnapshots(config)
    .then(() => {
      console.log('Snapshot building completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Snapshot building failed:', error);
      process.exit(1);
    });
}
