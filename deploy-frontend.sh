#!/bin/bash
# Build and Deploy Frontend to S3/CloudFront
# This script builds the frontend with the correct API endpoint and deploys it to S3

set -e  # Exit on error

AWS_REGION="${1:-ap-south-1}"
ENVIRONMENT="${2:-prod}"

echo "========================================="
echo "Frontend Build and Deploy"
echo "========================================="
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Step 1: Get API endpoint from Terraform
echo "Step 1: Getting API endpoint from Terraform..."
cd infrastucture
API_ENDPOINT=$(terraform output -raw api_endpoint_url 2>/dev/null || echo "")
if [ -z "$API_ENDPOINT" ]; then
    echo "ERROR: Failed to get API endpoint from Terraform. Make sure infrastructure is deployed." >&2
    cd ..
    exit 1
fi
echo "API Endpoint: $API_ENDPOINT"
cd ..
echo ""

# Step 2: Get S3 bucket name from Terraform
echo "Step 2: Getting S3 bucket name from Terraform..."
cd infrastucture
BUCKET_NAME=$(terraform output -raw frontend_s3_bucket_name 2>/dev/null || echo "")
if [ -z "$BUCKET_NAME" ]; then
    echo "ERROR: Failed to get S3 bucket name from Terraform." >&2
    cd ..
    exit 1
fi
echo "S3 Bucket: $BUCKET_NAME"
cd ..
echo ""

# Step 3: Get CloudFront distribution ID
echo "Step 3: Getting CloudFront distribution ID..."
cd infrastucture
CLOUDFRONT_DOMAIN=$(terraform output -raw frontend_cloudfront_domain 2>/dev/null || echo "")
if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    echo "WARNING: Could not get CloudFront domain. Cache invalidation will be skipped."
    CLOUDFRONT_DOMAIN=""
fi
cd ..
echo ""

# Step 4: Build frontend with API endpoint
echo "Step 4: Building frontend with API endpoint..."
cd apps/frontend

# Set environment variable and build
export VITE_API_URL="$API_ENDPOINT"
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build frontend" >&2
    cd ../..
    exit 1
fi
echo "Frontend built successfully"
cd ../..
echo ""

# Step 5: Upload to S3
echo "Step 5: Uploading frontend to S3..."
aws s3 sync "apps/frontend/dist" "s3://$BUCKET_NAME" --delete --region "$AWS_REGION"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to upload frontend to S3" >&2
    exit 1
fi
echo "Frontend uploaded successfully"
echo ""

# Step 6: Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
    echo "Step 6: Invalidating CloudFront cache..."
    cd infrastucture
    CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$CLOUDFRONT_DOMAIN'].Id" --output text --region "$AWS_REGION" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$CF_DIST_ID" ]; then
        aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" --region "$AWS_REGION" >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "CloudFront cache invalidation initiated"
        else
            echo "WARNING: Failed to invalidate CloudFront cache"
        fi
    else
        echo "WARNING: Could not find CloudFront distribution ID"
    fi
    cd ..
else
    echo "Step 6: Skipping CloudFront cache invalidation (no domain found)"
fi
echo ""

echo "========================================="
echo "Frontend deployment complete!"
echo "========================================="
echo "API Endpoint: $API_ENDPOINT"
echo "S3 Bucket: $BUCKET_NAME"
echo ""

