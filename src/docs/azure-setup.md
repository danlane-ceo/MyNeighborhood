# Azure Infrastructure Setup Guide

This guide provides step-by-step instructions for setting up the complete Azure infrastructure for Neighborhood Intel.

## Prerequisites

- Azure CLI installed and configured
- Azure subscription with appropriate permissions
- GitHub account for repository setup
- Docker installed locally (for testing)

## Step 1: Create Resource Group

```bash
# Create resource group in East US region
az group create \
  --name rg-neighborhood-intel-prod \
  --location eastus \
  --tags "project=neighborhood-intel" "environment=production"
```

## Step 2: Create Azure Database for PostgreSQL

```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group rg-neighborhood-intel-prod \
  --name neighborhood-intel-db \
  --location eastus \
  --admin-user postgres \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --storage-size 32 \
  --version 15

# Create database
az postgres flexible-server db create \
  --resource-group rg-neighborhood-intel-prod \
  --server-name neighborhood-intel-db \
  --database-name neighborhood_intel

# Configure firewall rules for Azure services
az postgres flexible-server firewall-rule create \
  --resource-group rg-neighborhood-intel-prod \
  --name neighborhood-intel-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Step 3: Create Azure Container Registry

```bash
# Create Container Registry
az acr create \
  --resource-group rg-neighborhood-intel-prod \
  --name neighborhoodintelacr \
  --sku Basic \
  --admin-enabled true

# Get login server and credentials
az acr show --name neighborhoodintelacr --query loginServer --output tsv
az acr credential show --name neighborhoodintelacr --query "passwords[0].value" --output tsv
```

## Step 4: Create Azure Container Apps Environment

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group rg-neighborhood-intel-prod \
  --workspace-name neighborhood-intel-logs \
  --location eastus

# Create Container Apps environment
az containerapp env create \
  --name neighborhood-intel-env \
  --resource-group rg-neighborhood-intel-prod \
  --location eastus \
  --logs-workspace-id $(az monitor log-analytics workspace show \
    --resource-group rg-neighborhood-intel-prod \
    --workspace-name neighborhood-intel-logs \
    --query customerId --output tsv)
```

## Step 5: Create Azure Storage Account

```bash
# Create storage account for CSV exports and static assets
az storage account create \
  --resource-group rg-neighborhood-intel-prod \
  --name neighborhoodintelstorage \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Create blob container for exports
az storage container create \
  --account-name neighborhoodintelstorage \
  --name exports \
  --public-access blob
```

## Step 6: Deploy Container App

```bash
# Build and push container image
az acr build --registry neighborhoodintelacr --image neighborhood-intel:latest .

# Create Container App
az containerapp create \
  --name neighborhood-intel-app \
  --resource-group rg-neighborhood-intel-prod \
  --environment neighborhood-intel-env \
  --image neighborhoodintelacr.azurecr.io/neighborhood-intel:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server neighborhoodintelacr.azurecr.io \
  --cpu 0.5 \
  --memory 1Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    DATABASE_URL="postgresql://postgres:YourSecurePassword123!@neighborhood-intel-db.postgres.database.azure.com:5432/neighborhood_intel?sslmode=require" \
    NODE_ENV="production" \
    NEXT_PUBLIC_APP_URL="https://neighborhood-intel-app.azurecontainerapps.io"
```

## Step 7: Configure Custom Domain (Optional)

```bash
# Add custom domain
az containerapp hostname add \
  --name neighborhood-intel-app \
  --resource-group rg-neighborhood-intel-prod \
  --hostname your-domain.com

# Configure SSL certificate
az containerapp hostname bind \
  --name neighborhood-intel-app \
  --resource-group rg-neighborhood-intel-prod \
  --hostname your-domain.com \
  --certificate your-certificate-id
```

## Step 8: Set Up CI/CD Pipeline

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure Container Apps

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  AZURE_CONTAINER_REGISTRY: neighborhoodintelacr.azurecr.io
  CONTAINER_NAME: neighborhood-intel
  RESOURCE_GROUP: rg-neighborhood-intel-prod
  CONTAINER_APP_NAME: neighborhood-intel-app
  CONTAINER_APP_ENVIRONMENT: neighborhood-intel-env

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Build and push image
      run: |
        az acr build --registry $AZURE_CONTAINER_REGISTRY --image $CONTAINER_NAME:${{ github.sha }} .
    
    - name: Deploy to Container Apps
      run: |
        az containerapp update \
          --name $CONTAINER_APP_NAME \
          --resource-group $RESOURCE_GROUP \
          --image $AZURE_CONTAINER_REGISTRY/$CONTAINER_NAME:${{ github.sha }}
```

## Step 9: Configure Monitoring and Alerts

```bash
# Create Application Insights
az monitor app-insights component create \
  --app neighborhood-intel-insights \
  --location eastus \
  --resource-group rg-neighborhood-intel-prod

# Create budget alert
az consumption budget create \
  --budget-name neighborhood-intel-budget \
  --resource-group rg-neighborhood-intel-prod \
  --amount 100 \
  --time-grain Monthly \
  --start-date 2024-01-01T00:00:00Z \
  --end-date 2025-12-31T23:59:59Z
```

## Step 10: Database Migration and Seeding

```bash
# Connect to the database and run migrations
az postgres flexible-server execute \
  --name neighborhood-intel-db \
  --admin-user postgres \
  --admin-password "YourSecurePassword123!" \
  --database-name neighborhood_intel \
  --file-path prisma/migrations/001_init.sql

# Run seed script
npm run db:seed
```

## Environment Variables

Create a `.env.production` file with:

```env
DATABASE_URL="postgresql://postgres:YourSecurePassword123!@neighborhood-intel-db.postgres.database.azure.com:5432/neighborhood_intel?sslmode=require"
CENSUS_API_KEY="your_census_api_key"
BLS_API_KEY="your_bls_api_key"
AZURE_CONTAINER_REGISTRY="neighborhoodintelacr.azurecr.io"
AZURE_RESOURCE_GROUP="rg-neighborhood-intel-prod"
AZURE_CONTAINER_APPS_ENVIRONMENT="neighborhood-intel-env"
NEXT_PUBLIC_APP_URL="https://neighborhood-intel-app.azurecontainerapps.io"
NODE_ENV="production"
```

## Cost Estimation

**Monthly costs (approximate):**
- Azure Database for PostgreSQL (B1ms): ~$25
- Azure Container Apps (0.5 CPU, 1Gi RAM): ~$15
- Azure Container Registry (Basic): ~$5
- Azure Storage (Standard LRS): ~$2
- Log Analytics: ~$5

**Total: ~$52/month**

## Security Considerations

1. **Database Security:**
   - Enable SSL enforcement
   - Use strong passwords
   - Restrict firewall rules
   - Enable Azure AD authentication (optional)

2. **Container Security:**
   - Use managed identity for ACR access
   - Enable vulnerability scanning
   - Regular image updates

3. **Network Security:**
   - Configure VNet integration (optional)
   - Use private endpoints for database
   - Enable DDoS protection

## Troubleshooting

### Common Issues:

1. **Database Connection Issues:**
   ```bash
   # Check firewall rules
   az postgres flexible-server firewall-rule list \
     --resource-group rg-neighborhood-intel-prod \
     --name neighborhood-intel-db
   ```

2. **Container App Not Starting:**
   ```bash
   # Check logs
   az containerapp logs show \
     --name neighborhood-intel-app \
     --resource-group rg-neighborhood-intel-prod
   ```

3. **ACR Build Failures:**
   ```bash
   # Check build logs
   az acr task logs show \
     --registry neighborhoodintelacr \
     --run-id <run-id>
   ```

## Scaling Configuration

### Horizontal Scaling:
```bash
# Update scaling rules
az containerapp update \
  --name neighborhood-intel-app \
  --resource-group rg-neighborhood-intel-prod \
  --min-replicas 2 \
  --max-replicas 10
```

### Vertical Scaling:
```bash
# Increase CPU and memory
az containerapp update \
  --name neighborhood-intel-app \
  --resource-group rg-neighborhood-intel-prod \
  --cpu 1.0 \
  --memory 2Gi
```

## Backup and Recovery

### Database Backup:
```bash
# Enable automated backups
az postgres flexible-server update \
  --resource-group rg-neighborhood-intel-prod \
  --name neighborhood-intel-db \
  --backup-retention 7
```

### Application Backup:
- Container images are stored in ACR
- Configuration stored in Azure Resource Manager
- Use Azure Backup for comprehensive backup solution

## Performance Optimization

1. **Database Optimization:**
   - Enable connection pooling
   - Configure read replicas for heavy read workloads
   - Use appropriate SKU based on usage

2. **Application Optimization:**
   - Enable CDN for static assets
   - Use Redis for caching (optional)
   - Optimize container startup time

3. **Monitoring:**
   - Set up Application Insights
   - Configure custom metrics
   - Set up alerting rules

This completes the Azure infrastructure setup for Neighborhood Intel. The application should now be accessible at the Container Apps URL and ready for production use.
