# 🏗️ PRODUCTION INFRASTRUCTURE SETUP GUIDE

**Version:** 1.0  
**Date:** December 23, 2025  
**Status:** Implementation Guide

---

## Table of Contents
1. [Hosting Options Comparison](#hosting-options)
2. [AWS Deployment (Recommended)](#aws-deployment)
3. [Azure Deployment](#azure-deployment)
4. [Google Cloud Deployment](#google-cloud-deployment)
5. [DigitalOcean Deployment](#digitalocean-deployment)
6. [Heroku Deployment (Easiest)](#heroku-deployment)

---

## 🎯 Hosting Options Comparison

| Provider | Cost/Month | Scalability | Ease | Support | Recommended |
|----------|-----------|-----------|------|---------|------------|
| **AWS** | $200-500+ | Unlimited | Medium | Excellent | ⭐⭐⭐⭐⭐ |
| **Google Cloud** | $200-500+ | Unlimited | Medium | Excellent | ⭐⭐⭐⭐ |
| **Azure** | $200-500+ | Unlimited | Medium | Excellent | ⭐⭐⭐⭐ |
| **DigitalOcean** | $50-150 | Good | Easy | Good | ⭐⭐⭐⭐ |
| **Heroku** | $100-300+ | Good | Very Easy | Good | ⭐⭐⭐ |
| **Self-Hosted** | $50-100 | Limited | Hard | None | ⭐ |

---

## ☁️ AWS Deployment (Recommended)

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                       │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   CloudFront (CDN)                      │
│                  (Static Assets)                        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  S3 Bucket   │  │  ALB         │  │  CloudFront  │
│ (Frontend)   │  │ (Backend)    │  │ (API Cache)  │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                  ┌───────────────┐
                  │   ECS/Fargate  │
                  │  (Backend App) │
                  └───────────────┘
                          │
                  ┌───────────────┐
                  │  RDS MongoDB   │
                  │  (Database)    │
                  └───────────────┘
                          │
                  ┌───────────────┐
                  │  ElastiCache   │
                  │  Redis (Cache) │
                  └───────────────┘
```

### Step 1: Create AWS Account

```bash
# 1. Go to https://aws.amazon.com
# 2. Click "Create an AWS Account"
# 3. Set up billing (credit card required)
# 4. Enable MFA for root account
# 5. Create IAM user for development/deployment
# 6. Set up budget alerts
```

### Step 2: Set Up IAM User

```bash
# Create IAM policy for deployment
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*",
        "ecr:*",
        "ec2:*",
        "rds:*",
        "s3:*",
        "cloudformation:*",
        "route53:*",
        "elasticache:*"
      ],
      "Resource": "*"
    }
  ]
}

# Create access keys for CLI
aws configure
# Enter: Access Key ID
# Enter: Secret Access Key
# Enter: Default region (us-east-1)
# Enter: Default output format (json)
```

### Step 3: Backend Deployment with ECS Fargate

```bash
# Step 1: Create ECR Repository
aws ecr create-repository --repository-name transportation-mvp --region us-east-1

# Step 2: Build and Push Docker Image
docker build -t transportation-mvp:latest backend/
docker tag transportation-mvp:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/transportation-mvp:latest

# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/transportation-mvp:latest

# Step 3: Create ECS Cluster
aws ecs create-cluster --cluster-name transportation-production

# Step 4: Create Task Definition
cat > task-definition.json << 'EOF'
{
  "family": "transportation-mvp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "transportation-backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/transportation-mvp:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/transportation-mvp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Step 5: Create ECS Service
aws ecs create-service \
  --cluster transportation-production \
  --service-name transportation-api \
  --task-definition transportation-mvp:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/transportation/12345,containerName=transportation-backend,containerPort=3001"
```

### Step 4: Database with RDS MongoDB

```bash
# Create RDS MongoDB instance
aws rds create-db-instance \
  --db-instance-identifier transportation-mvp-prod \
  --db-instance-class db.t3.medium \
  --engine docdb \
  --master-username admin \
  --master-user-password 'YourSecurePassword123!' \
  --backup-retention-period 7 \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["error","general","slowquery"]' \
  --db-subnet-group-name default \
  --publicly-accessible false

# Get connection string
aws rds describe-db-instances \
  --db-instance-identifier transportation-mvp-prod \
  --query 'DBInstances[0].Endpoint'
```

### Step 5: Frontend Deployment with S3 + CloudFront

```bash
# Step 1: Create S3 bucket
aws s3 mb s3://transportation-mvp-frontend --region us-east-1

# Step 2: Build frontend
cd frontend && npm run build

# Step 3: Upload to S3
aws s3 sync dist/ s3://transportation-mvp-frontend/ --delete

# Step 4: Create CloudFront distribution
aws cloudfront create-distribution --origin-domain-name transportation-mvp-frontend.s3.amazonaws.com

# Step 5: Configure S3 bucket policy
aws s3api put-bucket-policy --bucket transportation-mvp-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::transportation-mvp-frontend/*"
    }
  ]
}'
```

### Step 6: Set Up DNS with Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Get zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --query "HostedZones[0].Id" --output text)

# Create A record for API (ALB)
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "your-alb-dns.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Create CNAME for frontend (CloudFront)
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "your-cloudfront-domain.cloudfront.net"}]
      }
    }]
  }'
```

---

## 🔷 Azure Deployment

### Architecture Overview
```
App Service (Frontend) → Azure CDN
                ↓
App Service (Backend) → Application Insights
                ↓
Cosmos DB (Database) → Backup Storage
                ↓
Redis Cache (Optional)
```

### Quick Start

```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login
az login

# 3. Create resource group
az group create --name transportation-rg --location eastus

# 4. Create App Service Plan
az appservice plan create \
  --name transportation-plan \
  --resource-group transportation-rg \
  --sku B2 \
  --is-linux

# 5. Create Web App (Backend)
az webapp create \
  --resource-group transportation-rg \
  --plan transportation-plan \
  --name transportation-api \
  --runtime "NODE|18-lts"

# 6. Deploy backend
az webapp deployment source config-zip \
  --resource-group transportation-rg \
  --name transportation-api \
  --src deployment.zip

# 7. Configure environment variables
az webapp config appsettings set \
  --name transportation-api \
  --resource-group transportation-rg \
  --settings NODE_ENV=production MONGODB_URI=$MONGODB_URI

# 8. Create Cosmos DB
az cosmosdb create \
  --name transportation-cosmosdb \
  --resource-group transportation-rg \
  --kind MongoDB \
  --default-consistency-level Session

# 9. Get connection string
az cosmosdb keys list \
  --name transportation-cosmosdb \
  --resource-group transportation-rg --type connection-strings
```

---

## 🌐 Google Cloud Deployment

### Architecture Overview
```
Cloud Run (Backend)
      ↓
Cloud SQL (PostgreSQL/MongoDB)
      ↓
Cloud Storage (Files)
      ↓
Cloud CDN (Frontend)
```

### Quick Start

```bash
# 1. Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# 2. Initialize
gcloud init

# 3. Create project
gcloud projects create transportation-mvp-prod

# 4. Build container
gcloud builds submit --tag gcr.io/transportation-mvp-prod/backend

# 5. Deploy to Cloud Run
gcloud run deploy transportation-api \
  --image gcr.io/transportation-mvp-prod/backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production,MONGODB_URI=$MONGODB_URI \
  --memory 512Mi \
  --cpu 1

# 6. Create Cloud SQL instance (MongoDB)
gcloud sql instances create transportation-db \
  --database-version POSTGRES_14 \
  --tier db-f1-micro \
  --region us-central1

# 7. Deploy frontend to Cloud Storage + CDN
gsutil -m cp -r frontend/dist/* gs://transportation-mvp-frontend/

# 8. Configure Cloud CDN
gcloud compute backend-buckets create frontend-bucket \
  --gcs-bucket-name transportation-mvp-frontend \
  --enable-cdn
```

---

## 💧 DigitalOcean Deployment (Budget-Friendly)

### Architecture Overview
```
Droplet (Backend - 4GB RAM)
          ↓
Managed Database (MongoDB)
          ↓
Spaces Storage (Files)
          ↓
App Platform (Frontend)
```

### Quick Start

```bash
# 1. Create account at https://digitalocean.com
# 2. Create Droplet (Ubuntu 20.04, 4GB RAM, $24/month)

# 3. SSH into Droplet
ssh root@your-droplet-ip

# 4. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. Install PM2
sudo npm install -g pm2

# 6. Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 7. Install Nginx
sudo apt-get install -y nginx

# 8. Clone application
git clone https://github.com/your-org/transportation-mvp.git
cd transportation-mvp/backend

# 9. Install dependencies and start
npm install
pm2 start ecosystem.config.js

# 10. Create Managed Database
# Use DigitalOcean Console to create MongoDB cluster

# 11. Deploy frontend
# Use DigitalOcean App Platform to deploy frontend repository
```

---

## 🚀 Heroku Deployment (Easiest)

### Step-by-Step

```bash
# 1. Install Heroku CLI
curl https://cli.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Create app
heroku create transportation-mvp-prod

# 4. Add MongoDB Atlas addon
heroku addons:create mongolab:sandbox

# 5. Get MongoDB URI
heroku config:get MONGODB_URI

# 6. Set environment variables
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET=your-secret \
  ENCRYPTION_MASTER_KEY=your-key

# 7. Deploy backend
git push heroku main

# 8. View logs
heroku logs --tail

# 9. Deploy frontend to Netlify instead
# Use Netlify dashboard to deploy from GitHub
```

---

## 📊 Cost Comparison (Monthly)

### Small Deployment (100-1000 users)
```
Option 1: AWS
  - ECS Fargate: $100-150
  - RDS Database: $50-100
  - ALB: $25
  - Data transfer: $0-50
  Total: $175-325

Option 2: DigitalOcean
  - Droplet: $24
  - Managed DB: $50
  - Spaces storage: $5-10
  Total: $79-84

Option 3: Heroku
  - Dyno (Eco): $12
  - MongoDB Atlas: $50-200
  Total: $62-212
```

### Medium Deployment (1000-10000 users)
```
Option 1: AWS
  - ECS Fargate (2 tasks): $300-400
  - RDS Database (db.t3.small): $150-200
  - ALB + data transfer: $100-150
  - S3 + CloudFront: $50-100
  Total: $600-850

Option 2: DigitalOcean
  - Droplets (2x 8GB): $240
  - Managed DB (25GB): $150
  - Spaces: $20-50
  Total: $410-440

Option 3: Azure
  - App Service (Standard): $200-300
  - Cosmos DB: $150-300
  Total: $350-600
```

### Large Deployment (10000+ users)
```
AWS (Recommended)
  - ECS Fargate auto-scaling
  - RDS Multi-AZ
  - CloudFront CDN
  - All monitoring & logging
  Total: $2000-5000+ (highly scalable)
```

---

## 🔒 Security Checklist for All Deployments

```
Network Security:
  [ ] VPC configured (if applicable)
  [ ] Security groups restrict access
  [ ] Database not publicly accessible
  [ ] Only necessary ports open (80, 443)
  [ ] VPN for admin access

Access Control:
  [ ] Strong passwords (20+ characters)
  [ ] SSH keys only (no password auth)
  [ ] MFA enabled for admin accounts
  [ ] IAM roles/policies minimal
  [ ] Regular access audits

Data Security:
  [ ] HTTPS/TLS enforced
  [ ] Database encryption enabled
  [ ] Backups encrypted
  [ ] Sensitive data never logged
  [ ] PII handled per GDPR/compliance

Monitoring:
  [ ] CloudTrail/equivalent logging
  [ ] Security group changes alerted
  [ ] Failed login tracking
  [ ] Rate limiting enabled
  [ ] DDoS protection (if available)

Compliance:
  [ ] Data residency requirements met
  [ ] Backup retention policy documented
  [ ] Disaster recovery plan tested
  [ ] Security certifications (if required)
```

---

## 📈 Scaling Strategy

### Horizontal Scaling (Add more servers)
```
Load increases → Add more backend instances
                → Load balancer distributes traffic
                → Database replicas handle reads
                → CDN caches static content
```

### Vertical Scaling (Bigger servers)
```
Instance type upgrade:
  t3.small → t3.medium → t3.large → t3.xlarge
  
Database upgrade:
  db.t3.small → db.t3.medium → db.t3.large
  
Monitor: CPU, Memory, Disk I/O
Trigger scaling at: 70% capacity
```

### Auto-Scaling Configuration
```
Minimum instances: 2
Maximum instances: 10
Target CPU: 70%
Target memory: 75%
Scale up: When threshold exceeded for 2 minutes
Scale down: When below threshold for 10 minutes
```

---

## 📋 Deployment Readiness Checklist

Before deploying to ANY provider:

```
Code Quality:
  [ ] Zero compilation errors
  [ ] All tests passing
  [ ] Code review approved
  [ ] Security scan clean
  [ ] Performance acceptable

Configuration:
  [ ] Environment variables set
  [ ] Secrets securely stored
  [ ] Logging configured
  [ ] Monitoring enabled
  [ ] Backups configured

Testing:
  [ ] Unit tests: 80%+ coverage
  [ ] Integration tests passing
  [ ] Load testing completed
  [ ] Security testing done
  [ ] User acceptance testing approved

Documentation:
  [ ] Deployment procedures written
  [ ] Rollback procedures documented
  [ ] Team trained
  [ ] Support contacts defined
  [ ] Incident response plan ready
```

---

**Recommendation:** Start with DigitalOcean or Heroku for quick deployment, then migrate to AWS when you have 10,000+ users or specific scaling requirements.

*Last Updated: December 23, 2025*
