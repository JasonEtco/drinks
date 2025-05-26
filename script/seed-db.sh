#!/bin/bash

# Wrapper script for database seeding
# Usage: ./script/seed-db.sh [database-path]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍹 Drinks Database Seeder${NC}"
echo "========================"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default database path
DB_PATH="${1:-$PROJECT_DIR/data/recipes.db}"

echo -e "${YELLOW}Database path: $DB_PATH${NC}"
echo ""

# Run the seed script
cd "$PROJECT_DIR"
node script/seed-db "$DB_PATH"

echo ""
echo -e "${GREEN}🎉 Database seeding complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  • Start the application: npm run dev"
echo "  • Or use Docker: ./script/docker-run.sh"
echo "  • Access the app at: http://localhost:3000"
