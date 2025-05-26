#!/bin/bash

# Build and run the Drinks app in Docker locally
# Usage: ./scripts/docker-run.sh [--rebuild]

set -e

IMAGE_NAME="drinks"
TAG="local"
CONTAINER_NAME="drinks-local"
PORT=3000

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍹 Drinks Docker Runner${NC}"
echo "=================================="

# Check if --rebuild flag is passed
REBUILD=false
if [[ "$1" == "--rebuild" ]]; then
    REBUILD=true
    echo -e "${YELLOW}Rebuild flag detected - will rebuild image${NC}"
fi

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Stopping and removing existing container...${NC}"
    docker stop ${CONTAINER_NAME} >/dev/null 2>&1 || true
    docker rm ${CONTAINER_NAME} >/dev/null 2>&1 || true
fi

# Build the image if it doesn't exist or if rebuild is requested
if [[ "$REBUILD" == true ]] || ! docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:${TAG}$"; then
    echo -e "${BLUE}Building Docker image...${NC}"
    docker build -t ${IMAGE_NAME}:${TAG} .
    echo -e "${GREEN}✅ Image built successfully${NC}"
else
    echo -e "${GREEN}Using existing Docker image${NC}"
fi

# Create data directory for mounting
DATA_DIR="$(pwd)/data"
mkdir -p "$DATA_DIR"

# Migrate existing recipes.db to data directory if it exists
if [[ -f "./recipes.db" && ! -f "$DATA_DIR/recipes.db" ]]; then
    echo -e "${YELLOW}Migrating existing recipes.db to data directory...${NC}"
    cp "./recipes.db" "$DATA_DIR/recipes.db"
fi

# Ensure recipes.db exists in the data directory
if [[ ! -f "$DATA_DIR/recipes.db" ]]; then
    echo -e "${YELLOW}Creating empty recipes.db file in data directory...${NC}"
    touch "$DATA_DIR/recipes.db"
fi

# Set proper permissions for the data directory and database file
echo -e "${YELLOW}Setting data directory permissions...${NC}"
chmod 755 "$DATA_DIR"
chmod 666 "$DATA_DIR/recipes.db"

# Run the container
echo -e "${BLUE}Starting container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:3000 \
    -e DATABASE_PATH=/app/data/recipes.db \
    -v "$DATA_DIR:/app/data" \
    ${IMAGE_NAME}:${TAG}

echo -e "${GREEN}✅ Container started successfully!${NC}"
echo ""
echo -e "${BLUE}Container Info:${NC}"
echo "  Name: ${CONTAINER_NAME}"
echo "  Image: ${IMAGE_NAME}:${TAG}"
echo "  Port: http://localhost:${PORT}"
echo "  Database: ./data/recipes.db (mounted directory)"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs:    docker logs -f ${CONTAINER_NAME}"
echo "  Stop:         docker stop ${CONTAINER_NAME}"
echo "  Remove:       docker rm ${CONTAINER_NAME}"
echo "  Rebuild:      ./script/docker-run.sh --rebuild"
echo ""
echo -e "${GREEN}🚀 App is running at http://localhost:${PORT}${NC}"
