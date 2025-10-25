/**
 * Geographic search API endpoint
 * Provides autocomplete search across geographic areas
 */

import { NextRequest, NextResponse } from 'next/server';

export interface GeoSearchResult {
  geoId: string;
  geoType: string;
  name: string;
  stateFips?: string;
  countyFips?: string;
  placeFips?: string;
  zipCode?: string;
}

export interface SearchResponse {
  results: GeoSearchResult[];
  total: number;
  query: string;
}

/**
 * GET /api/geo/search
 * Search for geographic areas by name, ZIP code, or FIPS code
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const geoType = searchParams.get('type'); // Optional filter by type
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: query || ''
      });
    }
    
    const searchTerm = query.trim();
    
    // Build where clause for Prisma
    const whereClause: any = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { zipCode: { contains: searchTerm } },
        { geoId: { contains: searchTerm } }
      ]
    };
    
    // Add geo type filter if specified
    if (geoType) {
      whereClause.geoType = geoType;
    }
    
    // Execute search
    const results = await prisma.geoArea.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        // Prioritize exact matches
        { name: 'asc' }
      ]
    });
    
    // Transform results
    const searchResults: GeoSearchResult[] = results.map((area: any) => ({
      geoId: area.geoId,
      geoType: area.geoType,
      name: area.name,
      stateFips: area.stateFips || undefined,
      countyFips: area.countyFips || undefined,
      placeFips: area.placeFips || undefined,
      zipCode: area.zipCode || undefined
    }));
    
    // Get total count for pagination
    const total = await prisma.geoArea.count({
      where: whereClause
    });
    
    return NextResponse.json({
      results: searchResults,
      total,
      query: searchTerm
    });
    
  } catch (error) {
    console.error('Geo search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Prisma client will be garbage collected
  }
}

/**
 * POST /api/geo/search
 * Advanced search with filters and pagination
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const body = await request.json();
    const {
      query,
      geoTypes = [],
      states = [],
      limit = 10,
      offset = 0
    } = body;
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: query || ''
      });
    }
    
    const searchTerm = query.trim();
    
    // Build where clause
    const whereClause: any = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { zipCode: { contains: searchTerm } },
        { geoId: { contains: searchTerm } }
      ]
    };
    
    // Add filters
    if (geoTypes.length > 0) {
      whereClause.geoType = { in: geoTypes };
    }
    
    if (states.length > 0) {
      whereClause.stateFips = { in: states };
    }
    
    // Execute search with pagination
    const [results, total] = await Promise.all([
      prisma.geoArea.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: [
          { geoType: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.geoArea.count({ where: whereClause })
    ]);
    
    // Transform results
    const searchResults: GeoSearchResult[] = results.map((area: any) => ({
      geoId: area.geoId,
      geoType: area.geoType,
      name: area.name,
      stateFips: area.stateFips || undefined,
      countyFips: area.countyFips || undefined,
      placeFips: area.placeFips || undefined,
      zipCode: area.zipCode || undefined
    }));
    
    return NextResponse.json({
      results: searchResults,
      total,
      query: searchTerm,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
    
  } catch (error) {
    console.error('Advanced geo search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Prisma client will be garbage collected
  }
}
