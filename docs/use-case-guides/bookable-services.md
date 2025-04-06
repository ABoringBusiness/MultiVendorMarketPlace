# Bookable Services Implementation Guide

This guide explains how to implement and test bookable service products like home inspections or services charged by the minute in the MultiVendorMarketPlace platform.

## Overview

Bookable services allow service providers to list their services with availability calendars, enabling customers to book specific time slots. This can be used for one-time services like home inspections or recurring services charged by the minute.

## Key Components

1. **Service Listing**: System for providers to list their services
2. **Availability Management**: Calendar system for managing service availability
3. **Booking System**: Allows customers to book available time slots
4. **Payment Processing**: Handles payments for booked services
5. **Service Delivery**: Tracks service delivery and completion

## API Endpoints

### Service Management

```
POST /api/bookable-services - Create a new bookable service
GET /api/bookable-services - List all bookable services
GET /api/bookable-services/:id - Get bookable service details
PUT /api/bookable-services/:id - Update bookable service
DELETE /api/bookable-services/:id - Delete bookable service
```

### Availability Management

```
POST /api/bookable-services/:id/availability - Set service availability
GET /api/bookable-services/:id/availability - Get service availability
DELETE /api/bookable-services/:id/availability/:availabilityId - Remove availability
```

### Booking Management

```
POST /api/bookings - Create a new booking
GET /api/bookings - List user's bookings
GET /api/bookings/:id - Get booking details
PUT /api/bookings/:id - Update booking
DELETE /api/bookings/:id - Cancel booking
```

### Service Delivery

```
PUT /api/bookings/:id/start - Start service delivery
PUT /api/bookings/:id/complete - Complete service delivery
POST /api/bookings/:id/extend - Extend service duration
```

## Implementation Steps

1. **Create Service Listing System**:
   - Define service types (fixed duration, hourly, by-minute)
   - Implement service creation and management
   - Create service search and discovery

2. **Implement Availability System**:
   - Create calendar-based availability management
   - Handle recurring availability patterns
   - Manage provider working hours and breaks

3. **Implement Booking System**:
   - Create booking creation and management
   - Implement booking validation against availability
   - Handle booking notifications and reminders

4. **Implement Payment System**:
   - Create payment processing for bookings
   - Handle deposits and final payments
   - Implement refund processing for cancellations

5. **Implement Service Delivery Tracking**:
   - Create service start and completion tracking
   - Implement real-time duration tracking for by-minute services
   - Handle service rating and feedback

## Testing Scenarios

### Scenario 1: Fixed-Duration Service Booking (Home Inspection)

1. Provider creates a home inspection service listing
2. Provider sets availability for the next two weeks
3. Customer searches for home inspection services
4. Customer selects a provider and views availability
5. Customer books a specific time slot
6. Customer pays for the service (full payment or deposit)
7. Provider receives booking notification
8. Provider confirms the booking
9. Both parties receive confirmation and details
10. Provider marks the service as completed after delivery
11. Customer leaves a review

### Scenario 2: By-Minute Service Booking (Consulting)

1. Provider creates a consulting service charged by the minute
2. Provider sets hourly availability
3. Customer books a 30-minute initial session
4. Customer pays the minimum fee
5. Provider starts the session at the scheduled time
6. System tracks the actual duration
7. Session extends beyond 30 minutes
8. System charges the customer for additional minutes
9. Provider completes the session
10. System finalizes the payment based on actual duration

### Scenario 3: Recurring Service Booking (Weekly Cleaning)

1. Provider creates a cleaning service
2. Customer books a recurring weekly cleaning
3. System creates a series of bookings
4. Customer pays for the first session
5. Provider delivers the first cleaning
6. System automatically schedules and charges for subsequent sessions
7. Customer modifies a future booking
8. System handles the change without affecting other bookings

### Scenario 4: Booking Cancellation and Refund

1. Customer books a service
2. Customer decides to cancel the booking
3. System checks cancellation policy
4. System processes appropriate refund based on policy
5. Both parties are notified of the cancellation
6. Provider's availability is updated

## Sample Code

### Creating a Bookable Service

```javascript
// Controller function
exports.createBookableService = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category,
      serviceType, // 'fixed', 'hourly', 'minute'
      duration, // For fixed services
      price, // Base price or per-minute/hour rate
      location, // 'provider_location', 'customer_location', 'remote'
      minimumDuration, // For hourly/minute services
      maximumDuration, // For hourly/minute services
      cancellationPolicy,
      depositRequired,
      depositAmount,
      instantBooking // Whether booking requires confirmation
    } = req.body;
    const providerId = req.user.id;
    
    // Validate required fields
    if (!title || !description || !category || !serviceType || !price || !location) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Validate service type specific fields
    if (serviceType === 'fixed' && !duration) {
      return res.status(400).json({ message: "Duration is required for fixed services" });
    }
    
    if ((serviceType === 'hourly' || serviceType === 'minute') && !minimumDuration) {
      return res.status(400).json({ message: "Minimum duration is required for hourly/minute services" });
    }
    
    // Create bookable service
    const service = await BookableService.create({
      title,
      description,
      category,
      serviceType,
      duration: duration || null,
      price,
      location,
      minimumDuration: minimumDuration || null,
      maximumDuration: maximumDuration || null,
      cancellationPolicy: cancellationPolicy || 'standard',
      depositRequired: depositRequired || false,
      depositAmount: depositAmount || 0,
      instantBooking: instantBooking || false,
      providerId,
      status: 'active'
    });
    
    res.status(201).json({
      success: true,
      message: "Bookable service created successfully",
      service
    });
  } catch (error) {
    console.error("Create bookable service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Setting Service Availability

```javascript
exports.setServiceAvailability = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { 
      availabilityType, // 'specific', 'recurring'
      dates, // For specific dates
      startTime,
      endTime,
      daysOfWeek, // For recurring [0,1,2,3,4,5,6] (Sunday to Saturday)
      recurrenceStart, // Start date for recurring
      recurrenceEnd // End date for recurring
    } = req.body;
    const providerId = req.user.id;
    
    // Validate service ownership
    const service = await BookableService.findOne({
      where: {
        id: serviceId,
        providerId
      }
    });
    
    if (!service) {
      return res.status(403).json({ message: "You don't have permission to manage this service" });
    }
    
    // Validate required fields
    if (!availabilityType || !startTime || !endTime) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    if (availabilityType === 'specific' && (!dates || !Array.isArray(dates) || dates.length === 0)) {
      return res.status(400).json({ message: "Please provide specific dates" });
    }
    
    if (availabilityType === 'recurring' && (!daysOfWeek || !recurrenceStart || !recurrenceEnd)) {
      return res.status(400).json({ message: "Please provide recurring pattern details" });
    }
    
    // Create availability entries
    let availabilityEntries = [];
    
    if (availabilityType === 'specific') {
      // Create entries for specific dates
      availabilityEntries = await Promise.all(dates.map(date => 
        ServiceAvailability.create({
          serviceId,
          availabilityType,
          date,
          startTime,
          endTime,
          status: 'available'
        })
      ));
    } else {
      // Create recurring pattern
      const recurringPattern = await RecurringAvailability.create({
        serviceId,
        daysOfWeek,
        startTime,
        endTime,
        recurrenceStart,
        recurrenceEnd,
        status: 'active'
      });
      
      // Generate the next 30 days of availability based on pattern
      const generatedDates = generateAvailabilityFromPattern(
        recurringPattern,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      );
      
      // Create availability entries for generated dates
      availabilityEntries = await Promise.all(generatedDates.map(({ date, startTime, endTime }) => 
        ServiceAvailability.create({
          serviceId,
          availabilityType: 'generated',
          recurringPatternId: recurringPattern.id,
          date,
          startTime,
          endTime,
          status: 'available'
        })
      ));
    }
    
    res.status(201).json({
      success: true,
      message: "Service availability set successfully",
      availabilityEntries
    });
  } catch (error) {
    console.error("Set service availability error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Creating a Booking

```javascript
exports.createBooking = async (req, res) => {
  try {
    const { 
      serviceId, 
      date,
      startTime,
      endTime, // Optional for fixed duration services
      notes
    } = req.body;
    const userId = req.user.id;
    
    // Find the service
    const service = await BookableService.findByPk(serviceId);
    
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    // Prevent booking your own service
    if (service.providerId === userId) {
      return res.status(400).json({ message: "You cannot book your own service" });
    }
    
    // Validate booking time
    const bookingDate = new Date(date);
    const now = new Date();
    
    if (bookingDate < now) {
      return res.status(400).json({ message: "Cannot book a past date" });
    }
    
    // Check service availability
    const availability = await ServiceAvailability.findOne({
      where: {
        serviceId,
        date: bookingDate,
        startTime: { [Op.lte]: startTime },
        endTime: { [Op.gte]: endTime || startTime },
        status: 'available'
      }
    });
    
    if (!availability) {
      return res.status(400).json({ message: "Service is not available at the selected time" });
    }
    
    // Calculate booking duration and price
    let duration, totalPrice;
    
    if (service.serviceType === 'fixed') {
      duration = service.duration;
      totalPrice = service.price;
    } else {
      // For hourly or minute services
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      const durationMs = endDateTime - startDateTime;
      
      if (service.serviceType === 'hourly') {
        duration = durationMs / (1000 * 60 * 60); // Convert to hours
        totalPrice = service.price * duration;
      } else {
        duration = durationMs / (1000 * 60); // Convert to minutes
        totalPrice = service.price * duration;
      }
      
      // Validate against minimum and maximum duration
      if (duration < service.minimumDuration) {
        return res.status(400).json({ 
          message: `Booking must be at least ${service.minimumDuration} ${service.serviceType === 'hourly' ? 'hours' : 'minutes'}` 
        });
      }
      
      if (service.maximumDuration && duration > service.maximumDuration) {
        return res.status(400).json({ 
          message: `Booking cannot exceed ${service.maximumDuration} ${service.serviceType === 'hourly' ? 'hours' : 'minutes'}` 
        });
      }
    }
    
    // Calculate deposit amount if required
    const depositAmount = service.depositRequired ? 
      (service.depositAmount > 0 ? service.depositAmount : totalPrice * 0.2) : 0;
    
    // Create booking
    const booking = await Booking.create({
      serviceId,
      userId,
      providerId: service.providerId,
      date: bookingDate,
      startTime,
      endTime: endTime || calculateEndTime(startTime, duration, service.serviceType),
      duration,
      totalPrice,
      depositAmount,
      notes,
      status: service.instantBooking ? 'confirmed' : 'pending'
    });
    
    // Update availability if fully booked
    if (service.serviceType === 'fixed') {
      // For fixed services, mark the time slot as booked
      await updateAvailabilityForBooking(availability, booking);
    }
    
    // Notify service provider
    notifyProvider(service.providerId, 'new_booking', {
      bookingId: booking.id,
      serviceName: service.title,
      date: bookingDate,
      startTime,
      customerName: req.user.name
    });
    
    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
      paymentRequired: service.depositRequired || totalPrice > 0,
      paymentAmount: service.depositRequired ? depositAmount : totalPrice
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Starting a Service Session

```javascript
exports.startServiceSession = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const providerId = req.user.id;
    
    // Find the booking
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        providerId,
        status: 'confirmed'
      },
      include: [{ model: BookableService }]
    });
    
    if (!booking) {
      return res.status(404).json({ message: "Confirmed booking not found" });
    }
    
    // Check if booking is for today
    const today = new Date();
    const bookingDate = new Date(booking.date);
    
    if (bookingDate.toDateString() !== today.toDateString()) {
      return res.status(400).json({ message: "Can only start services scheduled for today" });
    }
    
    // Check if it's time to start the service
    const now = new Date();
    const startTime = new Date(`${booking.date.toDateString()} ${booking.startTime}`);
    const timeBuffer = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    if (now < new Date(startTime.getTime() - timeBuffer)) {
      return res.status(400).json({ message: "Too early to start this service" });
    }
    
    // Update booking status
    booking.status = 'in_progress';
    booking.actualStartTime = now;
    await booking.save();
    
    // For minute-based services, start the timer
    let sessionData = null;
    
    if (booking.BookableService.serviceType === 'minute') {
      sessionData = await ServiceSession.create({
        bookingId,
        startTime: now,
        status: 'active'
      });
    }
    
    // Notify customer
    notifyUser(booking.userId, 'service_started', {
      bookingId,
      serviceName: booking.BookableService.title,
      providerName: req.user.name
    });
    
    res.status(200).json({
      success: true,
      message: "Service started successfully",
      booking,
      sessionData
    });
  } catch (error) {
    console.error("Start service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Completing a Service

```javascript
exports.completeService = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const providerId = req.user.id;
    
    // Find the booking
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        providerId,
        status: 'in_progress'
      },
      include: [{ model: BookableService }]
    });
    
    if (!booking) {
      return res.status(404).json({ message: "In-progress booking not found" });
    }
    
    const now = new Date();
    
    // For minute-based services, stop the timer
    let finalPrice = booking.totalPrice;
    let actualDuration = booking.duration;
    
    if (booking.BookableService.serviceType === 'minute') {
      // Find the active session
      const session = await ServiceSession.findOne({
        where: {
          bookingId,
          status: 'active'
        }
      });
      
      if (session) {
        // Calculate actual duration
        const durationMs = now - new Date(session.startTime);
        actualDuration = Math.ceil(durationMs / (1000 * 60)); // Convert to minutes
        
        // Calculate final price
        finalPrice = booking.BookableService.price * actualDuration;
        
        // Apply minimum charge if applicable
        if (actualDuration < booking.BookableService.minimumDuration) {
          actualDuration = booking.BookableService.minimumDuration;
          finalPrice = booking.BookableService.price * actualDuration;
        }
        
        // Apply maximum cap if applicable
        if (booking.BookableService.maximumDuration && 
            booking.BookableService.maximumDuration < actualDuration) {
          finalPrice = booking.BookableService.price * booking.BookableService.maximumDuration;
        }
        
        // Update session
        session.endTime = now;
        session.duration = actualDuration;
        session.status = 'completed';
        await session.save();
      }
    }
    
    // Update booking
    booking.status = 'completed';
    booking.actualEndTime = now;
    booking.actualDuration = actualDuration;
    booking.finalPrice = finalPrice;
    await booking.save();
    
    // Process final payment if needed
    let paymentResult = null;
    
    if (finalPrice > booking.depositAmount) {
      const remainingAmount = finalPrice - booking.depositAmount;
      
      // Process payment (simplified for example)
      paymentResult = await processPayment({
        amount: remainingAmount,
        currency: 'usd',
        customerId: booking.userId,
        description: `Final payment for ${booking.BookableService.title}`
      });
    }
    
    // Notify customer
    notifyUser(booking.userId, 'service_completed', {
      bookingId,
      serviceName: booking.BookableService.title,
      duration: actualDuration,
      finalPrice,
      additionalPayment: paymentResult ? paymentResult.amount : 0
    });
    
    res.status(200).json({
      success: true,
      message: "Service completed successfully",
      booking,
      paymentResult
    });
  } catch (error) {
    console.error("Complete service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

## Best Practices

1. **Clear Service Descriptions**: Ensure service listings have detailed descriptions
2. **Flexible Scheduling**: Implement flexible scheduling options for providers
3. **Buffer Time**: Add buffer time between bookings to prevent overlaps
4. **Reminders**: Send reminders to both providers and customers
5. **Cancellation Policies**: Implement fair cancellation policies
6. **Real-time Updates**: Provide real-time updates on service status
7. **Mobile Support**: Ensure the booking system works well on mobile devices
8. **Feedback System**: Implement a robust feedback and rating system
9. **Dispute Resolution**: Create a system for handling disputes
10. **Analytics**: Provide analytics for service providers to optimize their offerings