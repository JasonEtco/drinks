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

### Step 1: Create Azure Service Principal with Federated Identity

This setup uses OpenID Connect (OIDC) for secure authentication without storing secrets.

```bash
# Replace {subscription-id} with your Azure subscription ID
# Replace {github-username} with your GitHub username
# Replace {repo-name} with your repository name

# Create the service principal
az ad sp create-for-rbac \
  --name "drinks-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --json-auth

# Note the clientId from the output, you'll need it for the next command
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

**Important**: Save the `clientId`, `subscriptionId`, and `tenantId` - you'll need them for GitHub secrets.

Now configure federated identity credentials:

```bash
# Replace {client-id} with the clientId from above
# Replace {github-username} and {repo-name} with your values

# For main branch deployments
az ad app federated-credential create \
  --id {client-id} \
  --parameters '{
    "name": "drinks-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:{github-username}/{repo-name}:ref:refs/heads/main",
    "description": "Production deployments from main branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# For pull request deployments  
az ad app federated-credential create \
  --id {client-id} \
  --parameters '{
    "name": "drinks-pull-requests",
    "issuer": "https://token.actions.githubusercontent.com", 
    "subject": "repo:{github-username}/{repo-name}:pull_request",
    "description": "PR preview deployments",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

> **Note**: If you see an error about "environment:pr-X" in the assertion subject, it means GitHub environments are being used in the workflow. The federated identity credentials above are configured for workflows without environments, which is simpler and more flexible.

### Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these **Repository secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_CLIENT_ID` | `clientId` from Step 1 | Service principal client ID |
| `AZURE_TENANT_ID` | `tenantId` from Step 1 | Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | `subscriptionId` from Step 1 | Azure subscription ID |
| `GH_TOKEN_AI` | Your GitHub PAT | For AI features (optional) |

> **Note**: With federated identity credentials, you don't need to store the `clientSecret` in GitHub - the authentication is handled securely via OIDC tokens.

### Step 3: Deploy!

That's it! Now:

1. **Push to `main`** → Automatic production deployment
2. **Open a PR** → Automatic preview environment 
3. **Close/merge PR** → Automatic cleanup

## 🔧 Detailed Configuration

### GitHub Token for AI Features (Optional)

If you want the AI chat features to work in your deployed app:

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) with access to GitHub Models
2. Add it as the `GH_TOKEN_AI` secret in GitHub

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

### Container Image Invalid Reference Error
If you see an error like:
```
Field 'template.containers.drinks.image' is invalid with details: 'Invalid value: "ghcr.io/JasonEtco/drinks:pr-82": could not parse reference
```

This happens because Docker image names must be lowercase, but your GitHub username contains uppercase letters. The workflow has been updated to use a lowercase image name (`jasonetco/drinks` instead of `JasonEtco/drinks`).

If you continue to see this error, it means the Docker image was built with the old uppercase name. To fix this:

1. **Re-run the GitHub Actions workflow** - the latest version uses lowercase image names
2. **Check that your `IMAGE_NAME` environment variable** in the workflow is set to lowercase

### "No matching federated identity record found" Error
If you see an error mentioning `environment:pr-X` in the assertion subject:
```
No matching federated identity record found for presented assertion subject 'repo:user/repo:environment:pr-82'
```

This happens when GitHub environments are used in the workflow. You have two options:

**Option A: Remove environments from workflow (recommended)**
The workflow has been updated to not use environments for PR deployments, which simplifies the federated identity setup.

**Option B: Add specific environment credentials**
If you want to keep environments, add a credential for each possible environment pattern:
```bash
# For a specific PR (you'd need to do this for each PR number)
az ad app federated-credential create \
  --id {client-id} \
  --parameters '{
    "name": "drinks-pr-environments",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:{github-username}/{repo-name}:environment:pr-82",
    "description": "Specific PR environment",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### "No configured federated identity credentials" Error
If you see this error:
```
AADSTS70025: The client has no configured federated identity credentials
```

This means your service principal was created without federated identity credentials. You have two options:

**Option A: Add federated identity credentials (recommended)**
```bash
# Get your service principal's client ID (you should have this from Step 1)
# Replace {client-id}, {github-username}, and {repo-name} with your values

# For main branch
az ad app federated-credential create \
  --id {client-id} \
  --parameters '{
    "name": "drinks-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:{github-username}/{repo-name}:ref:refs/heads/main",
    "description": "Production deployments from main branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# For pull requests
az ad app federated-credential create \
  --id {client-id} \
  --parameters '{
    "name": "drinks-pull-requests", 
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:{github-username}/{repo-name}:pull_request",
    "description": "PR preview deployments",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

**Option B: Use client secret authentication (less secure)**
If you prefer to use client secrets, add `AZURE_CLIENT_SECRET` to your GitHub secrets and update the Azure login step in `.github/workflows/azure-deploy.yml`:

```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}
```

Where `AZURE_CREDENTIALS` is a JSON secret containing:
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret", 
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id"
}
```

### Deployment Fails
1. Check GitHub Actions logs for error details
2. Verify all GitHub secrets are set correctly
3. Ensure your Azure subscription has sufficient permissions

### App Won't Start  
1. Check container logs in Azure portal or via CLI
2. Verify environment variables in the container app
3. Test the health endpoint: `https://your-app-url/api/health`

### AI Features Not Working
1. Verify `GH_TOKEN_AI` secret is set
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
