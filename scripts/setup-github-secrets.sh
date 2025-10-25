#!/bin/bash

# GitHub Secrets Setup Script for Neighborhood Intel
# This script helps set up the required secrets for Azure deployment

echo "🔐 Setting up GitHub Secrets for Neighborhood Intel Azure Deployment"
echo "=================================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"

# Get Azure subscription information
echo ""
echo "📋 Azure Configuration Required:"
echo "Please provide the following information:"

read -p "Azure Subscription ID: " AZURE_SUBSCRIPTION_ID
read -p "Azure Tenant ID: " AZURE_TENANT_ID
read -s -p "PostgreSQL Password (min 8 chars): " POSTGRES_PASSWORD
echo ""

# Validate inputs
if [ -z "$AZURE_SUBSCRIPTION_ID" ] || [ -z "$AZURE_TENANT_ID" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ All fields are required"
    exit 1
fi

if [ ${#POSTGRES_PASSWORD} -lt 8 ]; then
    echo "❌ PostgreSQL password must be at least 8 characters"
    exit 1
fi

echo ""
echo "🔧 Setting up GitHub Secrets..."

# Set Azure credentials (this will be a service principal JSON)
echo "📝 You need to create an Azure Service Principal for CI/CD:"
echo ""
echo "Run this command in Azure CLI:"
echo "az ad sp create-for-rbac --name 'neighborhood-intel-sp' --role contributor --scopes /subscriptions/$AZURE_SUBSCRIPTION_ID --sdk-auth"
echo ""
echo "Copy the JSON output and set it as AZURE_CREDENTIALS secret"
echo ""

# Set other secrets
gh secret set AZURE_SUBSCRIPTION_ID --body "$AZURE_SUBSCRIPTION_ID"
gh secret set AZURE_TENANT_ID --body "$AZURE_TENANT_ID"
gh secret set POSTGRES_PASSWORD --body "$POSTGRES_PASSWORD"

echo "✅ Basic secrets set successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Create Azure Service Principal (command above)"
echo "2. Set AZURE_CREDENTIALS secret with the JSON output"
echo "3. Run the 'Provision Azure Infrastructure and Deploy' workflow"
echo ""
echo "🚀 Once all secrets are set, you can trigger the infrastructure provisioning:"
echo "   - Go to Actions tab in GitHub"
echo "   - Select 'Provision Azure Infrastructure and Deploy'"
echo "   - Click 'Run workflow'"
echo ""
echo "💰 Estimated monthly cost: ~$52"
echo "   - PostgreSQL B1ms: ~$25"
echo "   - Container Apps: ~$15"
echo "   - Container Registry: ~$5"
echo "   - Storage: ~$2"
echo "   - Log Analytics: ~$5"
