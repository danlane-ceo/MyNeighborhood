/**
 * Geographic trends page
 * Shows 5-year historical trends for a specific geographic area
 */

import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface TimeSeriesResponse {
  geoId: string;
  name: string;
  metric: string;
  unit: string;
  data: Array<{
    period: string;
    value: number;
    vintage: number;
    source: string;
  }>;
  totalPoints: number;
}

async function getTimeSeriesData(geoId: string, metric: string): Promise<TimeSeriesResponse | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/geo/${geoId}/timeseries?metric=${metric}&years=5`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching timeseries data:', error);
    return null;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function GeoTrendsPage({
  params,
}: {
  params: Promise<{ geoId: string }>;
}) {
  const { geoId } = await params;
  
  // Fetch data for all metrics
  const [incomeData, hhIncomeData, ageData, migrationData] = await Promise.all([
    getTimeSeriesData(geoId, 'income_per_capita'),
    getTimeSeriesData(geoId, 'hh_income_median'),
    getTimeSeriesData(geoId, 'age_median'),
    getTimeSeriesData(geoId, 'net_migration_18_34')
  ]);

  if (!incomeData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/geo/${geoId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Overview
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  5-Year Trends: {incomeData.name}
                </h1>
              </div>
            </div>
            <Badge variant="outline">
              {geoId}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="income" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="migration">Migration</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Income Trends */}
          <TabsContent value="income" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Per Capita Income */}
              {incomeData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span>Income Per Capita</span>
                    </CardTitle>
                    <CardDescription>
                      {incomeData.totalPoints} data points • {incomeData.data[0]?.source}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Chart placeholder */}
                      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Chart visualization coming soon</p>
                        </div>
                      </div>
                      
                      {/* Data table */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Historical Data</h4>
                        <div className="space-y-1">
                          {incomeData.data.slice(-5).map((point, index) => (
                            <div key={point.period} className="flex justify-between text-sm">
                              <span>{new Date(point.period).getFullYear()}</span>
                              <span className="font-medium">{formatCurrency(point.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Household Income Median */}
              {hhIncomeData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span>Household Income Median</span>
                    </CardTitle>
                    <CardDescription>
                      {hhIncomeData.totalPoints} data points • {hhIncomeData.data[0]?.source}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Chart placeholder */}
                      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Chart visualization coming soon</p>
                        </div>
                      </div>
                      
                      {/* Data table */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Historical Data</h4>
                        <div className="space-y-1">
                          {hhIncomeData.data.slice(-5).map((point, index) => (
                            <div key={point.period} className="flex justify-between text-sm">
                              <span>{new Date(point.period).getFullYear()}</span>
                              <span className="font-medium">{formatCurrency(point.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Demographics Trends */}
          <TabsContent value="demographics" className="space-y-6">
            {ageData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Median Age Trends</span>
                  </CardTitle>
                  <CardDescription>
                    {ageData.totalPoints} data points • {ageData.data[0]?.source}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Chart placeholder */}
                    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Chart visualization coming soon</p>
                      </div>
                    </div>
                    
                    {/* Data table */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Historical Data</h4>
                      <div className="space-y-1">
                        {ageData.data.slice(-5).map((point, index) => (
                          <div key={point.period} className="flex justify-between text-sm">
                            <span>{new Date(point.period).getFullYear()}</span>
                            <span className="font-medium">{formatNumber(point.value)} years</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Migration Trends */}
          <TabsContent value="migration" className="space-y-6">
            {migrationData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <span>Net Migration (18-34 Age Group)</span>
                  </CardTitle>
                  <CardDescription>
                    {migrationData.totalPoints} data points • {migrationData.data[0]?.source}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Chart placeholder */}
                    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Chart visualization coming soon</p>
                      </div>
                    </div>
                    
                    {/* Data table */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Historical Data</h4>
                      <div className="space-y-1">
                        {migrationData.data.slice(-5).map((point, index) => (
                          <div key={point.period} className="flex justify-between text-sm">
                            <span>{new Date(point.period).getFullYear()}</span>
                            <span className="font-medium">{formatNumber(point.value)} people</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Summary */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Summary</CardTitle>
                  <CardDescription>Key insights from 5-year data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm">
                      <strong>Data Coverage:</strong> {incomeData?.totalPoints || 0} data points across multiple metrics
                    </div>
                    <div className="text-sm">
                      <strong>Time Period:</strong> {incomeData?.data[0] ? new Date(incomeData.data[0].period).getFullYear() : 'N/A'} - {incomeData?.data[incomeData.data.length - 1] ? new Date(incomeData.data[incomeData.data.length - 1].period).getFullYear() : 'N/A'}
                    </div>
                    <div className="text-sm">
                      <strong>Data Sources:</strong> ACS, BLS, IRS
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                  <CardDescription>Explore more insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href={`/geo/${geoId}/projections`}>
                        View 10-Year Projections
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/compare">
                        Compare with Other Areas
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
