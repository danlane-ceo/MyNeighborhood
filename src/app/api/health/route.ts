/**
 * Health check API endpoint
 * Used for monitoring and load balancer health checks
 */

import { NextRequest, NextResponse } from 'next/server';

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  database?: string;
  databaseError?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Basic health check
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Optional: Add database connectivity check
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Simple database connectivity test
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      
      healthStatus.database = 'connected';
    } catch (error) {
      healthStatus.database = 'disconnected';
      healthStatus.databaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json(healthStatus, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
