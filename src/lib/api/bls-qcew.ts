/**
 * Bureau of Labor Statistics (BLS) Quarterly Census of Employment and Wages (QCEW) API adapter
 * Fetches employment and wage data by industry (NAICS codes)
 */

export interface BLSQCEWResponse {
  data: Array<{
    year: string;
    qtr: string;
    area_fips: string;
    own_code: string;
    industry_code: string;
    agglvl_code: string;
    size_code: string;
    disclosure_code: string;
    area_title: string;
    own_title: string;
    industry_title: string;
    agglvl_title: string;
    size_title: string;
    qtrly_estabs: string;
    month1_emplvl: string;
    month2_emplvl: string;
    month3_emplvl: string;
    total_qtrly_wages: string;
    taxable_qtrly_wages: string;
    qtrly_contributions: string;
    avg_wkly_wage: string;
  }>;
}

export interface QCEWDataPoint {
  geoId: string;
  year: number;
  quarter: number;
  naicsCode: string;
  industryName: string;
  employment: number;
  averageWeeklyWage: number;
  totalWages: number;
}

export interface IndustryTrend {
  naicsCode: string;
  industryName: string;
  cagr: number;
  currentEmployment: number;
  trend: 'growing' | 'declining' | 'stable';
}

export interface BLSAPIConfig {
  apiKey?: string;
  baseUrl?: string;
}

const DEFAULT_CONFIG: BLSAPIConfig = {
  baseUrl: 'https://api.bls.gov/publicAPI/v2/timeseries/data'
};

/**
 * BLS QCEW API client
 */
export class BLSQCEWClient {
  private config: BLSAPIConfig;
  
  constructor(config: BLSAPIConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Fetch QCEW data for a specific area and time period
   * Note: BLS API has different endpoints, this is a simplified implementation
   */
  async fetchQCEWData(
    areaFips: string,
    startYear: number,
    endYear: number,
    naicsLevel: number = 2
  ): Promise<QCEWDataPoint[]> {
    // This is a simplified implementation
    // In practice, you'd need to use the actual BLS API endpoints
    // or download bulk data files
    
    const results: QCEWDataPoint[] = [];
    
    // Mock data for demonstration - replace with actual API calls
    const mockIndustries = [
      { code: '11', name: 'Agriculture, Forestry, Fishing and Hunting' },
      { code: '21', name: 'Mining, Quarrying, and Oil and Gas Extraction' },
      { code: '22', name: 'Utilities' },
      { code: '23', name: 'Construction' },
      { code: '31-33', name: 'Manufacturing' },
      { code: '42', name: 'Wholesale Trade' },
      { code: '44-45', name: 'Retail Trade' },
      { code: '48-49', name: 'Transportation and Warehousing' },
      { code: '51', name: 'Information' },
      { code: '52', name: 'Finance and Insurance' },
      { code: '53', name: 'Real Estate and Rental and Leasing' },
      { code: '54', name: 'Professional, Scientific, and Technical Services' },
      { code: '55', name: 'Management of Companies and Enterprises' },
      { code: '56', name: 'Administrative and Support and Waste Management' },
      { code: '61', name: 'Educational Services' },
      { code: '62', name: 'Health Care and Social Assistance' },
      { code: '71', name: 'Arts, Entertainment, and Recreation' },
      { code: '72', name: 'Accommodation and Food Services' },
      { code: '81', name: 'Other Services (except Public Administration)' },
      { code: '92', name: 'Public Administration' }
    ];
    
    for (let year = startYear; year <= endYear; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        mockIndustries.forEach(industry => {
          // Generate realistic mock data with some growth/decline patterns
          const baseEmployment = Math.floor(Math.random() * 10000) + 1000;
          const growthFactor = industry.code === '62' ? 1.05 : // Health care growing
                              industry.code === '31-33' ? 0.95 : // Manufacturing declining
                              1.0; // Others stable
          
          const employment = Math.floor(baseEmployment * Math.pow(growthFactor, year - startYear));
          const avgWeeklyWage = Math.floor(Math.random() * 500) + 800;
          
          results.push({
            geoId: `county:${areaFips}`,
            year,
            quarter,
            naicsCode: industry.code,
            industryName: industry.name,
            employment,
            averageWeeklyWage: avgWeeklyWage,
            totalWages: employment * avgWeeklyWage * 13 // Approximate quarterly wages
          });
        });
      }
    }
    
    return results;
  }
  
  /**
   * Calculate industry trends based on 5-year employment data
   */
  calculateIndustryTrends(
    data: QCEWDataPoint[],
    currentYear: number = new Date().getFullYear()
  ): IndustryTrend[] {
    const industryMap = new Map<string, QCEWDataPoint[]>();
    
    // Group data by NAICS code
    data.forEach(point => {
      if (!industryMap.has(point.naicsCode)) {
        industryMap.set(point.naicsCode, []);
      }
      industryMap.get(point.naicsCode)!.push(point);
    });
    
    const trends: IndustryTrend[] = [];
    
    industryMap.forEach((points, naicsCode) => {
      // Get annual employment data (sum quarters)
      const annualData = new Map<number, number>();
      points.forEach(point => {
        const current = annualData.get(point.year) || 0;
        annualData.set(point.year, current + point.employment);
      });
      
      const years = Array.from(annualData.keys()).sort();
      if (years.length < 2) return;
      
      const startYear = Math.max(...years.filter(y => y <= currentYear - 4));
      const endYear = Math.max(...years.filter(y => y <= currentYear));
      
      const startEmployment = annualData.get(startYear) || 0;
      const endEmployment = annualData.get(endYear) || 0;
      const yearsDiff = endYear - startYear;
      
      if (yearsDiff > 0 && startEmployment > 0) {
        const cagr = Math.pow(endEmployment / startEmployment, 1 / yearsDiff) - 1;
        
        let trend: 'growing' | 'declining' | 'stable';
        if (cagr > 0.02) trend = 'growing';
        else if (cagr < -0.02) trend = 'declining';
        else trend = 'stable';
        
        trends.push({
          naicsCode,
          industryName: points[0].industryName,
          cagr,
          currentEmployment: endEmployment,
          trend
        });
      }
    });
    
    return trends.sort((a, b) => b.cagr - a.cagr);
  }
  
  /**
   * Get top growing and declining industries
   */
  getTopIndustryTrends(trends: IndustryTrend[]): {
    topGrowing: IndustryTrend[];
    topDeclining: IndustryTrend[];
  } {
    const growing = trends.filter(t => t.trend === 'growing').slice(0, 5);
    const declining = trends.filter(t => t.trend === 'declining').slice(0, 5);
    
    return { topGrowing: growing, topDeclining: declining };
  }
}

/**
 * Create BLS QCEW client instance
 */
export function createBLSQCEWClient(apiKey?: string): BLSQCEWClient {
  return new BLSQCEWClient({ apiKey });
}
