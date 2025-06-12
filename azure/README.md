# Azure Container Apps Deployment

This directory contains the infrastructure-as-code and deployment configurations for deploying the Drinks app to Azure Container Apps.

## 🏗️ Architecture

The application is deployed using Azure Container Apps with the following components:

- **Container App**: Hosts the Drinks application
- **Container App Environment**: Managed environment for the container apps
- **Log Analytics Workspace**: Centralized logging for monitoring and debugging
- **Auto-scaling**: Configurable scaling based on HTTP traffic

## 📁 Files

- `container-app.bicep` - Main Bicep template defining Azure resources
- `parameters.prod.json` - Production environment parameters
- `parameters.staging.json` - Staging environment parameters
- `deploy.sh` - Manual deployment script for local use
- `README.md` - This documentation

## 🚀 Deployment Environments

### Production
- **Environment**: `production`
- **Resource Group**: `drinks-prod-rg`
- **Replicas**: 1-10 (auto-scaling)
- **Trigger**: Automatic on push to `main` branch
- **URL**: Assigned by Azure Container Apps

### Staging
- **Environment**: `staging`
- **Resource Group**: `drinks-staging-rg`
- **Replicas**: 0-3 (auto-scaling, can scale to zero)
- **Trigger**: Manual deployment
- **URL**: Assigned by Azure Container Apps

### Pull Request Previews
- **Environment**: `pr-{number}`
- **Resource Group**: `drinks-pr-{number}-rg`
- **Replicas**: 0-1 (auto-scaling, can scale to zero)
- **Trigger**: Automatic on PR open/update
- **URL**: Unique URL per PR
- **Cleanup**: Automatic when PR is closed

## 🔧 Prerequisites

### Azure Setup
1. **Azure Subscription**: You need an active Azure subscription
2. **Service Principal**: Create a service principal for GitHub Actions authentication
3. **Resource Groups**: Will be created automatically by the deployment

### GitHub Secrets
Configure the following secrets in your GitHub repository:

#### Required Secrets
- `AZURE_CLIENT_ID` - Service principal client ID
- `AZURE_TENANT_ID` - Azure tenant ID  
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `GH_TOKEN_AI` - GitHub Personal Access Token for AI features (optional)

#### Creating a Service Principal

```bash
# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "drinks-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --json-auth

# This will output JSON with the required values for GitHub secrets
```

## 🚀 Deployment Methods

### 1. Automatic Deployment (Recommended)

The app deploys automatically using GitHub Actions:

- **Production**: Pushes to `main` branch trigger production deployment
- **PR Previews**: Opening/updating PRs trigger preview deployments
- **Cleanup**: Closing PRs automatically clean up preview environments

### 2. Manual Deployment

Use the deployment script for manual deployments:

```bash
# Deploy to production
./azure/deploy.sh production

# Deploy to staging
./azure/deploy.sh staging

# Deploy PR environment
./azure/deploy.sh pr 123
```

#### Prerequisites for Manual Deployment
```bash
# Install Azure CLI
brew install azure-cli

# Login to Azure
az login

# Set subscription (optional, uses current by default)
set -x AZURE_SUBSCRIPTION_ID "your-subscription-id"

# Set GitHub token for AI features (optional)
set -x GH_TOKEN_AI "your-github-token"
```

## 🔍 Monitoring and Troubleshooting

### View Application Logs
```bash
# Production logs
az containerapp logs show \
  --name drinks-prod \
  --resource-group drinks-prod-rg \
  --follow

# PR environment logs  
az containerapp logs show \
  --name drinks-pr-123 \
  --resource-group drinks-pr-123-rg \
  --follow
```

### Check Application Status
```bash
# Show container app details
az containerapp show \
  --name drinks-prod \
  --resource-group drinks-prod-rg

# Check revisions
az containerapp revision list \
  --name drinks-prod \
  --resource-group drinks-prod-rg
```

### Scale Application
```bash
# Update replica count
az containerapp update \
  --name drinks-prod \
  --resource-group drinks-prod-rg \
  --min-replicas 2 \
  --max-replicas 20
```

## 🔧 Configuration

### Environment Variables

The application uses these environment variables:

- `NODE_ENV=production` - Sets Node.js to production mode
- `PORT=3000` - Port the application listens on
- `GITHUB_TOKEN` - GitHub token for AI chat features (from Azure Key Vault secret)
- `CHAT_MODEL` - AI model to use (default: openai/gpt-4o-mini)

### Health Check

The application includes health checks:
- **Endpoint**: `/api/health`
- **Liveness Probe**: Checks every 30 seconds
- **Readiness Probe**: Checks every 10 seconds

### Auto-scaling

Scaling is configured based on:
- **HTTP Requests**: Scales up when concurrent requests > 50
- **Replica Limits**: 
  - Production: 1-10 replicas
  - Staging: 0-3 replicas
  - PR: 0-1 replica

## 💰 Cost Optimization

### Production
- Always-on with minimum 1 replica for reliability
- Scales up to 10 replicas under load
- Uses shared Log Analytics workspace

### Staging & PR Environments
- Can scale to zero when not in use (cost-effective)
- Limited replica count to control costs
- PR environments auto-cleanup when closed

## 🔐 Security

- Container runs as non-root user
- Secrets stored in Azure Container Apps secrets
- HTTPS enforced for external traffic
- GitHub token securely injected via secrets

## 🚨 Troubleshooting

### Common Issues

#### 1. Deployment Fails
- Check GitHub Actions logs for detailed error messages
- Verify Azure service principal permissions
- Ensure resource group doesn't have naming conflicts

#### 2. Application Won't Start
- Check container logs: `az containerapp logs show --name <app-name> --resource-group <rg-name>`
- Verify environment variables are set correctly
- Check health endpoint: `curl https://<app-url>/api/health`

#### 3. AI Features Not Working
- Verify `GH_TOKEN_AI` secret is set in GitHub
- Check that the token has access to GitHub Models
- Review application logs for AI-related errors

#### 4. Scaling Issues
- Monitor metrics in Azure portal
- Adjust scaling rules in the Bicep template
- Check resource quotas in your subscription

### Emergency Rollback

If you need to rollback a deployment:

```bash
# List revisions
az containerapp revision list --name drinks-prod --resource-group drinks-prod-rg

# Activate previous revision
az containerapp revision activate \
  --name drinks-prod \
  --resource-group drinks-prod-rg \
  --revision <previous-revision-name>
```

## 📞 Support

For deployment issues:
1. Check the GitHub Actions workflow logs
2. Review Azure Container Apps logs
3. Check this documentation for troubleshooting steps
4. Open an issue in the repository
