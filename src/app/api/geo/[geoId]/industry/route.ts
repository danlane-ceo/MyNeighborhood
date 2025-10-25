/**
 * Geographic industry analysis API endpoint
 * Returns employment data by NAICS sector with growth analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateCAGR } from '@/lib/analytics/cagr';

export interface IndustryData {
  naics: string;
  name: string;
  employment: number;
  avgWage: number;
  cagr: number;
  trend: 'growing' | 'declining' | 'stable';
}

export interface IndustryResponse {
  geoId: string;
  name: string;
  asof: string;
  totalEmployment: number;
  topGrowing: IndustryData[];
  topDeclining: IndustryData[];
  allIndustries: IndustryData[];
}

/**
 * GET /api/geo/[geoId]/industry
 * Get industry employment analysis with growth trends
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
    
    const limit = parseInt(searchParams.get('limit') || '10');
    const years = parseInt(searchParams.get('years') || '5');
    
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
    
    // Get latest snapshot for industry data
    const snapshot = await prisma.snapshotCache.findFirst({
      where: { geoId },
      orderBy: { asof: 'desc' }
    });
    
    if (!snapshot) {
      return NextResponse.json(
        { error: 'No industry data available' },
        { status: 404 }
      );
    }
    
    // Extract industry data from snapshot
    const topGrowing = Array.isArray(snapshot.topGrowing) ? snapshot.topGrowing : [];
    const topDeclining = Array.isArray(snapshot.topDeclining) ? snapshot.topDeclining : [];
    
    // Get employment time series for total employment
    const employmentSeries = await prisma.metricSeries.findUnique({
      where: { code: 'total_employment' }
    });
    
    let totalEmployment = 0;
    if (employmentSeries) {
      const latestEmployment = await prisma.metricObs.findFirst({
        where: {
          geoId,
          seriesId: employmentSeries.id
        },
        orderBy: { period: 'desc' }
      });
      
      if (latestEmployment) {
        totalEmployment = Number(latestEmployment.value);
      }
    }
    
    // Combine all industries
    const allIndustries: IndustryData[] = [
      ...topGrowing.map((item: any) => ({
        naics: item.naics,
        name: item.name,
        employment: 0, // Would need separate query for current employment
        avgWage: 0, // Would need separate query for wages
        cagr: item.cagr,
        trend: 'growing' as const
      })),
      ...topDeclining.map((item: any) => ({
        naics: item.naics,
        name: item.name,
        employment: 0,
        avgWage: 0,
        cagr: item.cagr,
        trend: 'declining' as const
      }))
    ];
    
    const response: IndustryResponse = {
      geoId: geoArea.geoId,
      name: geoArea.name,
      asof: snapshot.asof.toISOString().split('T')[0],
      totalEmployment,
      topGrowing: topGrowing.slice(0, limit),
      topDeclining: topDeclining.slice(0, limit),
      allIndustries
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Industry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
