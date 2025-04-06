# Minute-Based Services Implementation Guide

This guide explains how to implement and test minute-based service billing in the MultiVendorMarketPlace platform.

## Overview

Minute-based services allow service providers to charge customers based on the actual time spent providing the service. The system tracks service usage in real-time and bills accordingly.

## Key Components

1. **Service Definition**: Service providers define their services with per-minute rates
2. **Service Session**: Tracks the start and end time of service usage
3. **Billing Calculation**: Calculates the final amount based on minutes used
4. **Payment Processing**: Handles payment for the service

## API Endpoints

### Service Management

```
POST /api/services - Create a new service
GET /api/services - List all services
GET /api/services/:id - Get service details
PUT /api/services/:id - Update service
DELETE /api/services/:id - Delete service
```

### Service Usage Tracking

```
POST /api/services/sessions/start - Start a service session
PUT /api/services/sessions/:id/stop - Stop a service session
GET /api/services/sessions/active - Get user's active sessions
GET /api/services/sessions/history - Get user's session history
```

### Service Billing

```
GET /api/services/billing - Get billing history
POST /api/services/billing/pay - Pay for service usage
```

## Implementation Steps

1. **Create Service Model**:
   - Define service with name, description, per-minute rate, provider ID
   - Include any service-specific attributes

2. **Create Session Model**:
   - Track service ID, user ID, start time, end time, status
   - Calculate duration and amount

3. **Implement Real-time Tracking**:
   - Use WebSockets to maintain connection during service
   - Update session status in real-time
   - Handle disconnections gracefully

4. **Implement Billing Logic**:
   - Calculate final amount based on minutes used
   - Apply any discounts or promotions
   - Generate invoice

5. **Integrate Payment Processing**:
   - Connect with Stripe for payment processing
   - Handle payment success/failure
   - Update session status after payment

## Testing Scenarios

### Scenario 1: Basic Service Usage

1. Provider creates a service with $1/minute rate
2. User starts a service session
3. User uses the service for 10 minutes
4. User stops the service session
5. System calculates $10 charge
6. User pays for the service

### Scenario 2: Service Interruption

1. User starts a service session
2. Connection is lost during the session
3. System detects disconnection and pauses billing
4. User reconnects and continues the session
5. System calculates correct amount based on actual usage

### Scenario 3: Service with Minimum Charge

1. Provider creates a service with $1/minute rate and 5-minute minimum
2. User starts a service session
3. User uses the service for 3 minutes
4. System applies the 5-minute minimum charge ($5)

### Scenario 4: Service with Maximum Cap

1. Provider creates a service with $1/minute rate and $50 maximum cap
2. User uses the service for 60 minutes
3. System caps the charge at $50 instead of $60

## Sample Code

### Starting a Service Session

```javascript
// Controller function
exports.startServiceSession = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const userId = req.user.id;
    
    // Validate service exists
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    // Check if user already has an active session for this service
    const activeSession = await ServiceSession.findOne({
      where: {
        serviceId,
        userId,
        status: 'active'
      }
    });
    
    if (activeSession) {
      return res.status(400).json({ 
        message: "You already have an active session for this service",
        sessionId: activeSession.id
      });
    }
    
    // Create new session
    const session = await ServiceSession.create({
      serviceId,
      userId,
      startTime: new Date(),
      status: 'active'
    });
    
    // Emit event for real-time tracking
    io.to(`user-${userId}`).emit('session-started', {
      sessionId: session.id,
      serviceId,
      startTime: session.startTime
    });
    
    res.status(201).json({
      success: true,
      message: "Service session started",
      session
    });
  } catch (error) {
    console.error("Start service session error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Stopping a Service Session

```javascript
exports.stopServiceSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Find the session
    const session = await ServiceSession.findOne({
      where: {
        id: sessionId,
        userId,
        status: 'active'
      },
      include: [{ model: Service }]
    });
    
    if (!session) {
      return res.status(404).json({ message: "Active session not found" });
    }
    
    // Update session
    const endTime = new Date();
    const durationMs = endTime - new Date(session.startTime);
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    
    // Apply minimum charge if applicable
    const effectiveMinutes = Math.max(
      durationMinutes, 
      session.Service.minimumMinutes || 0
    );
    
    // Apply maximum cap if applicable
    const ratePerMinute = session.Service.ratePerMinute;
    let amount = effectiveMinutes * ratePerMinute;
    
    if (session.Service.maximumCharge && amount > session.Service.maximumCharge) {
      amount = session.Service.maximumCharge;
    }
    
    // Update session
    session.endTime = endTime;
    session.durationMinutes = durationMinutes;
    session.amount = amount;
    session.status = 'completed';
    await session.save();
    
    // Emit event for real-time tracking
    io.to(`user-${userId}`).emit('session-stopped', {
      sessionId: session.id,
      endTime,
      durationMinutes,
      amount
    });
    
    res.status(200).json({
      success: true,
      message: "Service session stopped",
      session
    });
  } catch (error) {
    console.error("Stop service session error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

## Best Practices

1. **Accurate Time Tracking**: Ensure server-side time tracking for accuracy
2. **Handling Disconnections**: Implement heartbeat mechanism to detect disconnections
3. **Transparent Billing**: Provide real-time cost estimates to users
4. **Dispute Resolution**: Allow for session reviews and dispute handling
5. **Usage Limits**: Implement maximum session duration or spending limits