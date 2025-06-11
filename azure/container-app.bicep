// Azure Container Apps Bicep template for Drinks app
@description('Name of the container app')
param containerAppName string = 'drinks-app'

@description('Name of the container app environment')
param containerAppEnvironmentName string = 'drinks-env'

@description('Name of the log analytics workspace')
param logAnalyticsWorkspaceName string = 'drinks-logs'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Container image name')
param containerImage string = 'ghcr.io/jasonetco/drinks:latest'

@description('Environment type (production, staging, pr)')
param environmentType string = 'production'

@description('GitHub token for AI features')
@secure()
param githubToken string = ''

@description('Chat model to use')
param chatModel string = 'openai/gpt-4o-mini'

@description('MySQL administrator login')
param mysqlAdminLogin string = 'drinks_admin'

@description('MySQL administrator password')
@secure()
param mysqlAdminPassword string

@description('MySQL database name')
param mysqlDatabaseName string = 'drinks_db'

@description('Minimum replica count')
param minReplicas int = environmentType == 'production' ? 1 : 0

@description('Maximum replica count')
param maxReplicas int = environmentType == 'production' ? 10 : 3

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// MySQL Flexible Server
resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-12-30' = {
  name: '${containerAppName}-mysql'
  location: location
  sku: {
    name: environmentType == 'production' ? 'Standard_B2s' : 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminLogin
    administratorLoginPassword: mysqlAdminPassword
    version: '8.0.21'
    storage: {
      storageSizeGB: environmentType == 'production' ? 20 : 10
      iops: environmentType == 'production' ? 360 : 180
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: environmentType == 'production' ? 7 : 1
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: null
      privateDnsZoneResourceId: null
      publicNetworkAccess: 'Enabled'
    }
  }
}

// MySQL Database
resource mysqlDatabase 'Microsoft.DBforMySQL/flexibleServers/databases@2023-12-30' = {
  parent: mysqlServer
  name: mysqlDatabaseName
  properties: {
    charset: 'utf8mb4'
    collation: 'utf8mb4_unicode_ci'
  }
}

// MySQL Firewall Rule to allow Azure services
resource mysqlFirewallRule 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-12-30' = {
  parent: mysqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Container App Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvironmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// Container App
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: [
        {
          name: 'github-token'
          value: githubToken
        }
        {
          name: 'mysql-connection-string'
          value: 'mysql://${mysqlAdminLogin}:${mysqlAdminPassword}@${mysqlServer.properties.fullyQualifiedDomainName}:3306/${mysqlDatabaseName}?ssl=true&sslmode=require'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'drinks'
          image: containerImage
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'GITHUB_TOKEN'
              secretRef: 'github-token'
            }
            {
              name: 'CHAT_MODEL'
              value: chatModel
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'mysql-connection-string'
            }
            {
              name: 'NODE_TLS_REJECT_UNAUTHORIZED'
              value: '0'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 30
              periodSeconds: 30
              timeoutSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// Outputs
output containerAppFQDN string = containerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output resourceGroupName string = resourceGroup().name
output containerAppName string = containerApp.name
output environmentName string = containerAppEnvironment.name
output mysqlServerName string = mysqlServer.name
output mysqlServerFQDN string = mysqlServer.properties.fullyQualifiedDomainName
output mysqlDatabaseName string = mysqlDatabase.name
