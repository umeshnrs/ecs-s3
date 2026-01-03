# ECS-S3 E-commerce Application

A full-stack e-commerce application with microservices architecture, running on Docker Compose for local development and AWS ECS for production.

## Architecture

- **Frontend**: React + TypeScript + Vite (port 5173)
- **API Gateway**: Nginx reverse proxy (port 8080)
- **Product Service**: Node.js microservice (port 3000, internal)
- **Database**: DynamoDB Local (port 8000)
- **Cache**: Redis (port 6379)
- **Admin Tools**: 
  - DynamoDB Admin (port 8001)
  - Redis Commander (port 8081)

## Prerequisites (Ubuntu/WSL)

- Docker and Docker Compose installed and running
- Node.js 20+ (for local development, optional)
- AWS CLI (for deployment scripts, optional)

## Quick Start (Ubuntu/WSL)

1. **Run the setup script** (makes scripts executable and checks prerequisites):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start all services**:
   ```bash
   docker compose up -d --build
   ```

3. **View logs**:
   ```bash
   docker compose logs -f
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - API Gateway: http://localhost:8080
   - DynamoDB Admin: http://localhost:8001
   - Redis Commander: http://localhost:8081

5. **Stop services**:
   ```bash
   docker compose down
   ```

## Environment Variables

Create a `.env` file in the root directory (optional, defaults are provided):

```bash
# Docker Compose Environment Variables
REDIS_AUTH_TOKEN=
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

## Deployment Scripts (Ubuntu/WSL)

All deployment scripts are now available as shell scripts (`.sh`) for Ubuntu/WSL:

### Deploy Docker Images to ECR

```bash
./deploy-images.sh [AWS_ACCOUNT_ID] [AWS_REGION] [ENVIRONMENT] [IMAGE_TAG]
```

Example:
```bash
./deploy-images.sh 727169793160 ap-south-1 prod latest
```

### Deploy Frontend to S3/CloudFront

```bash
./deploy-frontend.sh [AWS_REGION] [ENVIRONMENT]
```

Example:
```bash
./deploy-frontend.sh ap-south-1 prod
```

**Note**: These scripts require:
- AWS CLI configured with appropriate credentials
- Terraform infrastructure already deployed
- Docker (for image deployment)

## Development

### Hot Reload

The frontend and product-service have volume mounts for hot reload during development:
- Frontend: `./apps/frontend/src` → `/app/src`
- Product Service: `./apps/product-service/src` → `/app/src`

Changes to source files will automatically reload in the containers.

### Database Migrations

Migrations run automatically on startup if `AUTO_MIGRATE=true` (default).

### Seeding Data

Seed data is loaded automatically on startup if `AUTO_SEED=true` (default).

## Project Structure

```
.
├── apps/
│   ├── api-gateway/      # Nginx reverse proxy
│   ├── frontend/         # React frontend
│   └── product-service/  # Node.js microservice
├── infrastucture/        # Terraform infrastructure code
├── docker-compose.yml    # Local development setup
├── deploy-images.sh      # Deploy Docker images to ECR
├── deploy-frontend.sh    # Deploy frontend to S3/CloudFront
└── setup.sh              # Setup script for Ubuntu/WSL
```

## Troubleshooting

### Docker daemon not running
```bash
# Check Docker status
docker info

# Start Docker (if using Docker Desktop on WSL)
# Or use systemd (if configured in WSL)
sudo service docker start
```

### Port conflicts
If ports are already in use, modify `docker-compose.yml` to use different ports.

### Permission issues
Make sure scripts are executable:
```bash
chmod +x *.sh
chmod +x apps/api-gateway/docker-entrypoint.sh
```

### Windows line endings
If you encounter issues with scripts, ensure they use Unix line endings:
```bash
dos2unix *.sh
```

## Infrastructure

See `infrastucture/README.md` for Terraform infrastructure setup instructions.

## Notes

- All commands should be run in Ubuntu/WSL terminal, not Windows CMD or PowerShell
- The project is configured to work seamlessly in WSL/Ubuntu environments
- PowerShell scripts (`.ps1`) are deprecated - use `.sh` scripts instead

