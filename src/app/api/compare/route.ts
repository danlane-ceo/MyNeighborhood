/**
 * Geographic comparison API endpoint
 * Compare multiple geographic areas across specific metrics
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ComparisonMetric {
  geoId: string;
  name: string;
  value: number | null;
  unit: string;
  rank: number;
  percentile: number;
}

export interface ComparisonResponse {
  metric: string;
  unit: string;
  source: string;
  asof: string;
  totalAreas: number;
  data: ComparisonMetric[];
  summary: {
    min: number;
    max: number;
    median: number;
    mean: number;
  };
}

/**
 * POST /api/compare
 * Compare multiple geographic areas across a specific metric
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const body = await request.json();
    const { geoIds, metric = 'income_per_capita' } = body;
    
    if (!Array.isArray(geoIds) || geoIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 geographic areas required for comparison' },
        { status: 400 }
      );
    }
    
    if (geoIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 geographic areas allowed for comparison' },
        { status: 400 }
      );
    }
    
    // Validate metric
    const validMetrics = [
      'income_per_capita',
      'hh_income_median',
      'age_median',
      'net_migration_18_34',
      'emp_growth_5y'
    ];
    
    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Get metric series info
    const metricSeries = await prisma.metricSeries.findUnique({
      where: { code: metric }
    });
    
    if (!metricSeries) {
      return NextResponse.json(
        { error: 'Metric series not found' },
        { status: 404 }
      );
    }
    
    // Get geographic areas
    const geoAreas = await prisma.geoArea.findMany({
      where: { geoId: { in: geoIds } }
    });
    
    if (geoAreas.length !== geoIds.length) {
      return NextResponse.json(
        { error: 'One or more geographic areas not found' },
        { status: 404 }
      );
    }
    
    // Get latest snapshots for all areas
    const snapshots = await prisma.snapshotCache.findMany({
      where: { geoId: { in: geoIds } },
      orderBy: { asof: 'desc' }
    });
    
    // Group snapshots by geoId (get latest for each)
    const latestSnapshots = new Map();
    snapshots.forEach((snapshot: any) => {
      if (!latestSnapshots.has(snapshot.geoId)) {
        latestSnapshots.set(snapshot.geoId, snapshot);
      }
    });
    
    // Extract metric values
    const comparisonData: ComparisonMetric[] = [];
    
    geoAreas.forEach((geoArea: any) => {
      const snapshot = latestSnapshots.get(geoArea.geoId);
      let value: number | null = null;
      
      if (snapshot) {
        switch (metric) {
          case 'income_per_capita':
            value = snapshot.incomePerCapita ? Number(snapshot.incomePerCapita) : null;
            break;
          case 'hh_income_median':
            value = snapshot.hhIncomeMedian ? Number(snapshot.hhIncomeMedian) : null;
            break;
          case 'age_median':
            value = snapshot.ageMedian ? Number(snapshot.ageMedian) : null;
            break;
          case 'net_migration_18_34':
            value = snapshot.netMigration1834 ? Number(snapshot.netMigration1834) : null;
            break;
          case 'emp_growth_5y':
            value = snapshot.empGrowth5y ? Number(snapshot.empGrowth5y) : null;
            break;
        }
      }
      
      comparisonData.push({
        geoId: geoArea.geoId,
        name: geoArea.name,
        value,
        unit: metricSeries.unit,
        rank: 0, // Will be calculated below
        percentile: 0 // Will be calculated below
      });
    });
    
    // Filter out null values and sort by value
    const validData = comparisonData.filter(item => item.value !== null);
    validData.sort((a, b) => (b.value || 0) - (a.value || 0));
    
    // Calculate ranks and percentiles
    validData.forEach((item, index) => {
      item.rank = index + 1;
      item.percentile = Math.round(((validData.length - index) / validData.length) * 100);
    });
    
    // Calculate summary statistics
    const values = validData.map(item => item.value!).filter(v => v !== null);
    const summary = {
      min: Math.min(...values),
      max: Math.max(...values),
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
      mean: values.reduce((sum, val) => sum + val, 0) / values.length
    };
    
    // Get latest snapshot date
    const latestSnapshot = Array.from(latestSnapshots.values())
      .sort((a, b) => b.asof.getTime() - a.asof.getTime())[0];
    
    const response: ComparisonResponse = {
      metric: metricSeries.code,
      unit: metricSeries.unit,
      source: metricSeries.source,
      asof: latestSnapshot ? latestSnapshot.asof.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalAreas: comparisonData.length,
      data: comparisonData,
      summary
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Comparison API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
