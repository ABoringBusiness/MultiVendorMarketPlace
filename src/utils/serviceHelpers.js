/**
 * Utility functions for service-related operations
 */

/**
 * Calculate the end time based on start time and duration
 * @param {string} startTime - Start time in HH:MM format
 * @param {number} duration - Duration in minutes or hours
 * @param {string} serviceType - 'minute', 'hourly', or 'fixed'
 * @returns {string} - End time in HH:MM format
 */
const calculateEndTime = (startTime, duration, serviceType) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  let durationMs;
  if (serviceType === 'hourly') {
    durationMs = duration * 60 * 60 * 1000; // Convert hours to milliseconds
  } else {
    durationMs = duration * 60 * 1000; // Convert minutes to milliseconds
  }
  
  const endDate = new Date(startDate.getTime() + durationMs);
  const endHours = endDate.getHours().toString().padStart(2, '0');
  const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
  
  return `${endHours}:${endMinutes}`;
};

/**
 * Calculate the release date for affiliate commissions
 * @param {number} holdingPeriod - Holding period in days (default: 14)
 * @returns {Date} - Release date
 */
const calculateReleaseDate = (holdingPeriod = 14) => {
  const releaseDate = new Date();
  releaseDate.setDate(releaseDate.getDate() + holdingPeriod);
  return releaseDate;
};

/**
 * Calculate the expiration date for subscriptions
 * @param {string} subscriptionPeriod - 'monthly' or 'yearly'
 * @returns {Date} - Expiration date
 */
const calculateExpirationDate = (subscriptionPeriod) => {
  const expirationDate = new Date();
  
  if (subscriptionPeriod === 'monthly') {
    expirationDate.setMonth(expirationDate.getMonth() + 1);
  } else if (subscriptionPeriod === 'yearly') {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  }
  
  return expirationDate;
};

/**
 * Generate availability dates from a recurring pattern
 * @param {Object} pattern - Recurring pattern object
 * @param {Date} startDate - Start date for generation
 * @param {Date} endDate - End date for generation
 * @returns {Array} - Array of generated availability dates
 */
const generateAvailabilityFromPattern = (pattern, startDate, endDate) => {
  const { daysOfWeek, startTime, endTime } = pattern;
  const generatedDates = [];
  
  // Clone start date to avoid modifying the original
  const currentDate = new Date(startDate);
  
  // Set time to beginning of day
  currentDate.setHours(0, 0, 0, 0);
  
  // Loop through days until end date
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if current day is in the pattern
    if (daysOfWeek.includes(dayOfWeek)) {
      generatedDates.push({
        date: new Date(currentDate),
        startTime,
        endTime
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return generatedDates;
};

/**
 * Update availability after a booking is made
 * @param {Object} availability - Availability object
 * @param {Object} booking - Booking object
 * @returns {Promise} - Promise that resolves when availability is updated
 */
const updateAvailabilityForBooking = async (availability, booking) => {
  // For fixed duration services, mark the time slot as booked
  const bookingStartTime = booking.startTime;
  const bookingEndTime = booking.endTime;
  
  // If booking takes the entire availability slot
  if (bookingStartTime === availability.startTime && bookingEndTime === availability.endTime) {
    availability.status = 'booked';
    return await availability.save();
  }
  
  // If booking is at the start of availability
  if (bookingStartTime === availability.startTime) {
    availability.startTime = bookingEndTime;
    return await availability.save();
  }
  
  // If booking is at the end of availability
  if (bookingEndTime === availability.endTime) {
    availability.endTime = bookingStartTime;
    return await availability.save();
  }
  
  // If booking is in the middle of availability, split into two
  const beforeSlot = {
    serviceId: availability.serviceId,
    availabilityType: availability.availabilityType,
    recurringPatternId: availability.recurringPatternId,
    date: availability.date,
    startTime: availability.startTime,
    endTime: bookingStartTime,
    status: 'available'
  };
  
  const afterSlot = {
    serviceId: availability.serviceId,
    availabilityType: availability.availabilityType,
    recurringPatternId: availability.recurringPatternId,
    date: availability.date,
    startTime: bookingEndTime,
    endTime: availability.endTime,
    status: 'available'
  };
  
  // Mark current availability as booked
  availability.status = 'booked';
  await availability.save();
  
  // Create new availability slots
  const ServiceAvailability = availability.constructor;
  await ServiceAvailability.create(beforeSlot);
  await ServiceAvailability.create(afterSlot);
  
  return true;
};

/**
 * Anonymize IP address for privacy
 * @param {string} ip - IP address
 * @returns {string} - Anonymized IP address
 */
const anonymizeIp = (ip) => {
  // For IPv4, remove last octet
  if (ip.includes('.')) {
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }
  
  // For IPv6, remove last 80 bits (last 20 hex chars)
  if (ip.includes(':')) {
    return ip.substring(0, ip.length - 20) + ':0000:0000:0000:0000:0000';
  }
  
  return ip;
};

/**
 * Generate a unique tracking code
 * @param {number} length - Length of the code
 * @returns {string} - Unique tracking code
 */
const generateUniqueCode = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

module.exports = {
  calculateEndTime,
  calculateReleaseDate,
  calculateExpirationDate,
  generateAvailabilityFromPattern,
  updateAvailabilityForBooking,
  anonymizeIp,
  generateUniqueCode
};