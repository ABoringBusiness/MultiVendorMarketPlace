import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAuth } from "./_helpers/auth";
import { isValidEmail, isValidPassword, isValidRole, sanitizeString } from "./_helpers/validators";
import bcrypt from "bcryptjs";

/**
 * Authentication Functions
 * 
 * Sign up, sign in, sign out, and user profile management.
 */

/**
 * Sign up a new user
 */
export const signUp = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    const name = sanitizeString(args.name);
    const email = args.email.toLowerCase().trim();
    const role = args.role || "buyer";

    if (!name || name.length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (!isValidPassword(args.password)) {
      throw new Error("Password must be at least 6 characters long");
    }

    if (!isValidRole(role)) {
      throw new Error("Invalid role");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Create user
    const userId = await ctx.db.insert("users", {
      name,
      email,
      passwordHash,
      role,
      isDisabled: false,
    });

    return {
      userId,
      message: "User registered successfully",
    };
  },
});

/**
 * Sign in a user
 * Note: This is a simplified version. In production, you'd use Convex Auth
 * or implement proper session management.
 */
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if account is disabled
    if (user.isDisabled) {
      throw new Error("Account is disabled. Please contact support.");
    }

    // Verify password
    const isValid = await bcrypt.compare(args.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "Login successful",
    };
  },
});

/**
 * Sign out a user
 * Note: This is a placeholder. Actual sign out would be handled by the client
 * clearing the authentication token.
 */
export const signOut = mutation({
  args: {},
  handler: async (ctx) => {
    return {
      message: "Logout successful",
    };
  },
});

/**
 * Get current authenticated user
 */
export const getCurrentUserQuery = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Don't return password hash
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      _creationTime: user._creationTime,
    };
  },
});

/**
 * Get user profile by ID
 */
export const getUserProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Don't return password hash
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDisabled: user.isDisabled,
      _creationTime: user._creationTime,
    };
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const updates: Partial<{
      name: string;
      email: string;
    }> = {};

    if (args.name) {
      const name = sanitizeString(args.name);
      if (name.length < 2) {
        throw new Error("Name must be at least 2 characters long");
      }
      updates.name = name;
    }

    if (args.email) {
      const email = args.email.toLowerCase().trim();
      if (!isValidEmail(email)) {
        throw new Error("Invalid email format");
      }

      // Check if email is already taken
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      if (existingUser && existingUser._id !== user._id) {
        throw new Error("Email already exists");
      }

      updates.email = email;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return {
      message: "Profile updated successfully",
    };
  },
});

/**
 * Update user password
 */
export const updatePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify current password
    const isValid = await bcrypt.compare(args.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    if (!isValidPassword(args.newPassword)) {
      throw new Error("New password must be at least 6 characters long");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(args.newPassword, 10);

    // Update password
    await ctx.db.patch(user._id, { passwordHash });

    return {
      message: "Password updated successfully",
    };
  },
});
