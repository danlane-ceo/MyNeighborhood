/**
 * Seed script for initial data population
 * Populates geo_area, metric_series, and sample metric_obs data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedGeoArea {
  geoId: string;
  geoType: string;
  name: string;
  stateFips?: string;
  countyFips?: string;
  placeFips?: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
}

interface SeedMetricSeries {
  code: string;
  unit: string;
  freq: string;
  source: string;
}

/**
 * Sample geographic areas for testing
 */
const sampleGeoAreas: SeedGeoArea[] = [
  // Louisville, KY area
  {
    geoId: 'place:2146000',
    geoType: 'place',
    name: 'Louisville, KY',
    stateFips: '21',
    placeFips: '2146000',
    lat: 38.2527,
    lng: -85.7585
  },
  {
    geoId: 'zip:40211',
    geoType: 'zip',
    name: 'Louisville, KY 40211',
    stateFips: '21',
    zipCode: '40211',
    lat: 38.2527,
    lng: -85.7585
  },
  {
    geoId: 'county:21111',
    geoType: 'county',
    name: 'Jefferson County, KY',
    stateFips: '21',
    countyFips: '111',
    lat: 38.2527,
    lng: -85.7585
  },
  // Sample ZIP codes
  {
    geoId: 'zip:10001',
    geoType: 'zip',
    name: 'New York, NY 10001',
    stateFips: '36',
    zipCode: '10001',
    lat: 40.7505,
    lng: -73.9934
  },
  {
    geoId: 'zip:90210',
    geoType: 'zip',
    name: 'Beverly Hills, CA 90210',
    stateFips: '06',
    zipCode: '90210',
    lat: 34.0901,
    lng: -118.4065
  },
  {
    geoId: 'zip:60601',
    geoType: 'zip',
    name: 'Chicago, IL 60601',
    stateFips: '17',
    zipCode: '60601',
    lat: 41.8781,
    lng: -87.6298
  }
];

/**
 * Core metric series definitions
 */
const metricSeries: SeedMetricSeries[] = [
  {
    code: 'hh_income_median',
    unit: 'USD',
    freq: 'annual',
    source: 'ACS'
  },
  {
    code: 'income_per_capita',
    unit: 'USD',
    freq: 'annual',
    source: 'ACS'
  },
  {
    code: 'age_median',
    unit: 'years',
    freq: 'annual',
    source: 'ACS'
  },
  {
    code: 'net_migration_18_34',
    unit: 'people',
    freq: 'annual',
    source: 'IRS'
  },
  {
    code: 'total_population',
    unit: 'people',
    freq: 'annual',
    source: 'ACS'
  },
  {
    code: 'emp_total',
    unit: 'people',
    freq: 'quarterly',
    source: 'BLS'
  },
  {
    code: 'emp_naics_62',
    unit: 'people',
    freq: 'quarterly',
    source: 'BLS'
  },
  {
    code: 'emp_naics_31-33',
    unit: 'people',
    freq: 'quarterly',
    source: 'BLS'
  }
];

/**
 * Generate sample time series data
 */
function generateSampleData(geoId: string, seriesId: number, years: number = 5): Array<{
  seriesId: number;
  geoId: string;
  period: Date;
  value: number;
  vintage: number;
}> {
  const data = [];
  const currentYear = new Date().getFullYear();
  
  // Base values vary by metric type
  let baseValue: number;
  let growthRate: number;
  
  switch (seriesId) {
    case 1: // hh_income_median
      baseValue = 45000 + Math.random() * 20000;
      growthRate = 0.02 + Math.random() * 0.03; // 2-5% annual growth
      break;
    case 2: // income_per_capita
      baseValue = 25000 + Math.random() * 15000;
      growthRate = 0.02 + Math.random() * 0.03;
      break;
    case 3: // age_median
      baseValue = 35 + Math.random() * 10;
      growthRate = 0.001; // Very slow aging
      break;
    case 4: // net_migration_18_34
      baseValue = Math.random() * 200 - 100; // Can be positive or negative
      growthRate = 0.1; // High volatility
      break;
    case 5: // total_population
      baseValue = 50000 + Math.random() * 100000;
      growthRate = 0.01 + Math.random() * 0.02;
      break;
    default:
      baseValue = 1000;
      growthRate = 0.02;
  }
  
  for (let i = years - 1; i >= 0; i--) {
    const year = currentYear - i;
    const value = baseValue * Math.pow(1 + growthRate, years - 1 - i);
    
    // Add some random variation
    const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
    const finalValue = Math.round(value * variation);
    
    data.push({
      seriesId,
      geoId,
      period: new Date(year, 0, 1), // January 1st
      value: finalValue,
      vintage: year
    });
  }
  
  return data;
}

/**
 * Main seed function
 */
async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.snapshotCache.deleteMany();
    await prisma.metricObs.deleteMany();
    await prisma.metricSeries.deleteMany();
    await prisma.geoArea.deleteMany();
    
    // Seed geographic areas
    console.log('📍 Seeding geographic areas...');
    for (const area of sampleGeoAreas) {
      await prisma.geoArea.create({ data: area });
    }
    console.log(`✓ Created ${sampleGeoAreas.length} geographic areas`);
    
    // Seed metric series
    console.log('📊 Seeding metric series...');
    for (const series of metricSeries) {
      await prisma.metricSeries.create({ data: series });
    }
    console.log(`✓ Created ${metricSeries.length} metric series`);
    
    // Seed sample observations
    console.log('📈 Seeding sample observations...');
    const series = await prisma.metricSeries.findMany();
    let totalObservations = 0;
    
    for (const geoArea of sampleGeoAreas) {
      for (const seriesItem of series) {
        const observations = generateSampleData(geoArea.geoId, seriesItem.id);
        
        for (const obs of observations) {
          await prisma.metricObs.create({ data: obs });
          totalObservations++;
        }
      }
    }
    
    console.log(`✓ Created ${totalObservations} observations`);
    
    // Create sample snapshots
    console.log('📸 Creating sample snapshots...');
    for (const geoArea of sampleGeoAreas) {
      const snapshot = {
        geoId: geoArea.geoId,
        asof: new Date(),
        incomePerCapita: 25000 + Math.random() * 15000,
        hhIncomeMedian: 45000 + Math.random() * 20000,
        ageMedian: 35 + Math.random() * 10,
        netMigration1834: Math.random() * 200 - 100,
        empGrowth5y: 0.01 + Math.random() * 0.04,
        topGrowing: [
          { naics: '62', name: 'Health Care', cagr: 0.037 },
          { naics: '54', name: 'Professional Services', cagr: 0.025 }
        ],
        topDeclining: [
          { naics: '31-33', name: 'Manufacturing', cagr: -0.015 },
          { naics: '23', name: 'Construction', cagr: -0.008 }
        ],
        proj10: {
          population_idx: 1.0 + Math.random() * 0.2,
          hh_income_idx: 1.1 + Math.random() * 0.3,
          age_median: 35 + Math.random() * 5,
          p25: { hh_income_idx: 1.05 },
          p75: { hh_income_idx: 1.35 }
        }
      };
      
      await prisma.snapshotCache.create({ data: snapshot });
    }
    
    console.log(`✓ Created ${sampleGeoAreas.length} snapshots`);
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed script failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
