#!/bin/bash

# Azure Container Apps Deployment Script for Drinks App
# Usage: ./azure/deploy.sh [production|staging|pr] [pr-number]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
PR_NUMBER=""
LOCATION="eastus2"
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID}"

# Parse arguments
if [ $# -ge 1 ]; then
    ENVIRONMENT="$1"
fi

if [ $# -ge 2 ]; then
    PR_NUMBER="$2"
fi

echo -e "${BLUE}🍹 Drinks Azure Container Apps Deployment${NC}"
echo "=============================================="
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|pr)$ ]]; then
    echo -e "${RED}❌ Invalid environment. Use: production, staging, or pr${NC}"
    exit 1
fi

# Validate PR number for PR environment
if [ "$ENVIRONMENT" = "pr" ] && [ -z "$PR_NUMBER" ]; then
    echo -e "${RED}❌ PR number required for PR environment${NC}"
    echo "Usage: $0 pr <pr-number>"
    exit 1
fi

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️ Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

# Check if subscription is set
if [ -z "$SUBSCRIPTION_ID" ]; then
    SUBSCRIPTION_ID=$(az account show --query id --output tsv)
    echo -e "${YELLOW}⚠️ Using current subscription: $SUBSCRIPTION_ID${NC}"
fi

# Set subscription
az account set --subscription "$SUBSCRIPTION_ID"

# Determine resource group and parameters based on environment
case $ENVIRONMENT in
    "production")
        RESOURCE_GROUP="drinks-prod-rg"
        PARAMETERS_FILE="azure/parameters.prod.json"
        CONTAINER_IMAGE="ghcr.io/jasonetco/drinks:latest"
        ;;
    "staging")
        RESOURCE_GROUP="drinks-staging-rg"
        PARAMETERS_FILE="azure/parameters.staging.json"
        CONTAINER_IMAGE="ghcr.io/jasonetco/drinks:main"
        ;;
    "pr")
        RESOURCE_GROUP="drinks-pr-${PR_NUMBER}-rg"
        PARAMETERS_FILE=""
        CONTAINER_IMAGE="ghcr.io/jasonetco/drinks:pr-${PR_NUMBER}"
        ;;
esac

echo -e "${BLUE}📦 Deployment Configuration${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Container Image: $CONTAINER_IMAGE"
echo "  Location: $LOCATION"

# Create resource group
echo -e "${BLUE}🏗️ Creating resource group...${NC}"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

# Deploy based on environment
echo -e "${BLUE}🚀 Deploying to Azure Container Apps...${NC}"

if [ "$ENVIRONMENT" = "pr" ]; then
    # Deploy PR environment with custom parameters
    DEPLOYMENT_OUTPUT=$(az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file azure/container-app.bicep \
        --parameters containerAppName="drinks-pr-${PR_NUMBER}" \
        --parameters containerAppEnvironmentName="drinks-pr-${PR_NUMBER}-env" \
        --parameters logAnalyticsWorkspaceName="drinks-pr-${PR_NUMBER}-logs" \
        --parameters containerImage="$CONTAINER_IMAGE" \
        --parameters environmentType="pr" \
        --parameters githubToken="${GITHUB_TOKEN_AI:-}" \
        --parameters minReplicas=0 \
        --parameters maxReplicas=1 \
        --query 'properties.outputs' \
        --output json)
else
    # Deploy production/staging using parameters file
    DEPLOYMENT_OUTPUT=$(az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file azure/container-app.bicep \
        --parameters "$PARAMETERS_FILE" \
        --parameters containerImage="$CONTAINER_IMAGE" \
        --parameters githubToken="${GITHUB_TOKEN_AI:-}" \
        --query 'properties.outputs' \
        --output json)
fi

# Extract deployment outputs
if [ -n "$DEPLOYMENT_OUTPUT" ]; then
    CONTAINER_APP_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.containerAppUrl.value // empty')
    CONTAINER_APP_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.containerAppName.value // empty')
    
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Application URL:${NC}"
    echo "  $CONTAINER_APP_URL"
    echo ""
    echo -e "${BLUE}📋 Deployment Details:${NC}"
    echo "  Container App: $CONTAINER_APP_NAME"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  Environment: $ENVIRONMENT"
    echo ""
    
    # Show useful commands
    echo -e "${BLUE}🔧 Useful Commands:${NC}"
    echo "  View logs:"
    echo "    az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP"
    echo ""
    echo "  View app details:"
    echo "    az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP"
    echo ""
    echo "  Update app:"
    echo "    ./azure/deploy.sh $ENVIRONMENT${PR_NUMBER:+ $PR_NUMBER}"
    
    if [ "$ENVIRONMENT" = "pr" ]; then
        echo ""
        echo "  Clean up PR environment:"
        echo "    az group delete --name $RESOURCE_GROUP --yes"
    fi
else
    echo -e "${RED}❌ Deployment failed or no output received${NC}"
    exit 1
fi
