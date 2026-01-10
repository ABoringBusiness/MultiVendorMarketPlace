#!/usr/bin/env node

/**
 * Migration Verification Script
 *
 * Verifies that all data has been successfully migrated from PostgreSQL to Convex.
 * Run this BEFORE executing the cleanup script.
 *
 * Usage: npm run verify:migration
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");
const { ConvexHttpClient } = require("convex/browser");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log("╔════════════════════════════════════════════════════════════╗", "blue");
  log("║            MIGRATION VERIFICATION SCRIPT                   ║", "blue");
  log("╚════════════════════════════════════════════════════════════╝", "blue");
  console.log("");

  // Check environment variables
  if (!process.env.DATABASE_URL) {
    log("❌ DATABASE_URL not set. Cannot verify PostgreSQL.", "red");
    process.exit(1);
  }

  if (!process.env.CONVEX_URL && !process.env.CONVEX_DEPLOYMENT) {
    log("❌ CONVEX_URL/CONVEX_DEPLOYMENT not set. Cannot verify Convex.", "red");
    process.exit(1);
  }

  // Connect to PostgreSQL
  log("📊 Connecting to PostgreSQL...", "blue");
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
    dialectOptions: {
      ssl: process.env.DATABASE_URL.includes("supabase")
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  });

  // Connect to Convex
  log("📊 Connecting to Convex...", "blue");
  const convexUrl = process.env.CONVEX_URL || process.env.CONVEX_DEPLOYMENT;
  const convex = new ConvexHttpClient(convexUrl);

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  try {
    await sequelize.authenticate();
    log("✅ PostgreSQL connected", "green");
  } catch (error) {
    log(`❌ PostgreSQL connection failed: ${error.message}`, "red");
    process.exit(1);
  }

  console.log("");
  log("🔍 Verifying data migration...", "blue");
  console.log("");

  // Verify Users
  try {
    const [pgUsers] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    const pgUserCount = parseInt(pgUsers[0].count);

    // Note: You'll need to implement a count query in Convex
    // For now, we'll use the migration stats function if available
    log(`   PostgreSQL users: ${pgUserCount}`, "yellow");
    log("   ⚠️  Verify Convex user count in dashboard", "yellow");
    results.warnings++;
  } catch (error) {
    log(`   ❌ Users verification failed: ${error.message}`, "red");
    results.failed++;
  }

  // Verify Categories
  try {
    const [pgCategories] = await sequelize.query(
      "SELECT COUNT(*) as count FROM categories"
    );
    const pgCategoryCount = parseInt(pgCategories[0].count);
    log(`   PostgreSQL categories: ${pgCategoryCount}`, "yellow");
    results.warnings++;
  } catch (error) {
    log(`   ❌ Categories verification failed: ${error.message}`, "red");
    results.failed++;
  }

  // Verify Products
  try {
    const [pgProducts] = await sequelize.query(
      "SELECT COUNT(*) as count FROM products"
    );
    const pgProductCount = parseInt(pgProducts[0].count);
    log(`   PostgreSQL products: ${pgProductCount}`, "yellow");
    results.warnings++;
  } catch (error) {
    log(`   ❌ Products verification failed: ${error.message}`, "red");
    results.failed++;
  }

  // Verify Orders
  try {
    const [pgOrders] = await sequelize.query("SELECT COUNT(*) as count FROM orders");
    const pgOrderCount = parseInt(pgOrders[0].count);
    log(`   PostgreSQL orders: ${pgOrderCount}`, "yellow");
    results.warnings++;
  } catch (error) {
    log(`   ❌ Orders verification failed: ${error.message}`, "red");
    results.failed++;
  }

  // Verify Reviews
  try {
    const [pgReviews] = await sequelize.query("SELECT COUNT(*) as count FROM reviews");
    const pgReviewCount = parseInt(pgReviews[0].count);
    log(`   PostgreSQL reviews: ${pgReviewCount}`, "yellow");
    results.warnings++;
  } catch (error) {
    // Reviews table might not exist
    log("   ⚠️  Reviews table not found (may be expected)", "yellow");
    results.warnings++;
  }

  // Verify Carts
  try {
    const [pgCarts] = await sequelize.query("SELECT COUNT(*) as count FROM carts");
    const pgCartCount = parseInt(pgCarts[0].count);
    log(`   PostgreSQL carts: ${pgCartCount}`, "yellow");
    results.warnings++;
  } catch (error) {
    log(`   ❌ Carts verification failed: ${error.message}`, "red");
    results.failed++;
  }

  // Summary
  console.log("");
  log("════════════════════════════════════════════════════════════", "blue");
  log("                    VERIFICATION SUMMARY                     ", "blue");
  log("════════════════════════════════════════════════════════════", "blue");
  console.log("");

  if (results.failed > 0) {
    log(`❌ Failed: ${results.failed} checks`, "red");
  }
  if (results.warnings > 0) {
    log(`⚠️  Warnings: ${results.warnings} (manual verification needed)`, "yellow");
  }
  if (results.passed > 0) {
    log(`✅ Passed: ${results.passed} checks`, "green");
  }

  console.log("");
  log("📋 Manual verification required:", "blue");
  console.log("   1. Open Convex dashboard: https://dashboard.convex.dev");
  console.log("   2. Navigate to Data tab");
  console.log("   3. Compare record counts with PostgreSQL counts above");
  console.log("   4. Test key user flows:");
  console.log("      - User login/signup");
  console.log("      - Browse products");
  console.log("      - Add to cart");
  console.log("      - Create order");
  console.log("");

  if (results.failed > 0) {
    log("❌ Migration verification INCOMPLETE - Fix issues before cleanup", "red");
    process.exit(1);
  } else {
    log("⚠️  Manual verification required before running cleanup", "yellow");
    console.log("");
    console.log("If counts match and user flows work, run:");
    console.log("   npm run cleanup:legacy");
  }

  await sequelize.close();
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
