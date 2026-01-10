#!/usr/bin/env node

/**
 * Legacy Cleanup Script
 *
 * This script removes legacy PostgreSQL, JWT, and Socket.IO dependencies
 * after completing the Convex migration.
 *
 * Usage: npm run cleanup:legacy
 *
 * WARNING: This is destructive! Ensure:
 * 1. All data is migrated to Convex
 * 2. Frontend is integrated with Convex
 * 3. All tests pass against Convex backend
 * 4. PostgreSQL database is backed up
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const LEGACY_DEPENDENCIES = [
  "pg",
  "pg-hstore",
  "sequelize",
  "@supabase/supabase-js",
  "jsonwebtoken",
  "socket.io",
  "express",
  "express-validator",
  "cors",
  "swagger-jsdoc",
  "swagger-ui-express",
];

const LEGACY_DEV_DEPENDENCIES = ["sequelize-cli"];

const LEGACY_FILES = [
  "src/config/database.js",
  "src/middleware/authMiddleware.js",
  "src/middleware/adminMiddleware.js",
  "src/middleware/sellerMiddleware.js",
  "src/services/socketService.js",
];

const LEGACY_DIRECTORIES = [
  "src/models",
  "src/routes",
  "src/controllers",
  "migrations",
  "seeders",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

function runCommand(command, description) {
  console.log(`\n⏳ ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} complete`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function removeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`   🗑️  Removed: ${filePath}`);
    return true;
  }
  return false;
}

function removeDirectory(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`   🗑️  Removed: ${dirPath}/`);
    return true;
  }
  return false;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         LEGACY CLEANUP SCRIPT - CONVEX MIGRATION           ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("⚠️  WARNING: This script will PERMANENTLY remove:");
  console.log("   • PostgreSQL/Sequelize dependencies");
  console.log("   • JWT authentication");
  console.log("   • Socket.IO real-time");
  console.log("   • Express API server");
  console.log("   • Legacy model files");
  console.log("");

  // Step 1: Confirmation
  const confirmed = await prompt("Are you sure you want to proceed? (y/n): ");
  if (!confirmed) {
    console.log("\n❌ Cleanup cancelled.");
    rl.close();
    process.exit(0);
  }

  // Step 2: Backup reminder
  console.log("\n📋 Pre-cleanup checklist:");
  const dataBackedUp = await prompt("   1. PostgreSQL database backed up? (y/n): ");
  const dataMigrated = await prompt("   2. All data migrated to Convex? (y/n): ");
  const frontendIntegrated = await prompt("   3. Frontend using Convex hooks? (y/n): ");
  const testsPass = await prompt("   4. All tests pass against Convex? (y/n): ");

  if (!dataBackedUp || !dataMigrated || !frontendIntegrated || !testsPass) {
    console.log("\n❌ Please complete all checklist items before cleanup.");
    rl.close();
    process.exit(1);
  }

  console.log("\n🚀 Starting cleanup...\n");

  // Step 3: Remove legacy dependencies
  console.log("📦 Removing legacy npm dependencies...");
  const depsToRemove = LEGACY_DEPENDENCIES.join(" ");
  runCommand(`npm uninstall ${depsToRemove}`, "Remove production dependencies");

  const devDepsToRemove = LEGACY_DEV_DEPENDENCIES.join(" ");
  runCommand(`npm uninstall -D ${devDepsToRemove}`, "Remove dev dependencies");

  // Step 4: Remove legacy files
  console.log("\n🗂️  Removing legacy files...");
  let filesRemoved = 0;
  for (const file of LEGACY_FILES) {
    if (removeFile(file)) filesRemoved++;
  }
  console.log(`   Removed ${filesRemoved} files`);

  // Step 5: Remove legacy directories
  console.log("\n📁 Removing legacy directories...");
  let dirsRemoved = 0;
  for (const dir of LEGACY_DIRECTORIES) {
    if (removeDirectory(dir)) dirsRemoved++;
  }
  console.log(`   Removed ${dirsRemoved} directories`);

  // Step 6: Create backup of current server.js
  const serverPath = path.join(process.cwd(), "server.js");
  if (fs.existsSync(serverPath)) {
    const backupPath = path.join(process.cwd(), "server.legacy.js.bak");
    fs.copyFileSync(serverPath, backupPath);
    console.log("\n💾 Backed up server.js to server.legacy.js.bak");
  }

  // Step 7: Update server.js
  const newServerContent = `// server.js - Convex Backend
// Legacy Express server has been removed
// All functionality now runs through Convex

require("dotenv").config();

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║     MultiVendor Marketplace - Convex Backend Active        ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("");
console.log("📡 Convex Deployment:", process.env.CONVEX_URL || "Not configured");
console.log("");
console.log("Available commands:");
console.log("   npm run dev     - Start Convex development server");
console.log("   npm run deploy  - Deploy to Convex production");
console.log("");
console.log("📚 Documentation:");
console.log("   - docs/FRONTEND_INTEGRATION.md - React integration guide");
console.log("   - docs/LEGACY_CLEANUP.md       - This cleanup guide");
console.log("   - convex/README.md             - Convex functions reference");
console.log("");
console.log("💡 Tip: Run 'npx convex dev' to start the development server");
`;

  fs.writeFileSync(serverPath, newServerContent);
  console.log("📝 Updated server.js for Convex-only mode");

  // Step 8: Clean up package.json scripts
  console.log("\n📋 Updating package.json...");
  const packagePath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  // Update version
  packageJson.version = "2.0.0";
  packageJson.name = "multivendor-marketplace-convex";

  // Update scripts
  packageJson.scripts = {
    dev: "convex dev",
    deploy: "convex deploy",
    test: "jest --forceExit --detectOpenHandles",
    "migrate:convex": "node scripts/migrate-to-convex.js",
    lint: "eslint .",
    format: "prettier --write .",
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
  console.log("✅ package.json updated");

  // Step 9: Final cleanup
  console.log("\n🧹 Running npm install to update lockfile...");
  runCommand("npm install", "Update package-lock.json");

  // Summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    CLEANUP COMPLETE!                        ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("✅ Removed dependencies:");
  LEGACY_DEPENDENCIES.forEach((dep) => console.log(`   • ${dep}`));
  console.log("");
  console.log("✅ Removed files and directories:");
  console.log(`   • ${filesRemoved} files`);
  console.log(`   • ${dirsRemoved} directories`);
  console.log("");
  console.log("📁 Preserved:");
  console.log("   • convex/           - Convex functions");
  console.log("   • docs/             - Documentation");
  console.log("   • scripts/          - Utility scripts");
  console.log("   • client-example/   - Frontend examples");
  console.log("");
  console.log("📋 Next steps:");
  console.log("   1. Test: npx convex run products:getProducts --arg '{}'");
  console.log("   2. Deploy: npm run deploy");
  console.log("   3. Update frontend to use Convex");
  console.log("");
  console.log("🔄 To rollback: git checkout HEAD~1 -- . && npm install");

  rl.close();
}

main().catch((error) => {
  console.error("Cleanup failed:", error);
  rl.close();
  process.exit(1);
});
