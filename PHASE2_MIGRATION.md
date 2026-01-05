# Phase 2: Data Migration Guide

## Overview

This guide walks you through migrating your existing PostgreSQL data to Convex using the automated migration script.

## Prerequisites

Before starting the migration:

1. **Convex Project Initialized**
   ```bash
   npx convex dev
   ```
   This should be running and you should have your `CONVEX_DEPLOYMENT` URL.

2. **PostgreSQL Database Accessible**
   - Your current PostgreSQL database should be running
   - You need the `DATABASE_URL` connection string

3. **Environment Variables Set**
   Update your `.env` file:
   ```env
   # Existing PostgreSQL connection
   DATABASE_URL=postgresql://user:password@host:5432/database
   
   # Convex deployment (from `npx convex dev`)
   CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
   ```

## Migration Process

### Step 1: Backup Your Data

**IMPORTANT**: Always backup your PostgreSQL database before migration:

```bash
pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d).sql
```

### Step 2: Run the Migration Script

The automated migration script will:
- Connect to PostgreSQL and Convex
- Migrate users (preserving password hashes)
- Migrate categories
- Migrate products (with seller and category references)
- Migrate orders and order items
- Display statistics and summary

```bash
npm run migrate:convex
```

### Step 3: Monitor the Migration

The script will show real-time progress:

```
🚀 Starting PostgreSQL to Convex Migration
==================================================

🔌 Connecting to PostgreSQL...
   ✅ Connected to PostgreSQL

📋 Migrating Users...
   Found 150 users to migrate
   Migrated: 150/150
   ✅ Migrated 150 users (0 skipped)

📋 Migrating Categories...
   Found 10 categories to migrate
   ✅ Migrated 10 categories (0 skipped)

📋 Migrating Products...
   Found 500 products to migrate
   Migrated: 500/500
   ✅ Migrated 500 products (0 skipped)

📋 Migrating Orders...
   Found 250 orders to migrate
   Migrated: 250/250
   ✅ Migrated 250 orders (0 skipped)

📊 Migration Statistics:
   ...
```

### Step 4: Verify the Migration

1. **Check Convex Dashboard**
   - Open your Convex dashboard
   - Navigate to "Data" tab
   - Verify record counts match your PostgreSQL database

2. **Run Statistics Query**
   The migration script automatically displays statistics, but you can also query them manually:
   ```typescript
   // In Convex dashboard
   await ctx.runMutation("_migration/migrateUsers:getMigrationStats", {});
   await ctx.runMutation("_migration/migrateProducts:getMigrationStats", {});
   await ctx.runMutation("_migration/migrateOrders:getMigrationStats", {});
   ```

3. **Test Key Functions**
   ```bash
   # In Convex dashboard, test these queries:
   - products:getProducts
   - orders:getUserOrders
   - users:getVendors
   ```

## Migration Script Details

### What Gets Migrated

The script migrates in this order (to respect foreign key dependencies):

1. **Users**
   - Name, email, password hash (bcrypt preserved)
   - Role (buyer/seller/admin)
   - Disabled status

2. **Categories**
   - Name and description
   - Skips duplicates by name

3. **Products**
   - Title, description, price, image URL
   - Seller and category references
   - Disabled status

4. **Orders & Order Items**
   - Order details (total, status, payment status, shipping address)
   - Order line items (product, quantity, prices)

### ID Mapping

The script maintains ID mappings to preserve relationships:
```javascript
{
  users: Map<pgId, convexId>,
  categories: Map<pgId, convexId>,
  products: Map<pgId, convexId>,
  orders: Map<pgId, convexId>
}
```

### Error Handling

The script handles common errors:
- **Duplicate emails**: Skips users that already exist
- **Missing references**: Skips products/orders with missing sellers/categories
- **Validation errors**: Logs errors and continues with next record

## Troubleshooting

### Issue: "CONVEX_DEPLOYMENT environment variable not set"

**Solution**: Run `npx convex dev` first to initialize your Convex project and get the deployment URL.

### Issue: "DATABASE_URL environment variable not set"

**Solution**: Add your PostgreSQL connection string to `.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Issue: "Failed to migrate user X - already exists"

**Solution**: This is expected if you're re-running the migration. The script skips existing users. To start fresh:
1. Delete all data in Convex dashboard (Data tab → select table → delete all)
2. Re-run migration

### Issue: "Skipping product X - missing seller or category mapping"

**Solution**: This means the product's seller or category wasn't migrated. Check:
1. Does the seller exist in PostgreSQL?
2. Was the seller successfully migrated?
3. Check the migration logs for errors

### Issue: Migration is slow

**Solution**: The script processes records one by one to ensure data integrity. For large datasets:
- Increase `BATCH_SIZE` constant in the script
- Run during off-peak hours
- Consider migrating in stages (users → categories → products → orders)

## Manual Migration (Alternative)

If you prefer manual control, you can use the Convex mutations directly:

```javascript
const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT);

// Migrate a single user
await client.mutation("_migration/migrateUsers:migrateUser", {
  name: "John Doe",
  email: "john@example.com",
  passwordHash: "$2a$10$...", // bcrypt hash from PostgreSQL
  role: "buyer",
  isDisabled: false,
});

// Migrate a single product
await client.mutation("_migration/migrateProducts:migrateProduct", {
  sellerId: "<convex_user_id>",
  categoryId: "<convex_category_id>",
  title: "Product Name",
  description: "Product description",
  price: 99.99,
  imageUrl: "https://...",
  isDisabled: false,
});
```

## Post-Migration

After successful migration:

1. **Verify Data Integrity**
   - Compare record counts between PostgreSQL and Convex
   - Test critical user flows (login, add to cart, create order)
   - Check that all relationships are intact

2. **Test Convex Functions**
   - Run through `TESTING_CONVEX.md` guide
   - Test all CRUD operations
   - Verify role-based access control

3. **Keep PostgreSQL Running**
   - Don't delete PostgreSQL data yet
   - Run both systems in parallel during Phase 3
   - Only remove PostgreSQL in Phase 4 after full validation

4. **Proceed to Phase 3**
   - See `CONVEX_MIGRATION.md` for Phase 3 instructions
   - Integrate frontend with Convex
   - Enable real-time subscriptions

## Rollback Plan

If you need to rollback:

1. **Convex Side**: Delete all migrated data in Convex dashboard
2. **PostgreSQL Side**: Your original data remains untouched
3. **Application**: Continue using PostgreSQL-based Express API

## Support

For issues:
1. Check Convex logs in dashboard
2. Review PostgreSQL logs
3. See `CONVEX_MIGRATION.md` for additional context
4. Contact your development team

## Next Steps

✅ Migration complete? Proceed to:
- Phase 3: Frontend Integration (see `CONVEX_MIGRATION.md`)
- Test real-time features
- Gradually switch traffic to Convex backend
