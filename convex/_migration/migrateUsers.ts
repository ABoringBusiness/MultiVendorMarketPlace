/**
 * User Data Migration Utility
 * 
 * This utility migrates user data from PostgreSQL to Convex.
 * 
 * Usage:
 * 1. Connect to your PostgreSQL database
 * 2. Fetch all users
 * 3. Insert into Convex using the auth.signUp mutation
 * 4. Preserve password hashes (bcrypt compatible)
 * 
 * Note: This is a placeholder for Phase 2 implementation.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migrate a single user from PostgreSQL
 * 
 * This mutation accepts pre-hashed passwords to preserve existing user credentials.
 */
export const migrateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(), // Pre-hashed with bcrypt
    role: v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin")),
    isDisabled: v.boolean(),
    createdAt: v.optional(v.number()), // Original creation timestamp
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (existingUser) {
      throw new Error(`User with email ${args.email} already exists`);
    }

    // Insert user with pre-hashed password
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email.toLowerCase(),
      passwordHash: args.passwordHash, // Already hashed from PostgreSQL
      role: args.role,
      isDisabled: args.isDisabled,
    });

    return {
      userId,
      email: args.email,
      message: "User migrated successfully",
    };
  },
});

/**
 * Batch migrate users
 * 
 * Example usage from Node.js:
 * 
 * ```javascript
 * const { ConvexHttpClient } = require("convex/browser");
 * const client = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT);
 * 
 * // Fetch users from PostgreSQL
 * const users = await sequelize.query("SELECT * FROM users");
 * 
 * // Migrate each user
 * for (const user of users) {
 *   await client.mutation("_migration/migrateUsers:migrateUser", {
 *     name: user.name,
 *     email: user.email,
 *     passwordHash: user.password, // Already hashed
 *     role: user.role,
 *     isDisabled: user.isDisabled || false,
 *   });
 * }
 * ```
 */

/**
 * Get migration statistics
 */
export const getMigrationStats = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    return {
      totalUsers: users.length,
      buyers: users.filter((u) => u.role === "buyer").length,
      sellers: users.filter((u) => u.role === "seller").length,
      admins: users.filter((u) => u.role === "admin").length,
      disabled: users.filter((u) => u.isDisabled).length,
    };
  },
});
