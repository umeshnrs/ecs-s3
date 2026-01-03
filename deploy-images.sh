#!/bin/bash
# Build and Push Docker Images to ECR
# This script builds and pushes the product-service and api-gateway images to ECR

set -e  # Exit on error

AWS_ACCOUNT_ID="${1:-727169793160}"
AWS_REGION="${2:-ap-south-1}"
ENVIRONMENT="${3:-prod}"
IMAGE_TAG="${4:-latest}"

echo "========================================="
echo "Docker Image Build and Push to ECR"
echo "========================================="
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo "Image Tag: $IMAGE_TAG"
echo ""

# ECR Repository URLs
PRODUCT_SERVICE_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ENVIRONMENT}-product-service"
API_GATEWAY_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ENVIRONMENT}-api-gateway"

# Step 1: Login to ECR
echo "Step 1: Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to login to ECR. Make sure AWS CLI is configured and you have permissions." >&2
    exit 1
fi
echo "Successfully logged in to ECR"
echo ""

# Step 2: Build and Push Product Service
echo "Step 2: Building Product Service image..."
cd apps/product-service
docker build -t "${ENVIRONMENT}-product-service:$IMAGE_TAG" .
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build product-service image" >&2
    cd ../..
    exit 1
fi
echo "Product Service image built successfully"

echo "Tagging Product Service image for ECR..."
docker tag "${ENVIRONMENT}-product-service:$IMAGE_TAG" "${PRODUCT_SERVICE_REPO}:${IMAGE_TAG}"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to tag product-service image" >&2
    cd ../..
    exit 1
fi

echo "Pushing Product Service image to ECR..."
docker push "${PRODUCT_SERVICE_REPO}:${IMAGE_TAG}"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to push product-service image to ECR" >&2
    cd ../..
    exit 1
fi
echo "Product Service image pushed successfully"
cd ../..
echo ""

# Step 3: Build and Push API Gateway
echo "Step 3: Building API Gateway image..."
cd apps/api-gateway
docker build -t "${ENVIRONMENT}-api-gateway:$IMAGE_TAG" .
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build api-gateway image" >&2
    cd ../..
    exit 1
fi
echo "API Gateway image built successfully"

echo "Tagging API Gateway image for ECR..."
docker tag "${ENVIRONMENT}-api-gateway:$IMAGE_TAG" "${API_GATEWAY_REPO}:${IMAGE_TAG}"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to tag api-gateway image" >&2
    cd ../..
    exit 1
fi

echo "Pushing API Gateway image to ECR..."
docker push "${API_GATEWAY_REPO}:${IMAGE_TAG}"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to push api-gateway image to ECR" >&2
    cd ../..
    exit 1
fi
echo "API Gateway image pushed successfully"
cd ../..
echo ""

echo "========================================="
echo "All images pushed successfully!"
echo "========================================="
echo "Product Service: ${PRODUCT_SERVICE_REPO}:${IMAGE_TAG}"
echo "API Gateway: ${API_GATEWAY_REPO}:${IMAGE_TAG}"
echo ""