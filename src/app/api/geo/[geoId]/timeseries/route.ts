/**
 * Geographic timeseries API endpoint
 * Returns historical data for specific metrics over time
 */

import { NextRequest, NextResponse } from 'next/server';

export interface TimeSeriesDataPoint {
  period: string;
  value: number;
  vintage: number;
  source: string;
}

export interface TimeSeriesResponse {
  geoId: string;
  name: string;
  metric: string;
  unit: string;
  data: TimeSeriesDataPoint[];
  totalPoints: number;
}

/**
 * GET /api/geo/[geoId]/timeseries
 * Get historical time series data for a specific metric
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ geoId: string }> }
): Promise<NextResponse> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const { geoId } = await params;
    const { searchParams } = new URL(request.url);
    
    const metric = searchParams.get('metric') || 'income_per_capita';
    const years = parseInt(searchParams.get('years') || '5');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Validate metric
    const validMetrics = [
      'income_per_capita',
      'hh_income_median', 
      'age_median',
      'net_migration_18_34',
      'total_employment'
    ];
    
    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Get geographic area info
    const geoArea = await prisma.geoArea.findUnique({
      where: { geoId }
    });
    
    if (!geoArea) {
      return NextResponse.json(
        { error: 'Geographic area not found' },
        { status: 404 }
      );
    }
    
    // Get metric series
    const metricSeries = await prisma.metricSeries.findUnique({
      where: { code: metric }
    });
    
    if (!metricSeries) {
      return NextResponse.json(
        { error: 'Metric series not found' },
        { status: 404 }
      );
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - years);
    
    // Get time series observations
    const observations = await prisma.metricObs.findMany({
      where: {
        geoId,
        seriesId: metricSeries.id,
        period: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { period: 'asc' },
      take: limit
    });
    
    // Transform data
    const data: TimeSeriesDataPoint[] = observations.map((obs: any) => ({
      period: obs.period.toISOString().split('T')[0],
      value: Number(obs.value),
      vintage: obs.vintage,
      source: metricSeries.source
    }));
    
    const response: TimeSeriesResponse = {
      geoId: geoArea.geoId,
      name: geoArea.name,
      metric: metricSeries.code,
      unit: metricSeries.unit,
      data,
      totalPoints: data.length
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Timeseries API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
