# Azure Container Apps Setup Guide

This guide will walk you through setting up Azure Container Apps deployment for the Drinks application, including CI/CD with GitHub Actions and per-PR preview environments.

## 🎯 What You'll Get

After completing this setup:
- ✅ **Production deployment** on every push to `main`
- ✅ **PR preview environments** for every pull request
- ✅ **Automatic cleanup** when PRs are closed
- ✅ **Auto-scaling** based on traffic
- ✅ **Centralized logging** and monitoring
- ✅ **Cost-optimized** scaling (preview environments can scale to zero)
- ✅ **Managed CosmosDB database** for persistent data storage
- ✅ **Automatic database provisioning** per environment

## 📋 Prerequisites

- Azure subscription
- GitHub repository with admin access
- Azure CLI installed locally (for manual deployments)

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Azure Service Principal

Run this command to create a service principal for GitHub Actions:

```bash
# Replace {subscription-id} with your Azure subscription ID
az ad sp create-for-rbac \
  --name "drinks-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --json-auth
```

This will output JSON like:
```json
{
  "clientId": "xxxxxxxxx",
  "clientSecret": "xxxxxxxxx", 
  "subscriptionId": "xxxxxxxxx",
  "tenantId": "xxxxxxxxx"
}
```

### Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these **Repository secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_CLIENT_ID` | `clientId` from Step 1 | Service principal client ID |
| `AZURE_TENANT_ID` | `tenantId` from Step 1 | Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | `subscriptionId` from Step 1 | Azure subscription ID |
| `GITHUB_TOKEN_AI` | Your GitHub PAT | For AI features (optional) |

> **Note**: The `GITHUB_TOKEN` secret is automatically provided by GitHub Actions and is used for pulling the private container image from GitHub Container Registry.

### Step 3: Deploy!

That's it! Now:

1. **Push to `main`** → Automatic production deployment
2. **Open a PR** → Automatic preview environment 
3. **Close/merge PR** → Automatic cleanup

## 🔧 Detailed Configuration

### GitHub Token for AI Features (Optional)

If you want the AI chat features to work in your deployed app:

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) with access to GitHub Models
2. Add it as the `GITHUB_TOKEN_AI` secret in GitHub

### Azure Resource Locations

By default, resources are deployed to `eastus2`. To change this:

1. Edit `.github/workflows/azure-deploy.yml`
2. Change the `AZURE_LOCATION` environment variable

### Cost Controls

The setup is configured for cost optimization:

- **Production**: 1-10 replicas (always-on for reliability)
- **Staging**: 0-3 replicas (can scale to zero)  
- **PR Previews**: 0-1 replica (scale to zero when not used)

## 🌐 Access Your Deployments

### Production
- **URL**: Shown in GitHub Actions deployment summary
- **Resource Group**: `drinks-prod-rg`
- **Deploys**: Automatically on push to `main`

### PR Previews  
- **URL**: Posted as comment on each PR
- **Resource Group**: `drinks-pr-{number}-rg`
- **Deploys**: Automatically on PR open/update
- **Cleanup**: Automatic on PR close

## 📊 Monitoring Your App

### GitHub Actions
- View deployment status in the **Actions** tab
- Each deployment shows the app URL in the summary

### Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for your resource groups: `drinks-prod-rg`, `drinks-pr-*-rg`  
3. Click on Container Apps to view logs, metrics, and scaling

### Command Line Monitoring
```bash
# View live logs
az containerapp logs show \
  --name drinks-prod \
  --resource-group drinks-prod-rg \
  --follow

# Check app status
az containerapp show \
  --name drinks-prod \
  --resource-group drinks-prod-rg
```

## 🚨 Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs for error details
2. Verify all GitHub secrets are set correctly
3. Ensure your Azure subscription has sufficient permissions

### App Won't Start  
1. Check container logs in Azure portal or via CLI
2. Verify environment variables in the container app
3. Test the health endpoint: `https://your-app-url/api/health`

### AI Features Not Working
1. Verify `GITHUB_TOKEN_AI` secret is set
2. Ensure the token has access to GitHub Models
3. Check application logs for AI-related errors

## 💡 Pro Tips

### Manual Deployments
For testing or manual deployments:
```bash
# Make sure you're logged in to Azure
az login

# Deploy to staging
./azure/deploy.sh staging

# Deploy a specific PR
./azure/deploy.sh pr 123
```

### Customizing Environments
Edit these files to customize your deployment:
- `azure/container-app.bicep` - Infrastructure configuration
- `azure/parameters.prod.json` - Production settings
- `azure/parameters.staging.json` - Staging settings
- `.github/workflows/azure-deploy.yml` - CI/CD pipeline

### Cost Monitoring
- Enable Azure Cost Management alerts
- PR environments automatically scale to zero when unused
- Consider setting up budgets for cost control

## 🎉 You're Done!

Your Drinks app is now set up for modern cloud deployment with:
- Production-ready hosting on Azure Container Apps
- Preview environments for every PR
- Automatic scaling and cost optimization
- Centralized logging and monitoring

Make a test PR to see your first preview environment in action!
