/**
 * Geographic area detail page
 * Shows snapshot data for a specific geographic area
 */

import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, TrendingUp, Calendar, MapPin, Download } from 'lucide-react';

interface SnapshotResponse {
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

async function getSnapshotData(geoId: string): Promise<SnapshotResponse | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/geo/${geoId}/snapshot`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching snapshot data:', error);
    return null;
  }
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number | null): string {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number | null): string {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function GeoDetailPage({
  params,
}: {
  params: Promise<{ geoId: string }>;
}) {
  const { geoId } = await params;
  const snapshot = await getSnapshotData(geoId);

  if (!snapshot) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {snapshot.name}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {snapshot.geoId}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Data Freshness */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Data as of {new Date(snapshot.asof).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

        {/* KPI Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Income Per Capita */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Income Per Capita</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(snapshot.metrics.income_per_capita.value)}
              </div>
              <p className="text-xs text-muted-foreground">
                {snapshot.metrics.income_per_capita.source} • {snapshot.metrics.income_per_capita.year}
              </p>
            </CardContent>
          </Card>

          {/* Household Income Median */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Household Income Median</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(snapshot.metrics.hh_income_median.value)}
              </div>
              <p className="text-xs text-muted-foreground">
                {snapshot.metrics.hh_income_median.source} • {snapshot.metrics.hh_income_median.year}
              </p>
            </CardContent>
          </Card>

          {/* Median Age */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Median Age</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(snapshot.metrics.age_median.value)}
                <span className="text-sm font-normal text-muted-foreground ml-1">years</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {snapshot.metrics.age_median.source} • {snapshot.metrics.age_median.year}
              </p>
            </CardContent>
          </Card>

          {/* Net Migration 18-34 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Migration (18-34)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(snapshot.metrics.net_migration_18_34.value)}
                <span className="text-sm font-normal text-muted-foreground ml-1">people</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {snapshot.metrics.net_migration_18_34.source} • {snapshot.metrics.net_migration_18_34.year}
              </p>
            </CardContent>
          </Card>

          {/* Employment Growth */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5-Year Employment Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(snapshot.metrics.industry.emp_growth_5y)}
              </div>
              <p className="text-xs text-muted-foreground">
                Annual growth rate
              </p>
            </CardContent>
          </Card>

          {/* 10-Year Projections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">10-Year Projections</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Income:</span> {snapshot.metrics.projections_10y.hh_income_median.value.toFixed(2)}x
                </div>
                <div className="text-sm">
                  <span className="font-medium">Population:</span> {snapshot.metrics.projections_10y.population.value.toFixed(2)}x
                </div>
                <div className="text-sm">
                  <span className="font-medium">Age:</span> {formatNumber(snapshot.metrics.projections_10y.age_median.value)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Industry Analysis */}
        {(snapshot.metrics.industry.top_growing.length > 0 || snapshot.metrics.industry.top_declining.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Top Growing Industries */}
            {snapshot.metrics.industry.top_growing.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Top Growing Industries</CardTitle>
                  <CardDescription>5-year CAGR by sector</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {snapshot.metrics.industry.top_growing.slice(0, 5).map((industry, index) => (
                      <div key={industry.naics} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{industry.name}</div>
                          <div className="text-sm text-muted-foreground">{industry.naics}</div>
                        </div>
                        <Badge variant="secondary" className="text-green-600">
                          {formatPercentage(industry.cagr)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Declining Industries */}
            {snapshot.metrics.industry.top_declining.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Top Declining Industries</CardTitle>
                  <CardDescription>5-year CAGR by sector</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {snapshot.metrics.industry.top_declining.slice(0, 5).map((industry, index) => (
                      <div key={industry.naics} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{industry.name}</div>
                          <div className="text-sm text-muted-foreground">{industry.naics}</div>
                        </div>
                        <Badge variant="secondary" className="text-red-600">
                          {formatPercentage(industry.cagr)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <a href={`/geo/${geoId}/trends`}>View 5-Year Trends</a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/geo/${geoId}/projections`}>View 10-Year Projections</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/compare">Compare Areas</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
