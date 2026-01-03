# ECS-S3 E-commerce Application

Full-stack e-commerce application with microservices architecture.

## Quick Start

1. **Start services**:
   ```bash
   docker compose up -d --build
   ```

2. **Access the application**:
   - Frontend: http://localhost:5173
   - API Gateway: http://localhost:8080
   - DynamoDB Admin: http://localhost:8001
   - Redis Commander: http://localhost:8081

3. **Stop services**:
   ```bash
   docker compose down
   ```

## Environment Variables

Create a `.env` file in the root directory:

```bash
REDIS_AUTH_TOKEN=1b81b362-fa95-4f04-9e50-99c2c901a884
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
DYNAMODB_DATABASE_NAME=products
REDIS_ENABLED=true
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:8080
NODE_ENV=development
AUTO_MIGRATE=true
AUTO_SEED=true
```

**Note**: After updating `.env`, restart containers: `docker compose down && docker compose up -d`

## Deployment

### Deploy Docker Images
```bash
./deploy-images.sh [AWS_ACCOUNT_ID] [AWS_REGION] [ENVIRONMENT] [IMAGE_TAG]
```

### Deploy Frontend
```bash
./deploy-frontend.sh [AWS_REGION] [ENVIRONMENT]
```

## Architecture

- **Frontend**: React + TypeScript (port 5173)
- **API Gateway**: Nginx (port 8080)
- **Product Service**: Node.js (port 3000)
- **Database**: DynamoDB Local (port 8000)
- **Cache**: Redis (port 6379)

## Development

- Hot reload enabled for frontend and product-service
- Migrations and seeding run automatically on startup

## Infrastructure

See `infrastucture/README.md` for Terraform setup.
