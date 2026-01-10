/**
 * Convex Bridge Middleware
 *
 * Provides seamless fallback between Convex and PostgreSQL.
 * Use this to gradually migrate controllers without breaking anything.
 */

const convexService = require("../services/convexService");

/**
 * Middleware that adds Convex helpers to req
 */
const convexBridge = (req, res, next) => {
  req.useConvex = convexService.isConvexEnabled();
  req.convex = convexService;
  next();
};

/**
 * Try Convex first, fall back to PostgreSQL
 * @param {Function} convexFn - Async function using Convex
 * @param {Function} pgFn - Async function using PostgreSQL
 */
const tryConvexFirst = async (convexFn, pgFn) => {
  if (convexService.isConvexEnabled()) {
    try {
      return await convexFn();
    } catch (error) {
      console.warn("Convex failed, falling back to PostgreSQL:", error.message);
      return await pgFn();
    }
  }
  return await pgFn();
};

/**
 * Wrapper for controller functions to add Convex support
 * @param {Object} options
 * @param {Function} options.convex - Convex implementation
 * @param {Function} options.postgres - PostgreSQL implementation
 */
const hybridController = ({ convex, postgres }) => {
  return async (req, res) => {
    try {
      if (convexService.isConvexEnabled()) {
        try {
          return await convex(req, res);
        } catch (error) {
          console.warn("Convex error, falling back:", error.message);
          return await postgres(req, res);
        }
      }
      return await postgres(req, res);
    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
};

module.exports = {
  convexBridge,
  tryConvexFirst,
  hybridController,
};
