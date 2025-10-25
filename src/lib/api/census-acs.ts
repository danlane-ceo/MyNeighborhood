/**
 * U.S. Census American Community Survey (ACS) API adapter
 * Fetches demographic and economic data for geographic areas
 */

export interface CensusACSResponse {
  data: Array<Array<string>>;
  variables: Record<string, { label: string; concept: string }>;
}

export interface ACSDataPoint {
  geoId: string;
  year: number;
  perCapitaIncome: number | null;
  medianHouseholdIncome: number | null;
  medianAge: number | null;
  totalPopulation: number | null;
}

export interface CensusAPIConfig {
  apiKey?: string;
  baseUrl?: string;
}

const DEFAULT_CONFIG: CensusAPIConfig = {
  baseUrl: 'https://api.census.gov/data'
};

/**
 * Census ACS API client
 */
export class CensusACSClient {
  private config: CensusAPIConfig;
  
  constructor(config: CensusAPIConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Fetch ACS 1-year estimates for a specific year and geography
   */
  async fetchACS1Year(
    year: number,
    geography: string,
    variables: string[],
    geoIds: string[]
  ): Promise<CensusACSResponse> {
    const url = new URL(`${this.config.baseUrl}/${year}/acs/acs1`);
    
    // Add variables
    url.searchParams.set('get', variables.join(','));
    
    // Add geography filter
    url.searchParams.set('for', geography);
    url.searchParams.set('in', 'state:*');
    
    // Add API key if available
    if (this.config.apiKey) {
      url.searchParams.set('key', this.config.apiKey);
    }
    
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Census API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        data,
        variables: this.parseVariableLabels(data[0])
      };
    } catch (error) {
      console.error('Error fetching Census ACS data:', error);
      throw error;
    }
  }
  
  /**
   * Parse variable labels from Census API response
   */
  private parseVariableLabels(headerRow: string[]): Record<string, { label: string; concept: string }> {
    const variables: Record<string, { label: string; concept: string }> = {};
    
    // This is a simplified parser - in practice, you'd need to fetch variable definitions
    headerRow.forEach((header, index) => {
      if (header.startsWith('B')) {
        variables[header] = {
          label: header,
          concept: 'Demographic/Economic Variable'
        };
      }
    });
    
    return variables;
  }
  
  /**
   * Extract key metrics from ACS response
   */
  extractMetrics(response: CensusACSResponse, geoIds: string[]): ACSDataPoint[] {
    const [header, ...rows] = response.data;
    const results: ACSDataPoint[] = [];
    
    // Find column indices
    const geoIdIndex = header.indexOf('GEO_ID');
    const perCapitaIndex = header.indexOf('B19301_001E'); // Per capita income
    const medianHHIndex = header.indexOf('B19013_001E'); // Median household income
    const medianAgeIndex = header.indexOf('B01002_001E'); // Median age
    const totalPopIndex = header.indexOf('B01003_001E'); // Total population
    
    rows.forEach(row => {
      const geoId = row[geoIdIndex];
      
      // Only process requested geo IDs
      if (geoIds.includes(geoId)) {
        results.push({
          geoId,
          year: new Date().getFullYear() - 1, // ACS data is typically 1 year behind
          perCapitaIncome: perCapitaIndex >= 0 ? this.parseNumericValue(row[perCapitaIndex]) : null,
          medianHouseholdIncome: medianHHIndex >= 0 ? this.parseNumericValue(row[medianHHIndex]) : null,
          medianAge: medianAgeIndex >= 0 ? this.parseNumericValue(row[medianAgeIndex]) : null,
          totalPopulation: totalPopIndex >= 0 ? this.parseNumericValue(row[totalPopIndex]) : null
        });
      }
    });
    
    return results;
  }
  
  /**
   * Parse numeric value from Census API response
   */
  private parseNumericValue(value: string): number | null {
    if (!value || value === 'null' || value === '-666666666') {
      return null;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  
  /**
   * Fetch data for multiple years (backfill)
   */
  async fetchMultiYearData(
    years: number[],
    geography: string,
    geoIds: string[]
  ): Promise<ACSDataPoint[]> {
    const allData: ACSDataPoint[] = [];
    
    const variables = [
      'GEO_ID',
      'B19301_001E', // Per capita income
      'B19013_001E', // Median household income
      'B01002_001E', // Median age
      'B01003_001E'  // Total population
    ];
    
    for (const year of years) {
      try {
        const response = await this.fetchACS1Year(year, geography, variables, geoIds);
        const yearData = this.extractMetrics(response, geoIds);
        allData.push(...yearData);
        
        // Rate limiting - Census API has limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to fetch ACS data for year ${year}:`, error);
      }
    }
    
    return allData;
  }
}

/**
 * Create Census ACS client instance
 */
export function createCensusACSClient(apiKey?: string): CensusACSClient {
  return new CensusACSClient({ apiKey });
}
