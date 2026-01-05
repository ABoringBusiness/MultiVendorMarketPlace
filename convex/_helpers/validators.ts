/**
 * Input Validation Helper Functions
 * 
 * These helpers provide common validation logic for Convex functions.
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Password must be at least 6 characters long
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate price (must be positive number)
 */
export function isValidPrice(price: number): boolean {
  return price > 0 && Number.isFinite(price);
}

/**
 * Validate rating (must be between 1 and 5)
 */
export function isValidRating(rating: number): boolean {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
}

/**
 * Validate quantity (must be positive integer)
 */
export function isValidQuantity(quantity: number): boolean {
  return quantity > 0 && Number.isInteger(quantity);
}

/**
 * Validate order status
 */
export function isValidOrderStatus(status: string): boolean {
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  return validStatuses.includes(status);
}

/**
 * Validate payment status
 */
export function isValidPaymentStatus(status: string): boolean {
  const validStatuses = ["unpaid", "paid", "refunded"];
  return validStatuses.includes(status);
}

/**
 * Validate user role
 */
export function isValidRole(role: string): boolean {
  const validRoles = ["buyer", "seller", "admin"];
  return validRoles.includes(role);
}

/**
 * Validate notification type
 */
export function isValidNotificationType(type: string): boolean {
  const validTypes = ["order", "auction", "bid", "payment", "system", "review", "product"];
  return validTypes.includes(type);
}

/**
 * Sanitize string input (remove excessive whitespace)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

/**
 * Validate string length
 */
export function isValidLength(
  str: string,
  minLength: number,
  maxLength?: number
): boolean {
  const length = str.length;
  if (length < minLength) return false;
  if (maxLength !== undefined && length > maxLength) return false;
  return true;
}
