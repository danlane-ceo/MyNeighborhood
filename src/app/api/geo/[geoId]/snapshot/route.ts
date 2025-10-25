/**
 * Geographic snapshot API endpoint
 * Returns cached KPI data for a specific geographic area
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SnapshotResponse {
  geoId: string;
  name: string;
  asof: string;
  metrics: {
    income_per_capita: {
      value: number | null;
      unit: string;
      source: string;
      year: number;
    };
    hh_income_median: {
      value: number | null;
      unit: string;
      source: string;
      year: number;
    };
    age_median: {
      value: number | null;
      unit: string;
      source: string;
      year: number;
    };
    net_migration_18_34: {
      value: number | null;
      unit: string;
      source: string;
      year: number;
    };
    industry: {
      emp_growth_5y: number | null;
      top_growing: Array<{
        naics: string;
        name: string;
        cagr: number;
      }>;
      top_declining: Array<{
        naics: string;
        name: string;
        cagr: number;
      }>;
    };
    projections_10y: {
      population: {
        value: number;
        unit: string;
      };
      hh_income_median: {
        value: number;
        unit: string;
      };
      age_median: {
        value: number;
        unit: string;
      };
    };
  };
}

/**
 * GET /api/geo/[geoId]/snapshot
 * Get current snapshot data for a geographic area
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
    const asof = searchParams.get('asof'); // Optional date filter
    
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
    
    // Get latest snapshot or specific date
    const snapshot = await prisma.snapshotCache.findFirst({
      where: {
        geoId,
        ...(asof ? { asof: new Date(asof) } : {})
      },
      orderBy: { asof: 'desc' }
    });
    
    if (!snapshot) {
      return NextResponse.json(
        { error: 'No snapshot data available' },
        { status: 404 }
      );
    }
    
    // Transform snapshot data to API response format
    const response: SnapshotResponse = {
      geoId: geoArea.geoId,
      name: geoArea.name,
      asof: snapshot.asof.toISOString().split('T')[0],
      metrics: {
        income_per_capita: {
          value: snapshot.incomePerCapita ? Number(snapshot.incomePerCapita) : null,
          unit: 'USD',
          source: 'ACS',
          year: snapshot.asof.getFullYear()
        },
        hh_income_median: {
          value: snapshot.hhIncomeMedian ? Number(snapshot.hhIncomeMedian) : null,
          unit: 'USD',
          source: 'ACS',
          year: snapshot.asof.getFullYear()
        },
        age_median: {
          value: snapshot.ageMedian ? Number(snapshot.ageMedian) : null,
          unit: 'years',
          source: 'ACS',
          year: snapshot.asof.getFullYear()
        },
        net_migration_18_34: {
          value: snapshot.netMigration1834 ? Number(snapshot.netMigration1834) : null,
          unit: 'people',
          source: 'IRS',
          year: snapshot.asof.getFullYear()
        },
        industry: {
          emp_growth_5y: snapshot.empGrowth5y ? Number(snapshot.empGrowth5y) : null,
          top_growing: Array.isArray(snapshot.topGrowing) ? snapshot.topGrowing : [],
          top_declining: Array.isArray(snapshot.topDeclining) ? snapshot.topDeclining : []
        },
        projections_10y: {
          population: {
            value: snapshot.proj10?.population_idx || 1.0,
            unit: 'x baseline (index)'
          },
          hh_income_median: {
            value: snapshot.proj10?.hh_income_idx || 1.0,
            unit: 'x baseline'
          },
          age_median: {
            value: snapshot.proj10?.age_median || null,
            unit: 'years'
          }
        }
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Snapshot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Prisma client will be garbage collected
  }
}
