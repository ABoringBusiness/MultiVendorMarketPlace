#!/usr/bin/env node

/**
 * Phase 2: PostgreSQL to Convex Data Migration Script
 * 
 * This script migrates all data from PostgreSQL to Convex.
 * 
 * Prerequisites:
 * 1. Convex project initialized (`npx convex dev`)
 * 2. PostgreSQL database accessible
 * 3. Environment variables configured
 * 
 * Usage:
 *   node scripts/migrate-to-convex.js
 * 
 * Or with npx:
 *   npm run migrate:convex
 */

const { ConvexHttpClient } = require("convex/browser");
const { Client } = require("pg");
require("dotenv").config();

// Configuration
const CONVEX_URL = process.env.CONVEX_DEPLOYMENT;
const DATABASE_URL = process.env.DATABASE_URL;
const BATCH_SIZE = 100; // Process in batches to avoid memory issues

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_DEPLOYMENT environment variable not set");
  console.error("   Run 'npx convex dev' first to get your deployment URL");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL environment variable not set");
  console.error("   Add DATABASE_URL to your .env file");
  process.exit(1);
}

// Initialize clients
const convex = new ConvexHttpClient(CONVEX_URL);
const pg = new Client({ connectionString: DATABASE_URL });

// ID mapping for foreign keys
const idMappings = {
  users: new Map(), // pgId -> convexId
  categories: new Map(),
  products: new Map(),
  orders: new Map(),
};

/**
 * Migrate users from PostgreSQL to Convex
 */
async function migrateUsers() {
  console.log("\n📋 Migrating Users...");
  
  const result = await pg.query(`
    SELECT id, name, email, password, role, "isDisabled", "createdAt"
    FROM "Users"
    ORDER BY "createdAt" ASC
  `);

  const users = result.rows;
  console.log(`   Found ${users.length} users to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const convexUser = await convex.mutation("_migration/migrateUsers:migrateUser", {
        name: user.name,
        email: user.email,
        passwordHash: user.password, // Already bcrypt hashed
        role: user.role,
        isDisabled: user.isDisabled || false,
      });

      idMappings.users.set(user.id, convexUser.userId);
      migrated++;
      
      if (migrated % 10 === 0) {
        process.stdout.write(`\r   Migrated: ${migrated}/${users.length}`);
      }
    } catch (error) {
      if (error.message.includes("already exists")) {
        skipped++;
      } else {
        console.error(`\n   ❌ Failed to migrate user ${user.email}:`, error.message);
      }
    }
  }

  console.log(`\n   ✅ Migrated ${migrated} users (${skipped} skipped)`);
  return { migrated, skipped, total: users.length };
}

/**
 * Migrate categories from PostgreSQL to Convex
 */
async function migrateCategories() {
  console.log("\n📋 Migrating Categories...");
  
  const result = await pg.query(`
    SELECT id, name, description
    FROM "Categories"
    ORDER BY "createdAt" ASC
  `);

  const categories = result.rows;
  console.log(`   Found ${categories.length} categories to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const category of categories) {
    try {
      const convexCategory = await convex.mutation("categories:createCategory", {
        name: category.name,
        description: category.description,
      });

      idMappings.categories.set(category.id, convexCategory.categoryId);
      migrated++;
    } catch (error) {
      if (error.message.includes("already exists")) {
        // Try to find existing category
        const existing = await convex.query("categories:getCategoryByName", {
          name: category.name,
        });
        if (existing) {
          idMappings.categories.set(category.id, existing._id);
          skipped++;
        }
      } else {
        console.error(`\n   ❌ Failed to migrate category ${category.name}:`, error.message);
      }
    }
  }

  console.log(`   ✅ Migrated ${migrated} categories (${skipped} skipped)`);
  return { migrated, skipped, total: categories.length };
}

/**
 * Migrate products from PostgreSQL to Convex
 */
async function migrateProducts() {
  console.log("\n📋 Migrating Products...");
  
  const result = await pg.query(`
    SELECT id, "sellerId", "categoryId", title, description, price, "imageUrl", "isDisabled"
    FROM "Products"
    ORDER BY "createdAt" ASC
  `);

  const products = result.rows;
  console.log(`   Found ${products.length} products to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const product of products) {
    const convexSellerId = idMappings.users.get(product.sellerId);
    const convexCategoryId = idMappings.categories.get(product.categoryId);

    if (!convexSellerId || !convexCategoryId) {
      console.log(`\n   ⚠️  Skipping product ${product.title} - missing seller or category mapping`);
      skipped++;
      continue;
    }

    try {
      const convexProduct = await convex.mutation("_migration/migrateProducts:migrateProduct", {
        sellerId: convexSellerId,
        categoryId: convexCategoryId,
        title: product.title,
        description: product.description,
        price: parseFloat(product.price),
        imageUrl: product.imageUrl,
        isDisabled: product.isDisabled || false,
      });

      idMappings.products.set(product.id, convexProduct.productId);
      migrated++;
      
      if (migrated % 10 === 0) {
        process.stdout.write(`\r   Migrated: ${migrated}/${products.length}`);
      }
    } catch (error) {
      console.error(`\n   ❌ Failed to migrate product ${product.title}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n   ✅ Migrated ${migrated} products (${skipped} skipped)`);
  return { migrated, skipped, total: products.length };
}

/**
 * Migrate orders and order items from PostgreSQL to Convex
 */
async function migrateOrders() {
  console.log("\n📋 Migrating Orders...");
  
  const result = await pg.query(`
    SELECT 
      o.id as order_id,
      o.user_id,
      o.total,
      o.status,
      o.shipping_address,
      o.payment_status,
      json_agg(
        json_build_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )
      ) FILTER (WHERE oi.id IS NOT NULL) as items
    FROM marketplace.orders o
    LEFT JOIN marketplace.order_items oi ON oi.order_id = o.id
    GROUP BY o.id, o.user_id, o.total, o.status, o.shipping_address, o.payment_status
    ORDER BY o.created_at ASC
  `);

  const orders = result.rows;
  console.log(`   Found ${orders.length} orders to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const order of orders) {
    const convexUserId = idMappings.users.get(order.user_id);

    if (!convexUserId) {
      console.log(`\n   ⚠️  Skipping order ${order.order_id} - user not found`);
      skipped++;
      continue;
    }

    // Map order items
    const items = (order.items || [])
      .map(item => {
        const convexProductId = idMappings.products.get(item.product_id);
        if (!convexProductId) return null;

        return {
          productId: convexProductId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
        };
      })
      .filter(item => item !== null);

    if (items.length === 0 && order.items && order.items.length > 0) {
      console.log(`\n   ⚠️  Skipping order ${order.order_id} - no valid products`);
      skipped++;
      continue;
    }

    try {
      const convexOrder = await convex.mutation("_migration/migrateOrders:migrateOrder", {
        userId: convexUserId,
        total: parseFloat(order.total),
        status: order.status,
        shippingAddress: order.shipping_address,
        paymentStatus: order.payment_status,
        items,
      });

      idMappings.orders.set(order.order_id, convexOrder.orderId);
      migrated++;
      
      if (migrated % 10 === 0) {
        process.stdout.write(`\r   Migrated: ${migrated}/${orders.length}`);
      }
    } catch (error) {
      console.error(`\n   ❌ Failed to migrate order ${order.order_id}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n   ✅ Migrated ${migrated} orders (${skipped} skipped)`);
  return { migrated, skipped, total: orders.length };
}

/**
 * Migrate reviews from PostgreSQL to Convex
 */
async function migrateReviews() {
  console.log("\n📋 Migrating Reviews...");
  
  try {
    const result = await pg.query(`
      SELECT r.id, r.product_id, r.user_id, r.rating, r.comment
      FROM marketplace.reviews r
      ORDER BY r.created_at ASC
    `);

    const reviews = result.rows;
    console.log(`   Found ${reviews.length} reviews to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const review of reviews) {
      const convexProductId = idMappings.products.get(review.product_id);
      const convexUserId = idMappings.users.get(review.user_id);

      if (!convexProductId || !convexUserId) {
        skipped++;
        continue;
      }

      try {
        await convex.mutation("_migration/migrateReviews:migrateReview", {
          productId: convexProductId,
          userId: convexUserId,
          rating: review.rating,
          comment: review.comment,
        });

        migrated++;
        
        if (migrated % 10 === 0) {
          process.stdout.write(`\r   Migrated: ${migrated}/${reviews.length}`);
        }
      } catch (error) {
        if (!error.message.includes("already exists")) {
          console.error(`\n   ❌ Failed to migrate review:`, error.message);
        }
        skipped++;
      }
    }

    console.log(`\n   ✅ Migrated ${migrated} reviews (${skipped} skipped)`);
    return { migrated, skipped, total: reviews.length };
  } catch (error) {
    console.log(`\n   ⚠️  Reviews table not found or error: ${error.message}`);
    return { migrated: 0, skipped: 0, total: 0 };
  }
}

/**
 * Migrate carts and cart items from PostgreSQL to Convex
 */
async function migrateCarts() {
  console.log("\n📋 Migrating Carts...");
  
  try {
    const result = await pg.query(`
      SELECT 
        c.id as cart_id,
        c.user_id,
        json_agg(
          json_build_object(
            'product_id', ci.product_id,
            'quantity', ci.quantity
          )
        ) FILTER (WHERE ci.id IS NOT NULL) as items
      FROM marketplace.carts c
      LEFT JOIN marketplace.cart_items ci ON ci.cart_id = c.id
      GROUP BY c.id, c.user_id
      ORDER BY c.created_at ASC
    `);

    const carts = result.rows;
    console.log(`   Found ${carts.length} carts to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const cart of carts) {
      const convexUserId = idMappings.users.get(cart.user_id);

      if (!convexUserId) {
        skipped++;
        continue;
      }

      // Map cart items
      const items = (cart.items || [])
        .map(item => {
          const convexProductId = idMappings.products.get(item.product_id);
          if (!convexProductId) return null;

          return {
            productId: convexProductId,
            quantity: item.quantity,
          };
        })
        .filter(item => item !== null);

      try {
        await convex.mutation("_migration/migrateCarts:migrateCart", {
          userId: convexUserId,
          items,
        });

        migrated++;
        
        if (migrated % 10 === 0) {
          process.stdout.write(`\r   Migrated: ${migrated}/${carts.length}`);
        }
      } catch (error) {
        if (!error.message.includes("already exists")) {
          console.error(`\n   ❌ Failed to migrate cart:`, error.message);
        }
        skipped++;
      }
    }

    console.log(`\n   ✅ Migrated ${migrated} carts (${skipped} skipped)`);
    return { migrated, skipped, total: carts.length };
  } catch (error) {
    console.log(`\n   ⚠️  Carts table not found or error: ${error.message}`);
    return { migrated: 0, skipped: 0, total: 0 };
  }
}

/**
 * Display migration statistics
 */
async function displayStatistics() {
  console.log("\n📊 Migration Statistics:");
  
  try {
    const userStats = await convex.mutation("_migration/migrateUsers:getMigrationStats", {});
    console.log("\n   Users:");
    console.log(`     Total: ${userStats.totalUsers}`);
    console.log(`     Buyers: ${userStats.buyers}`);
    console.log(`     Sellers: ${userStats.sellers}`);
    console.log(`     Admins: ${userStats.admins}`);

    const productStats = await convex.mutation("_migration/migrateProducts:getMigrationStats", {});
    console.log("\n   Products:");
    console.log(`     Total: ${productStats.totalProducts}`);
    console.log(`     Active: ${productStats.active}`);
    console.log(`     Disabled: ${productStats.disabled}`);

    const orderStats = await convex.mutation("_migration/migrateOrders:getMigrationStats", {});
    console.log("\n   Orders:");
    console.log(`     Total: ${orderStats.totalOrders}`);
    console.log(`     Order Items: ${orderStats.totalOrderItems}`);
    console.log(`     By Status:`, JSON.stringify(orderStats.statusCounts, null, 2).replace(/\n/g, '\n       '));

    try {
      const reviewStats = await convex.mutation("_migration/migrateReviews:getMigrationStats", {});
      console.log("\n   Reviews:");
      console.log(`     Total: ${reviewStats.totalReviews}`);
      console.log(`     Average Rating: ${reviewStats.averageRating.toFixed(2)}`);
    } catch (error) {
      // Reviews might not be migrated
    }

    try {
      const cartStats = await convex.mutation("_migration/migrateCarts:getMigrationStats", {});
      console.log("\n   Carts:");
      console.log(`     Total: ${cartStats.totalCarts}`);
      console.log(`     Cart Items: ${cartStats.totalCartItems}`);
    } catch (error) {
      // Carts might not be migrated
    }
  } catch (error) {
    console.error("   ❌ Failed to get statistics:", error.message);
  }
}

/**
 * Main migration process
 */
async function main() {
  console.log("🚀 Starting PostgreSQL to Convex Migration");
  console.log("=" .repeat(50));

  try {
    // Connect to PostgreSQL
    console.log("\n🔌 Connecting to PostgreSQL...");
    await pg.connect();
    console.log("   ✅ Connected to PostgreSQL");

    // Run migrations in order
    const results = {
      users: await migrateUsers(),
      categories: await migrateCategories(),
      products: await migrateProducts(),
      orders: await migrateOrders(),
      reviews: await migrateReviews(),
      carts: await migrateCarts(),
    };

    // Display statistics
    await displayStatistics();

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("✅ Migration Complete!");
    console.log("\nSummary:");
    console.log(`   Users: ${results.users.migrated}/${results.users.total}`);
    console.log(`   Categories: ${results.categories.migrated}/${results.categories.total}`);
    console.log(`   Products: ${results.products.migrated}/${results.products.total}`);
    console.log(`   Orders: ${results.orders.migrated}/${results.orders.total}`);
    console.log(`   Reviews: ${results.reviews.migrated}/${results.reviews.total}`);
    console.log(`   Carts: ${results.carts.migrated}/${results.carts.total}`);
    
    console.log("\n📖 Next Steps:");
    console.log("   1. Verify data in Convex dashboard");
    console.log("   2. Test Convex functions with migrated data");
    console.log("   3. Proceed to Phase 3: Frontend Integration");
    console.log("\n📚 See PHASE2_MIGRATION.md for detailed post-migration steps");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pg.end();
    console.log("\n🔌 Disconnected from PostgreSQL");
  }
}

// Run migration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
