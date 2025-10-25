"use client";

import { useState } from "react";
import { Search, MapPin, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  geoId: string;
  geoType: string;
  name: string;
  stateFips?: string;
  countyFips?: string;
  placeFips?: string;
  zipCode?: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const exampleLocations = [
    { name: "Louisville, KY", geoId: "place:2146000" },
    { name: "Beverly Hills, CA 90210", geoId: "zip:90210" },
    { name: "Chicago, IL 60601", geoId: "zip:60601" },
    { name: "New York, NY 10001", geoId: "zip:10001" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Neighborhood Intel
              </h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              U.S. Community Analytics
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Analyze Any U.S. Community
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Get comprehensive insights on income, demographics, industry trends, and 10-year projections 
            for any town, city, or ZIP code using verified government data.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by ZIP code, city, or county name..."
              value={searchQuery}
              onChange={handleInputChange}
              className="pl-10 h-12 text-lg"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.geoId}
                  onClick={() => window.location.href = `/geo/${result.geoId}`}
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
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Example Locations */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Try these examples:
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {exampleLocations.map((location) => (
              <Button
                key={location.geoId}
                variant="outline"
                onClick={() => window.location.href = `/geo/${location.geoId}`}
                className="hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                {location.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Income Analysis</CardTitle>
              <CardDescription>
                Per-capita and household income trends with 5-year history and projections
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Demographics</CardTitle>
              <CardDescription>
                Age distribution, migration patterns, and population growth analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Industry Trends</CardTitle>
              <CardDescription>
                Employment growth by sector with NAICS classification and CAGR analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>5-Year History</CardTitle>
              <CardDescription>
                Historical trends across income, employment, and demographic metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle>10-Year Projections</CardTitle>
              <CardDescription>
                Forecasted population, income, and age trends with confidence intervals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Search className="h-8 w-8 text-indigo-600 mb-2" />
              <CardTitle>Comprehensive Data</CardTitle>
              <CardDescription>
                Access to Census ACS, BLS, IRS, and BEA data sources for complete analysis
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Data Sources */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Powered by Official Government Data
          </h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Badge variant="outline">U.S. Census ACS</Badge>
            <Badge variant="outline">Bureau of Labor Statistics</Badge>
            <Badge variant="outline">IRS Migration Data</Badge>
            <Badge variant="outline">Bureau of Economic Analysis</Badge>
          </div>
        </div>
      </main>
    </div>
  );
}
