# Neighborhood Intel

A comprehensive analytics platform that evaluates U.S. towns, cities, and ZIP codes using verified economic and demographic data from government sources.

## 🎯 Purpose

Neighborhood Intel empowers users to quickly understand community growth, economic health, and population trends using publicly available datasets. Perfect for real estate investment, community planning, and demographic research.

## ✨ Key Features

- **Income Analysis**: Per-capita and household income trends with 5-year history
- **Demographics**: Age distribution, migration patterns, and population growth
- **Industry Trends**: Employment growth by sector with NAICS classification
- **5-Year History**: Historical trends across all key metrics
- **10-Year Projections**: Forecasted population, income, and age trends
- **Comprehensive Data**: Census ACS, BLS, IRS, and BEA data sources

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+
- Docker (optional, for containerized development)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd neighborhood-intel
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and API keys
   ```

3. **Set up the database:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Development

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:push

# Seed sample data
docker-compose exec app npm run db:seed
```

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15 + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL with Prisma migrations
- **Analytics**: Custom CAGR, Holt-Winters forecasting, migration signal analysis
- **Deployment**: Azure Container Apps + Azure Database for PostgreSQL

### Data Sources

- **U.S. Census ACS**: Income, age, household data, educational attainment
- **Bureau of Labor Statistics**: Employment, wages, industry composition
- **Internal Revenue Service**: Migration data by age group
- **Bureau of Economic Analysis**: Regional personal income growth

### Database Schema

- `geo_area`: Geographic identifiers (ZIP, county, place, etc.)
- `metric_series`: Metric definitions and metadata
- `metric_obs`: Time-series observations with vintage stamps
- `snapshot_cache`: Aggregated KPIs for fast API responses

## 📊 API Endpoints

### Geographic Search
```
GET /api/geo/search?q=louisville&limit=10
POST /api/geo/search (advanced search with filters)
```

### Snapshot Data
```
GET /api/geo/{geoId}/snapshot
GET /api/geo/{geoId}/snapshot?asof=2024-01-01
```

### Time Series
```
GET /api/geo/{geoId}/timeseries?metric=hh_income_median&years=5
```

### Industry Analysis
```
GET /api/geo/{geoId}/industry?depth=2
```

### Comparison Tool
```
GET /api/compare?geo_ids=zip:40211,place:2146000&metric=income_per_capita
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
```

### Adding New Metrics

1. Add metric definition to `metric_series` table
2. Create API adapter in `/lib/api/`
3. Update snapshot builder in `/lib/jobs/build-snapshots.ts`
4. Add frontend visualization components

### Data Ingestion

The platform uses a hybrid approach:
- **Seed Scripts**: One-time backfill for historical data
- **Refresh API**: Manual data refresh endpoint
- **Background Jobs**: Automated ingestion (Phase 3)

## 🚀 Deployment

### Azure Container Apps

See [Azure Setup Guide](src/docs/azure-setup.md) for complete infrastructure setup.

Quick deployment:
```bash
# Build and push container
az acr build --registry <acr-name> --image neighborhood-intel:latest .

# Deploy to Container Apps
az containerapp create \
  --name neighborhood-intel-app \
  --resource-group rg-neighborhood-intel-prod \
  --environment neighborhood-intel-env \
  --image <acr-name>.azurecr.io/neighborhood-intel:latest
```

### Environment Variables

Required for production:
- `DATABASE_URL`: PostgreSQL connection string
- `CENSUS_API_KEY`: U.S. Census API key (optional)
- `BLS_API_KEY`: Bureau of Labor Statistics API key (optional)
- `NEXT_PUBLIC_APP_URL`: Public application URL

## 📈 Analytics & Projections

### CAGR Calculation
Compound Annual Growth Rate for employment and income trends:
```typescript
cagr = (endValue / startValue)^(1/years) - 1
```

### Migration Signal Analysis
3-year rolling average of 18-34 age cohort migration:
- Positive trend = "more young people moving in"
- Negative trend = "young people moving out"

### Holt-Winters Forecasting
Exponential smoothing for 10-year projections:
- Population growth index
- Income growth index  
- Age median trends
- Confidence bands (P25/P50/P75)

## 🎨 UI Components

Built with shadcn/ui and custom components:
- `<GeoSearchCombobox />`: Autocomplete search
- `<KPICard />`: Metric display with trends
- `<TimeSeriesChart />`: Recharts integration
- `<ProjectionChart />`: Forecast visualization
- `<IndustryTable />`: NAICS breakdown

## 📚 Documentation

- [Azure Setup Guide](src/docs/azure-setup.md) - Complete infrastructure setup
- [API Documentation](src/docs/api.md) - Endpoint specifications
- [Development Guide](src/docs/development.md) - Local setup and workflows
- [User Guide](src/docs/user-guide.md) - How to use the platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- U.S. Census Bureau for ACS data
- Bureau of Labor Statistics for employment data
- Internal Revenue Service for migration data
- Bureau of Economic Analysis for regional data
- shadcn/ui for beautiful components
- Next.js team for the amazing framework

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**Neighborhood Intel** - Making community data accessible and actionable.