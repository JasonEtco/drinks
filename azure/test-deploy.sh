#!/bin/bash

# Test deployment script
# Usage: ./test-deploy.sh <github-token>

if [ -z "$1" ]; then
    echo "Usage: $0 <github-token>"
    echo "GitHub token is needed to pull from private container registry"
    exit 1
fi

GITHUB_TOKEN="$1"
RESOURCE_GROUP="drinks-test-rg"
LOCATION="eastus2"

echo "🚀 Testing Azure Container Apps deployment..."

# Create resource group
echo "Creating resource group: $RESOURCE_GROUP"
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION

# Deploy using Bicep template
echo "Deploying Bicep template..."
az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file container-app.bicep \
    --parameters containerAppName="drinks-test" \
    --parameters containerAppEnvironmentName="drinks-test-env" \
    --parameters logAnalyticsWorkspaceName="drinks-test-logs" \
    --parameters containerImage="ghcr.io/jasonetco/drinks:latest" \
    --parameters environmentType="staging" \
    --parameters registryPassword="$GITHUB_TOKEN" \
    --parameters cosmosAccountName="drinks-test-cosmos" \
    --parameters minReplicas=0 \
    --parameters maxReplicas=1

echo "✅ Deployment complete! Check the Azure portal for details."
echo "To clean up: az group delete --name $RESOURCE_GROUP --yes"
