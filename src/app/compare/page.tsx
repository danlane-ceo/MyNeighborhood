/**
 * Geographic comparison page
 * Compare multiple geographic areas across metrics
 */

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, TrendingUp, Plus, X } from 'lucide-react';

interface SearchResult {
  geoId: string;
  geoType: string;
  name: string;
  stateFips?: string;
  countyFips?: string;
  placeFips?: string;
  zipCode?: string;
}

interface ComparisonMetric {
  geoId: string;
  name: string;
  value: number | null;
  unit: string;
  rank: number;
  percentile: number;
}

interface ComparisonResponse {
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

export default function ComparePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<SearchResult[]>([]);
  const [selectedMetric, setSelectedMetric] = useState("income_per_capita");
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const metrics = [
    { value: "income_per_capita", label: "Income Per Capita" },
    { value: "hh_income_median", label: "Household Income Median" },
    { value: "age_median", label: "Median Age" },
    { value: "net_migration_18_34", label: "Net Migration (18-34)" },
    { value: "emp_growth_5y", label: "5-Year Employment Growth" }
  ];

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const addArea = (area: SearchResult) => {
    if (selectedAreas.length >= 10) {
      alert("Maximum 10 areas allowed for comparison");
      return;
    }
    
    if (!selectedAreas.find(a => a.geoId === area.geoId)) {
      setSelectedAreas([...selectedAreas, area]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeArea = (geoId: string) => {
    setSelectedAreas(selectedAreas.filter(area => area.geoId !== geoId));
  };

  const runComparison = async () => {
    if (selectedAreas.length < 2) {
      alert("Please select at least 2 areas to compare");
      return;
    }

    setIsComparing(true);
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          geoIds: selectedAreas.map(area => area.geoId),
          metric: selectedMetric
        })
      });

      if (!response.ok) {
        throw new Error('Comparison failed');
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (error) {
      console.error("Comparison error:", error);
      alert("Failed to run comparison");
    } finally {
      setIsComparing(false);
    }
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatValue = (value: number | null, unit: string): string => {
    if (value === null) return 'N/A';
    
    switch (unit) {
      case 'USD':
        return formatCurrency(value);
      case 'years':
        return `${formatNumber(value)} years`;
      case 'people':
        return `${formatNumber(value)} people`;
      case 'percent':
        return formatPercentage(value);
      default:
        return formatNumber(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Compare Areas
              </h1>
            </div>
            <Badge variant="secondary">
              Multi-Area Analysis
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Selection */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Select Areas to Compare</CardTitle>
              <CardDescription>
                Search and add up to 10 geographic areas for comparison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by ZIP code, city, or county name..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.geoId}
                      onClick={() => addArea(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-b-0 flex items-center space-x-3"
                    >
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {result.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.geoType.toUpperCase()} • {result.geoId}
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-blue-600 ml-auto" />
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Areas */}
              {selectedAreas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Areas ({selectedAreas.length}/10)</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAreas.map((area) => (
                      <Badge key={area.geoId} variant="secondary" className="flex items-center space-x-2">
                        <span>{area.name}</span>
                        <button
                          onClick={() => removeArea(area.geoId)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metric Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Compare by:</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compare Button */}
              <Button 
                onClick={runComparison} 
                disabled={selectedAreas.length < 2 || isComparing}
                className="w-full"
              >
                {isComparing ? "Comparing..." : `Compare ${selectedAreas.length} Areas`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Results */}
        {comparisonData && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Comparison Summary</CardTitle>
                <CardDescription>
                  {comparisonData.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
                  Data as of {new Date(comparisonData.asof).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatValue(comparisonData.summary.min, comparisonData.unit)}</div>
                    <div className="text-sm text-muted-foreground">Minimum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatValue(comparisonData.summary.max, comparisonData.unit)}</div>
                    <div className="text-sm text-muted-foreground">Maximum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatValue(comparisonData.summary.median, comparisonData.unit)}</div>
                    <div className="text-sm text-muted-foreground">Median</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatValue(comparisonData.summary.mean, comparisonData.unit)}</div>
                    <div className="text-sm text-muted-foreground">Average</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ranked Results */}
            <Card>
              <CardHeader>
                <CardTitle>Ranked Results</CardTitle>
                <CardDescription>
                  Areas ranked by {comparisonData.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonData.data
                    .filter(item => item.value !== null)
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .map((item, index) => (
                    <div key={item.geoId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {item.rank}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.geoId}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatValue(item.value, item.unit)}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.percentile}th percentile
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
