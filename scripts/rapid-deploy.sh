#!/bin/bash

# ===========================================
# RAPID CONVEX DEPLOYMENT SCRIPT
# Run this to go live in 2 days
# ===========================================

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           RAPID CONVEX DEPLOYMENT - 2 DAY SPRINT           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Check for Convex project
echo -e "${YELLOW}[3/8] Checking Convex configuration...${NC}"

if [ -z "$CONVEX_URL" ] && [ -z "$CONVEX_DEPLOYMENT" ]; then
    echo -e "${YELLOW}⚠️  CONVEX_URL not set. Initializing Convex...${NC}"
    echo ""
    echo -e "${BLUE}This will open Convex setup. Please:${NC}"
    echo "  1. Log in to Convex"
    echo "  2. Create a new project (or select existing)"
    echo "  3. Copy the deployment URL"
    echo ""
    read -p "Press Enter to continue..."
    npx convex dev --once
    echo ""
    echo -e "${YELLOW}Please add to your .env file:${NC}"
    echo "CONVEX_URL=<your-deployment-url>"
    echo ""
    read -p "Press Enter after updating .env..."
fi

echo -e "${GREEN}✅ Convex configured${NC}"

# Step 4: Deploy Convex functions
echo -e "${YELLOW}[4/8] Deploying Convex functions...${NC}"
npx convex deploy
echo -e "${GREEN}✅ Convex functions deployed${NC}"

# Step 5: Backup PostgreSQL (if DATABASE_URL is set)
echo -e "${YELLOW}[5/8] Database backup...${NC}"

if [ -n "$DATABASE_URL" ]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "Creating backup: $BACKUP_FILE"

    # Extract connection details and backup
    # Note: This is a simplified version - adjust for your setup
    if command -v pg_dump &> /dev/null; then
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  Backup skipped (pg_dump not available or connection failed)"
    else
        echo "⚠️  pg_dump not available - please backup manually"
    fi
else
    echo "⚠️  DATABASE_URL not set - skipping backup"
fi

echo -e "${GREEN}✅ Backup step complete${NC}"

# Step 6: Run data migration
echo -e "${YELLOW}[6/8] Running data migration...${NC}"

if [ -f "scripts/migrate-to-convex.js" ]; then
    read -p "Run data migration now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run migrate:convex
        echo -e "${GREEN}✅ Migration complete${NC}"
    else
        echo "⚠️  Migration skipped - run 'npm run migrate:convex' manually"
    fi
else
    echo "⚠️  Migration script not found"
fi

# Step 7: Enable hybrid controllers
echo -e "${YELLOW}[7/8] Enabling hybrid mode...${NC}"

# Backup original controllers
if [ -f "src/controllers/productController.js" ] && [ ! -f "src/controllers/productController.pg.js" ]; then
    cp src/controllers/productController.js src/controllers/productController.pg.js
    echo "  Backed up productController.js → productController.pg.js"
fi

# Optionally swap to hybrid controller
read -p "Enable hybrid product controller? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "src/controllers/productController.hybrid.js" ]; then
        cp src/controllers/productController.hybrid.js src/controllers/productController.js
        echo -e "${GREEN}✅ Hybrid controller enabled${NC}"
    fi
else
    echo "  Using original controllers with Convex bridge"
fi

# Step 8: Start server
echo -e "${YELLOW}[8/8] Ready to start!${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    DEPLOYMENT COMPLETE!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Start server:     npm run dev"
echo "  2. Test endpoints:   curl http://localhost:5000/api/products"
echo "  3. Check Convex:     https://dashboard.convex.dev"
echo ""
echo -e "${YELLOW}To rollback:${NC}"
echo "  - Comment out convexService.initializeConvex() in server.js"
echo "  - Or restore: cp src/controllers/productController.pg.js src/controllers/productController.js"
echo ""
