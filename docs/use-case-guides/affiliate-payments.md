# Affiliate Payments Implementation Guide

This guide explains how to implement and test affiliate marketing and payment systems in the MultiVendorMarketPlace platform.

## Overview

The affiliate system allows users to promote products and earn commissions on resulting sales. This creates an additional sales channel for sellers and income opportunities for affiliates.

## Key Components

1. **Affiliate Program**: System for registering and managing affiliates
2. **Tracking System**: Tracks referrals and attributes sales to affiliates
3. **Commission Structure**: Rules for calculating affiliate commissions
4. **Payment System**: Handles affiliate commission payments

## API Endpoints

### Affiliate Program Management

```
POST /api/affiliates/apply - Apply to become an affiliate
GET /api/affiliates/status - Check affiliate application status
GET /api/affiliates/dashboard - Get affiliate dashboard data
```

### Affiliate Link Management

```
POST /api/affiliates/links - Create a new affiliate link
GET /api/affiliates/links - List affiliate's links
GET /api/affiliates/links/:id - Get affiliate link details
DELETE /api/affiliates/links/:id - Delete affiliate link
```

### Affiliate Tracking

```
GET /api/affiliates/clicks - Get click statistics
GET /api/affiliates/conversions - Get conversion statistics
GET /api/affiliates/earnings - Get earnings statistics
```

### Affiliate Payments

```
GET /api/affiliates/payments - Get payment history
POST /api/affiliates/payments/withdraw - Request payment withdrawal
GET /api/affiliates/payments/methods - Get payment methods
POST /api/affiliates/payments/methods - Add payment method
```

## Implementation Steps

1. **Create Affiliate Program**:
   - Implement affiliate application and approval process
   - Create affiliate dashboard
   - Define commission rates and rules

2. **Implement Tracking System**:
   - Create affiliate link generator
   - Implement click tracking
   - Implement conversion tracking
   - Create attribution logic

3. **Implement Commission System**:
   - Define commission calculation rules
   - Implement commission tracking
   - Create reporting system

4. **Implement Payment System**:
   - Integrate with payment providers
   - Implement payment request handling
   - Create payment history tracking

## Testing Scenarios

### Scenario 1: Becoming an Affiliate

1. User applies to become an affiliate
2. Admin reviews and approves the application
3. User receives affiliate status
4. User can access affiliate dashboard

### Scenario 2: Creating and Using Affiliate Links

1. Affiliate creates a link for a specific product
2. Affiliate shares the link on social media
3. Customer clicks on the affiliate link
4. System records the click and sets a tracking cookie
5. Customer makes a purchase
6. System attributes the sale to the affiliate

### Scenario 3: Tracking Affiliate Performance

1. Affiliate logs into dashboard
2. Affiliate views click statistics
3. Affiliate views conversion rates
4. Affiliate analyzes performance by product/category

### Scenario 4: Affiliate Commission Payment

1. Affiliate earns commissions from sales
2. Commissions are held during the return period
3. Commissions are marked as available after the holding period
4. Affiliate requests payment
5. System processes the payment
6. Affiliate receives funds

## Sample Code

### Applying to Become an Affiliate

```javascript
// Controller function
exports.applyForAffiliate = async (req, res) => {
  try {
    const { 
      marketingChannels, 
      website, 
      socialMediaProfiles,
      expectedTraffic,
      marketingStrategy
    } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!marketingChannels || marketingChannels.length === 0) {
      return res.status(400).json({ message: "Please specify at least one marketing channel" });
    }
    
    // Check if user already has an affiliate account or pending application
    const existingAffiliate = await Affiliate.findOne({
      where: {
        userId
      }
    });
    
    if (existingAffiliate) {
      return res.status(400).json({ 
        message: "You already have an affiliate account or pending application",
        status: existingAffiliate.status
      });
    }
    
    // Create affiliate application
    const affiliate = await Affiliate.create({
      userId,
      marketingChannels,
      website,
      socialMediaProfiles,
      expectedTraffic,
      marketingStrategy,
      status: 'pending',
      commissionTier: 'standard' // Default tier
    });
    
    // Notify admins of new application
    notifyAdmins('new_affiliate_application', {
      affiliateId: affiliate.id,
      userId,
      marketingChannels
    });
    
    res.status(201).json({
      success: true,
      message: "Affiliate application submitted successfully",
      affiliate
    });
  } catch (error) {
    console.error("Affiliate application error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Creating an Affiliate Link

```javascript
exports.createAffiliateLink = async (req, res) => {
  try {
    const { 
      productId, 
      campaignName, 
      utmSource, 
      utmMedium, 
      utmCampaign 
    } = req.body;
    const userId = req.user.id;
    
    // Validate affiliate status
    const affiliate = await Affiliate.findOne({
      where: {
        userId,
        status: 'approved'
      }
    });
    
    if (!affiliate) {
      return res.status(403).json({ message: "You must be an approved affiliate to create links" });
    }
    
    // Validate product exists
    if (productId) {
      const product = await Product.findByPk(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if product allows affiliate marketing
      if (!product.allowAffiliates) {
        return res.status(400).json({ message: "This product does not allow affiliate marketing" });
      }
    }
    
    // Generate unique tracking code
    const trackingCode = generateUniqueCode(10);
    
    // Create affiliate link
    const affiliateLink = await AffiliateLink.create({
      affiliateId: affiliate.id,
      productId, // Can be null for general store links
      campaignName: campaignName || 'Default Campaign',
      trackingCode,
      utmSource: utmSource || 'affiliate',
      utmMedium: utmMedium || 'referral',
      utmCampaign: utmCampaign || trackingCode,
      status: 'active',
      clicks: 0,
      conversions: 0
    });
    
    // Generate the full URL
    const baseUrl = productId 
      ? `${process.env.CLIENT_URL}/product/${productId}` 
      : process.env.CLIENT_URL;
      
    const fullUrl = `${baseUrl}?ref=${trackingCode}&utm_source=${affiliateLink.utmSource}&utm_medium=${affiliateLink.utmMedium}&utm_campaign=${affiliateLink.utmCampaign}`;
    
    // Update with full URL
    affiliateLink.fullUrl = fullUrl;
    await affiliateLink.save();
    
    res.status(201).json({
      success: true,
      message: "Affiliate link created successfully",
      affiliateLink,
      fullUrl
    });
  } catch (error) {
    console.error("Create affiliate link error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Tracking Affiliate Clicks

```javascript
exports.trackAffiliateClick = async (req, res) => {
  try {
    const { ref } = req.query;
    
    if (!ref) {
      return res.status(400).json({ message: "Missing tracking code" });
    }
    
    // Find the affiliate link
    const affiliateLink = await AffiliateLink.findOne({
      where: {
        trackingCode: ref,
        status: 'active'
      }
    });
    
    if (!affiliateLink) {
      return res.status(404).json({ message: "Invalid tracking code" });
    }
    
    // Update click count
    affiliateLink.clicks += 1;
    await affiliateLink.save();
    
    // Record click details
    await AffiliateClick.create({
      affiliateLinkId: affiliateLink.id,
      affiliateId: affiliateLink.affiliateId,
      productId: affiliateLink.productId,
      ipAddress: anonymizeIp(req.ip),
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || null
    });
    
    // Set tracking cookie
    res.cookie('affiliate_ref', ref, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.status(200).json({
      success: true,
      message: "Click tracked successfully"
    });
  } catch (error) {
    console.error("Track affiliate click error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Processing Affiliate Commissions

```javascript
exports.processAffiliateCommission = async (orderId) => {
  try {
    // Find the order
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem, include: [{ model: Product }] },
        { model: User, as: 'buyer' }
      ]
    });
    
    if (!order || order.status !== 'completed') {
      return { success: false, message: "Order not found or not completed" };
    }
    
    // Check for affiliate tracking code
    const affiliateRef = order.buyer.affiliateRef;
    
    if (!affiliateRef) {
      return { success: false, message: "No affiliate reference found" };
    }
    
    // Find the affiliate link
    const affiliateLink = await AffiliateLink.findOne({
      where: {
        trackingCode: affiliateRef,
        status: 'active'
      },
      include: [{ model: Affiliate }]
    });
    
    if (!affiliateLink) {
      return { success: false, message: "Invalid affiliate reference" };
    }
    
    // Calculate commission
    let totalCommission = 0;
    const commissionDetails = [];
    
    for (const item of order.OrderItems) {
      // Skip if product doesn't allow affiliates
      if (!item.Product.allowAffiliates) continue;
      
      // Skip if specific product link but different product
      if (affiliateLink.productId && affiliateLink.productId !== item.productId) continue;
      
      // Get commission rate (product-specific or affiliate's default rate)
      const commissionRate = item.Product.affiliateCommissionRate || 
                            affiliateLink.Affiliate.commissionRate;
      
      // Calculate item commission
      const itemCommission = (item.price * item.quantity * commissionRate) / 100;
      
      totalCommission += itemCommission;
      
      commissionDetails.push({
        productId: item.productId,
        productName: item.Product.title,
        quantity: item.quantity,
        price: item.price,
        commissionRate,
        commission: itemCommission
      });
    }
    
    if (totalCommission <= 0) {
      return { success: false, message: "No commission applicable for this order" };
    }
    
    // Create commission record
    const commission = await AffiliateCommission.create({
      affiliateId: affiliateLink.affiliateId,
      affiliateLinkId: affiliateLink.id,
      orderId,
      amount: totalCommission,
      details: commissionDetails,
      status: 'pending', // Will be released after return period
      releaseDate: calculateReleaseDate()
    });
    
    // Update conversion count
    affiliateLink.conversions += 1;
    await affiliateLink.save();
    
    // Notify affiliate
    notifyAffiliate(affiliateLink.affiliateId, 'new_commission', {
      orderId,
      commission: totalCommission,
      releaseDate: commission.releaseDate
    });
    
    return {
      success: true,
      message: "Affiliate commission processed successfully",
      commission
    };
  } catch (error) {
    console.error("Process affiliate commission error:", error);
    return { success: false, message: "Error processing commission", error };
  }
};
```

## Best Practices

1. **Transparent Commission Structure**: Clearly communicate commission rates and terms
2. **Fraud Prevention**: Implement measures to detect and prevent affiliate fraud
3. **Cookie Duration**: Set appropriate cookie duration for tracking
4. **Performance Metrics**: Provide detailed performance metrics for affiliates
5. **Marketing Materials**: Provide affiliates with high-quality marketing materials
6. **Compliance**: Ensure affiliates comply with marketing regulations
7. **Payment Options**: Offer multiple payment methods for affiliates
8. **Tiered Commissions**: Consider implementing tiered commission rates based on performance