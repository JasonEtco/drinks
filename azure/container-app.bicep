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

@description('GitHub token for AI features (optional)')
@secure()
param githubToken string = ''

@description('GitHub token for container registry access')
@secure()
param registryPassword string

@description('Chat model to use')
param chatModel string = 'openai/gpt-4o-mini'

@description('Cosmos DB account name')
param cosmosAccountName string = '${containerAppName}-cosmos'

@description('Cosmos DB database name')
param cosmosDatabaseName string = 'drinks'

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

// Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: environmentType == 'production' ? 240 : 1440
        backupRetentionIntervalInHours: environmentType == 'production' ? 168 : 24
        backupStorageRedundancy: 'Local'
      }
    }
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
      secrets: union(
        [
          {
            name: 'cosmos-connection-string'
            value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
          }
          {
            name: 'registry-password'
            value: registryPassword
          }
        ],
        githubToken != ''
          ? [
              {
                name: 'github-token'
                value: githubToken
              }
            ]
          : []
      )
      registries: [
        {
          server: 'ghcr.io'
          username: 'JasonEtco'
          passwordSecretRef: 'registry-password'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'drinks'
          image: containerImage
          env: union(
            [
              {
                name: 'NODE_ENV'
                value: 'production'
              }
              {
                name: 'PORT'
                value: '3000'
              }
              {
                name: 'CHAT_MODEL'
                value: chatModel
              }
              {
                name: 'DATABASE_URL'
                secretRef: 'cosmos-connection-string'
              }
              {
                name: 'NODE_TLS_REJECT_UNAUTHORIZED'
                value: '0'
              }
            ],
            githubToken != ''
              ? [
                  {
                    name: 'GITHUB_TOKEN'
                    secretRef: 'github-token'
                  }
                ]
              : []
          )
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
output cosmosAccountName string = cosmosAccount.name
output cosmosAccountEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosDatabaseName string = cosmosDatabaseName
