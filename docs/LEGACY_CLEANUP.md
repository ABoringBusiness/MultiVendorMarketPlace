# Phase 4: Legacy Cleanup Guide

This guide walks through removing legacy PostgreSQL, JWT, and Socket.IO dependencies after completing the Convex migration.

## Prerequisites

Before proceeding with cleanup, ensure:

1. **All data migrated** - Run `npm run migrate:convex` and verify data in Convex dashboard
2. **Frontend integrated** - All frontend code uses Convex hooks (see `FRONTEND_INTEGRATION.md`)
3. **Testing complete** - All user flows tested against Convex backend
4. **Backup created** - PostgreSQL database backed up before cleanup

## Cleanup Checklist

### Step 1: Verify Migration Complete

```bash
# Run migration verification
npm run verify:migration
```

This checks:
- All PostgreSQL records exist in Convex
- All relationships are preserved
- User auth works with Convex

### Step 2: Update Environment Variables

Remove deprecated variables from `.env`:

```env
# REMOVE THESE:
# DATABASE_URL=...
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# DB_USER=...
# DB_PASS=...
# DB_NAME=...
# DB_HOST=...
# JWT_SECRET=...

# KEEP THESE:
PORT=5000
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=https://yoursite.com
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=...
```

### Step 3: Remove Legacy Dependencies

Run the cleanup script:

```bash
npm run cleanup:legacy
```

Or manually:

```bash
# Remove PostgreSQL dependencies
npm uninstall pg pg-hstore sequelize sequelize-cli @supabase/supabase-js

# Remove JWT dependency
npm uninstall jsonwebtoken

# Remove Socket.IO dependency
npm uninstall socket.io
```

### Step 4: Remove Legacy Code Files

The following files/directories can be safely removed:

```bash
# Database configuration
rm -rf src/config/database.js
rm -rf src/config/

# Sequelize models (replaced by Convex schema)
rm -rf src/models/

# Sequelize migrations and seeders
rm -rf migrations/
rm -rf seeders/

# Legacy middleware (replaced by Convex auth helpers)
rm -rf src/middleware/authMiddleware.js

# Socket.IO service (replaced by Convex subscriptions)
rm -rf src/services/socketService.js

# Old Express routes (replaced by Convex functions)
rm -rf src/routes/
rm -rf src/controllers/
```

### Step 5: Update package.json

Use the Convex-only package.json:

```json
{
  "name": "multivendor-backend-convex",
  "version": "2.0.0",
  "main": "index.js",
  "license": "MIT",
  "dependencies": {
    "convex": "^1.17.2",
    "bcryptjs": "^2.4.3",
    "stripe": "^18.0.0",
    "sharp": "^0.33.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/node": "^25.0.3",
    "typescript": "^5.9.3",
    "eslint": "^9.19.0",
    "prettier": "^3.4.2",
    "jest": "^29.7.0"
  },
  "scripts": {
    "dev": "convex dev",
    "deploy": "convex deploy",
    "test": "jest --forceExit --detectOpenHandles",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### Step 6: Update Server Entry Point

Replace `server.js` with a minimal Convex-focused version:

```javascript
// server.js - Convex backend
require("dotenv").config();

console.log("🚀 MultiVendor Marketplace - Convex Backend");
console.log("   Deployment:", process.env.CONVEX_URL);
console.log("");
console.log("Available commands:");
console.log("   npm run dev     - Start Convex development server");
console.log("   npm run deploy  - Deploy to production");
console.log("");
console.log("See docs/FRONTEND_INTEGRATION.md for client setup");
```

### Step 7: Remove Express App Files

After switching to Convex-only:

```bash
rm server.js
rm src/app.js
rm src/app-with-admin.js
rm src/app-with-use-cases.js
```

### Step 8: Clean Up Documentation

Update these files:
- `README.md` - Remove PostgreSQL/Express references
- `CONVEX_MIGRATION.md` - Mark as complete
- Remove obsolete docs

## Rollback Plan

If issues arise after cleanup:

1. **Restore from backup**:
   ```bash
   git checkout HEAD~1 -- .
   npm install
   ```

2. **Restore database**:
   ```bash
   psql -U postgres -d marketplace < backup.sql
   ```

3. **Revert environment**:
   - Restore `.env` with PostgreSQL variables
   - Restart Express server

## Files to Keep

Even after cleanup, keep these:

```
/convex/              # All Convex functions
/docs/                # Documentation
/scripts/             # Utility scripts
/client-example/      # Frontend examples
package.json
.gitignore
README.md
```

## Post-Cleanup Verification

After cleanup, verify:

1. **Convex functions work**:
   ```bash
   npx convex run products:getProducts --arg '{}'
   ```

2. **Frontend connects**:
   - Test useQuery hooks
   - Test useMutation hooks
   - Verify real-time updates

3. **Webhooks functional**:
   - Test Stripe payment flow
   - Verify order updates

## Dependency Comparison

### Before Cleanup (Hybrid)
```
dependencies: 16 packages
├── @supabase/supabase-js (PostgreSQL)
├── bcryptjs
├── convex
├── cors
├── dotenv
├── express
├── express-validator
├── jsonwebtoken (JWT)
├── multer
├── pg (PostgreSQL)
├── pg-hstore (PostgreSQL)
├── sequelize (PostgreSQL ORM)
├── sharp
├── socket.io (Real-time)
├── stripe
├── swagger-jsdoc
└── swagger-ui-express
```

### After Cleanup (Convex-only)
```
dependencies: 6 packages
├── bcryptjs
├── convex
├── dotenv
├── multer
├── sharp
└── stripe
```

**Removed**: 10 packages (~50MB node_modules reduction)

## Benefits of Cleanup

1. **Smaller bundle** - 50% fewer dependencies
2. **Simpler architecture** - Single data layer
3. **Real-time by default** - No Socket.IO setup needed
4. **Type safety** - Full TypeScript coverage
5. **Easier maintenance** - One system to manage
6. **Better DX** - Convex dashboard for debugging

## Support

If you encounter issues:
1. Check Convex documentation
2. Review this cleanup guide
3. Check git history for removed code
4. Contact development team
