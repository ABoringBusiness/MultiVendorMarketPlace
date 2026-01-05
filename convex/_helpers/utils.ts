/**
 * Utility Helper Functions
 * 
 * Common utility functions used across Convex functions.
 */

/**
 * Generate a random string (for tokens, etc.)
 */
export function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate order total from items
 */
export function calculateOrderTotal(
  items: Array<{ quantity: number; unitPrice: number }>
): number {
  return items.reduce((total, item) => {
    return total + item.quantity * item.unitPrice;
  }, 0);
}

/**
 * Format price to 2 decimal places
 */
export function formatPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

/**
 * Check if a timestamp has expired
 */
export function isExpired(timestamp: number): boolean {
  return timestamp < Date.now();
}

/**
 * Get timestamp for N days from now
 */
export function getDaysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

/**
 * Paginate results
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { data: T[]; hasMore: boolean; total: number } {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);
  
  return {
    data,
    hasMore: end < items.length,
    total: items.length,
  };
}

/**
 * Calculate average rating
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chunk an array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
