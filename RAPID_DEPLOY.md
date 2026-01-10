# 2-Day Production Deployment

## Quick Start

```bash
# Make script executable
chmod +x scripts/rapid-deploy.sh

# Run deployment
./scripts/rapid-deploy.sh
```

## Day 1 Checklist (4-6 hours)

### Hour 1: Setup
```bash
# 1. Install dependencies
npm install

# 2. Initialize Convex (creates project, gets URL)
npx convex dev

# 3. Add to .env
CONVEX_URL=https://your-deployment.convex.cloud
```

### Hour 2: Deploy
```bash
# Deploy Convex functions
npx convex deploy

# Set OpenAI key for AI agents (optional)
npx convex env set OPENAI_API_KEY sk-your-key
```

### Hour 3-5: Migrate Data
```bash
# Backup first!
pg_dump $DATABASE_URL > backup.sql

# Run migration
npm run migrate:convex

# Verify
npm run verify:migration
```

### Hour 6: Test
```bash
# Start server
npm run dev

# Test endpoints
curl http://localhost:5000/api/products
curl http://localhost:5000/api/categories
```

## Day 2 Checklist (4-6 hours)

### Hour 1-2: Enable Hybrid Mode
```bash
# Already done in server.js - just start the server
npm run dev

# Check logs for:
# ✅ Convex backend enabled - hybrid mode active
```

### Hour 3: Update Stripe Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-deployment.convex.cloud/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`

### Hour 4-5: Smoke Test
```bash
# Test critical paths
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

curl http://localhost:5000/api/products
curl http://localhost:5000/api/categories
```

### Hour 6: Deploy
```bash
# Your normal deployment process
# Heroku, Railway, Render, etc.
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Frontend                          │
│                  (No changes needed!)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Server                            │
│                    (server.js)                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              convexService.js                        │    │
│  │         (Bridge - tries Convex first)               │    │
│  └────────────────┬────────────────────────────────────┘    │
└───────────────────┼─────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│     CONVEX      │   │   PostgreSQL    │
│   (Primary)     │   │   (Fallback)    │
└─────────────────┘   └─────────────────┘
```

## Rollback (5 seconds)

If anything breaks:

```javascript
// In server.js, comment out this line:
// const convexEnabled = convexService.initializeConvex();

// Replace with:
const convexEnabled = false;
```

Or just unset the environment variable:
```bash
unset CONVEX_URL
npm run dev
```

## Files Changed

| File | Change |
|------|--------|
| `server.js` | Added Convex initialization |
| `src/services/convexService.js` | Bridge to Convex |
| `src/middleware/convexBridge.js` | Hybrid controller helper |
| `src/controllers/productController.hybrid.js` | Example hybrid controller |

## Success Criteria

- [ ] `npm run dev` shows "Convex backend enabled"
- [ ] `/api/products` returns data
- [ ] `/api/auth/login` works
- [ ] Convex dashboard shows queries
- [ ] No errors in logs

## Troubleshooting

### "Convex not configured"
```bash
# Check .env has CONVEX_URL
cat .env | grep CONVEX

# Should show:
# CONVEX_URL=https://xxx.convex.cloud
```

### "Migration failed"
```bash
# Check PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Check Convex connection
npx convex run products:getProducts --arg '{}'
```

### "Products not showing"
```bash
# Check Convex dashboard for data
# Run migration if empty:
npm run migrate:convex
```

## After Go-Live

Once stable for 1 week:
1. Run `npm run cleanup:legacy` to remove PostgreSQL
2. Update frontend to use Convex directly (optional)
3. Remove hybrid controller fallbacks
