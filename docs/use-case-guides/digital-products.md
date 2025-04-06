# Digital Products Implementation Guide

This guide explains how to implement and test digital product sales and auctions in the MultiVendorMarketPlace platform.

## Overview

Digital products are non-physical items that can be downloaded or accessed online, such as e-books, software, music, videos, or digital art. The platform supports both direct sales and auctions for digital products.

## Key Components

1. **Digital Product Definition**: Sellers define their digital products with details and delivery method
2. **Digital Asset Storage**: Secure storage for digital files
3. **Access Control**: Manages who can access the digital products
4. **Delivery System**: Delivers the digital product to buyers after purchase

## API Endpoints

### Digital Product Management

```
POST /api/products/digital - Create a new digital product
GET /api/products/digital - List all digital products
GET /api/products/digital/:id - Get digital product details
PUT /api/products/digital/:id - Update digital product
DELETE /api/products/digital/:id - Delete digital product
```

### Digital Product Purchase

```
POST /api/products/digital/:id/purchase - Purchase a digital product
GET /api/products/digital/purchased - Get user's purchased digital products
GET /api/products/digital/:id/download - Download a purchased digital product
```

### Digital Product Auctions

```
POST /api/auctions/digital - Create a digital product auction
GET /api/auctions/digital - List digital product auctions
GET /api/auctions/digital/:id - Get digital auction details
POST /api/auctions/digital/:id/bid - Place bid on digital auction
```

## Implementation Steps

1. **Create Digital Product Model**:
   - Extend the base Product model with digital-specific attributes
   - Add fields for file storage, access method, license type, etc.

2. **Implement Secure File Storage**:
   - Set up secure cloud storage (AWS S3, Google Cloud Storage, etc.)
   - Implement signed URLs for secure, time-limited access
   - Handle file uploads with proper validation

3. **Implement Purchase Flow**:
   - Process payment for digital product
   - Grant access to the buyer
   - Deliver download links or access credentials

4. **Implement Digital Product Delivery**:
   - Generate secure download links
   - Implement access expiration if needed
   - Track downloads and access

5. **Implement Digital Auctions**:
   - Extend auction system for digital products
   - Handle digital delivery after auction completion

## Testing Scenarios

### Scenario 1: Digital Product Direct Purchase

1. Seller creates a digital product (e-book)
2. Seller uploads the PDF file
3. Buyer purchases the e-book
4. System processes payment
5. Buyer receives download link
6. Buyer successfully downloads the file

### Scenario 2: Digital Product with License Key

1. Seller creates a software product
2. Seller adds license keys to the product
3. Buyer purchases the software
4. System assigns a license key to the buyer
5. Buyer receives the license key and download link

### Scenario 3: Digital Product Auction

1. Seller creates an auction for a digital artwork
2. Multiple buyers place bids
3. Auction ends with a winning bid
4. System processes payment from the winner
5. Winner receives the digital artwork

### Scenario 4: Subscription-based Digital Product

1. Seller creates a subscription-based digital product
2. Buyer purchases a subscription
3. Buyer gets access for the subscription period
4. System handles recurring billing
5. System revokes access when subscription ends

## Sample Code

### Creating a Digital Product

```javascript
// Controller function
exports.createDigitalProduct = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      price, 
      categoryId, 
      deliveryType, // 'download', 'access_key', 'online_access'
      licenseType, // 'single_user', 'multi_user', 'subscription'
      subscriptionPeriod // null, 'monthly', 'yearly'
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !price || !categoryId || !deliveryType) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Handle file upload if present
    let fileUrl = null;
    let fileKey = null;
    
    if (req.file) {
      // Upload to cloud storage
      const uploadResult = await uploadToStorage(req.file);
      fileUrl = uploadResult.url;
      fileKey = uploadResult.key;
    } else if (deliveryType === 'download') {
      return res.status(400).json({ message: "File is required for downloadable products" });
    }
    
    // Create digital product
    const product = await DigitalProduct.create({
      title,
      description,
      price,
      categoryId,
      sellerId: req.user.id,
      productType: 'digital',
      deliveryType,
      licenseType,
      subscriptionPeriod,
      fileUrl,
      fileKey,
      status: 'active'
    });
    
    res.status(201).json({
      success: true,
      message: "Digital product created successfully",
      product
    });
  } catch (error) {
    console.error("Create digital product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Purchasing a Digital Product

```javascript
exports.purchaseDigitalProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    // Find the product
    const product = await DigitalProduct.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Digital product not found" });
    }
    
    if (product.status !== 'active') {
      return res.status(400).json({ message: "This product is not available for purchase" });
    }
    
    // Check if user already purchased this product (for non-subscription products)
    if (product.licenseType !== 'subscription') {
      const existingPurchase = await DigitalPurchase.findOne({
        where: {
          productId,
          buyerId: userId,
          status: { [Op.in]: ['active', 'completed'] }
        }
      });
      
      if (existingPurchase) {
        return res.status(400).json({ 
          message: "You have already purchased this product",
          purchaseId: existingPurchase.id
        });
      }
    }
    
    // Process payment (simplified for example)
    const paymentResult = await processPayment({
      amount: product.price,
      currency: 'usd',
      customerId: userId,
      description: `Purchase of ${product.title}`
    });
    
    if (!paymentResult.success) {
      return res.status(400).json({ 
        message: "Payment failed", 
        error: paymentResult.error 
      });
    }
    
    // Create purchase record
    const purchase = await DigitalPurchase.create({
      productId,
      buyerId: userId,
      sellerId: product.sellerId,
      amount: product.price,
      paymentId: paymentResult.paymentId,
      status: 'completed',
      accessExpiration: product.subscriptionPeriod ? 
        calculateExpirationDate(product.subscriptionPeriod) : null
    });
    
    // Generate access credentials based on delivery type
    let accessDetails = {};
    
    if (product.deliveryType === 'download') {
      // Generate signed download URL
      accessDetails.downloadUrl = await generateSignedUrl(product.fileKey);
      accessDetails.expiresIn = '24 hours';
    } else if (product.deliveryType === 'access_key') {
      // Assign license key
      const licenseKey = await assignLicenseKey(product.id, userId);
      accessDetails.licenseKey = licenseKey;
    } else if (product.deliveryType === 'online_access') {
      // Generate access credentials
      accessDetails.accessUrl = `${process.env.CLIENT_URL}/access/${purchase.id}`;
    }
    
    // Update purchase with access details
    purchase.accessDetails = accessDetails;
    await purchase.save();
    
    // Notify seller
    notifyNewSale(product.sellerId, {
      productId: product.id,
      productTitle: product.title,
      buyerId: userId,
      amount: product.price
    });
    
    res.status(200).json({
      success: true,
      message: "Digital product purchased successfully",
      purchase,
      accessDetails
    });
  } catch (error) {
    console.error("Purchase digital product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

## Best Practices

1. **Secure File Storage**: Use secure, encrypted storage for digital assets
2. **Access Control**: Implement proper authentication for digital product access
3. **Download Limits**: Consider implementing download limits to prevent abuse
4. **Watermarking**: Add watermarks to digital content to discourage unauthorized sharing
5. **License Management**: Implement proper license tracking and validation
6. **Backup System**: Maintain backups of all digital products
7. **Version Control**: Allow sellers to update digital products with new versions