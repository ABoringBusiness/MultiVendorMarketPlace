# Custom Clothing Design and Reselling Implementation Guide

This guide explains how to implement and test custom clothing design with commission-based reselling in the MultiVendorMarketPlace platform.

## Overview

The custom clothing feature allows users to design custom apparel items and either purchase them directly or become resellers who earn commissions on sales. This creates a multi-tiered selling system where original designers and resellers both benefit.

## Key Components

1. **Design Tool**: Interface for creating custom clothing designs
2. **Product Customization**: System for applying designs to clothing items
3. **Commission Structure**: Rules for calculating commissions on resold items
4. **Reseller Management**: System for tracking and managing resellers

## API Endpoints

### Design Management

```
POST /api/designs - Create a new design
GET /api/designs - List user's designs
GET /api/designs/:id - Get design details
PUT /api/designs/:id - Update design
DELETE /api/designs/:id - Delete design
```

### Custom Product Management

```
POST /api/products/custom - Create a custom product with design
GET /api/products/custom - List custom products
GET /api/products/custom/:id - Get custom product details
PUT /api/products/custom/:id - Update custom product
DELETE /api/products/custom/:id - Delete custom product
```

### Reseller Management

```
POST /api/resellers/apply - Apply to become a reseller
GET /api/resellers/status - Check reseller application status
GET /api/resellers/products - Get products available for reselling
POST /api/resellers/products/:id/list - List a product for reselling
```

### Commission Management

```
GET /api/commissions - Get commission history
GET /api/commissions/stats - Get commission statistics
POST /api/commissions/:id/withdraw - Withdraw commission earnings
```

## Implementation Steps

1. **Create Design System**:
   - Implement design creation and storage
   - Support various design elements (text, images, patterns)
   - Implement design preview on different products

2. **Create Custom Product System**:
   - Define base products (t-shirts, hoodies, etc.)
   - Implement customization options (sizes, colors, materials)
   - Create pricing calculator based on customizations

3. **Implement Reseller System**:
   - Create reseller application and approval process
   - Implement reseller dashboard
   - Create product listing system for resellers

4. **Implement Commission System**:
   - Define commission rates and rules
   - Create commission calculation logic
   - Implement commission tracking and reporting
   - Create commission payout system

## Testing Scenarios

### Scenario 1: Custom Design Creation and Purchase

1. User creates a custom design
2. User applies design to a t-shirt
3. User selects size, color, and quantity
4. User purchases the custom t-shirt
5. System processes the order and sends it to production

### Scenario 2: Becoming a Reseller

1. User applies to become a reseller
2. Admin approves the reseller application
3. Reseller gets access to reseller dashboard
4. Reseller can view available products for reselling

### Scenario 3: Reselling a Custom Product

1. Reseller browses available designs
2. Reseller selects a design to resell
3. Reseller sets their markup (within allowed limits)
4. Reseller lists the product in their store
5. Customer purchases from the reseller
6. Original designer receives base commission
7. Reseller receives markup commission

### Scenario 4: Commission Tracking and Withdrawal

1. Reseller views their commission dashboard
2. Reseller sees sales and commission statistics
3. Reseller requests commission withdrawal
4. System processes the withdrawal
5. Reseller receives payment

## Sample Code

### Creating a Custom Design

```javascript
// Controller function
exports.createDesign = async (req, res) => {
  try {
    const { name, description, designType, elements, tags } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!name || !designType || !elements) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Validate design elements
    if (!Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ message: "Design must contain at least one element" });
    }
    
    // Create design
    const design = await Design.create({
      name,
      description,
      designType,
      elements,
      tags: tags || [],
      creatorId: userId,
      status: 'active',
      isPublic: false // Default to private
    });
    
    // Generate preview image
    const previewUrl = await generateDesignPreview(design.id, elements);
    
    // Update design with preview URL
    design.previewUrl = previewUrl;
    await design.save();
    
    res.status(201).json({
      success: true,
      message: "Design created successfully",
      design
    });
  } catch (error) {
    console.error("Create design error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Creating a Custom Product

```javascript
exports.createCustomProduct = async (req, res) => {
  try {
    const { 
      designId, 
      baseProductId, 
      customizations, 
      price,
      allowReselling,
      commissionRate
    } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!designId || !baseProductId || !customizations || !price) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    
    // Validate design ownership
    const design = await Design.findOne({
      where: {
        id: designId,
        creatorId: userId
      }
    });
    
    if (!design) {
      return res.status(403).json({ message: "You don't have permission to use this design" });
    }
    
    // Validate base product
    const baseProduct = await BaseProduct.findByPk(baseProductId);
    
    if (!baseProduct) {
      return res.status(404).json({ message: "Base product not found" });
    }
    
    // Validate customizations
    const validCustomizations = validateCustomizations(customizations, baseProduct.availableCustomizations);
    
    if (!validCustomizations.valid) {
      return res.status(400).json({ 
        message: "Invalid customizations", 
        errors: validCustomizations.errors 
      });
    }
    
    // Calculate production cost
    const productionCost = calculateProductionCost(baseProduct, customizations);
    
    // Validate price (must be higher than production cost)
    if (price <= productionCost) {
      return res.status(400).json({ 
        message: "Price must be higher than production cost", 
        productionCost 
      });
    }
    
    // Create custom product
    const customProduct = await CustomProduct.create({
      designId,
      baseProductId,
      customizations,
      price,
      productionCost,
      creatorId: userId,
      allowReselling: allowReselling || false,
      commissionRate: commissionRate || 10, // Default 10%
      status: 'active'
    });
    
    // Generate product images
    const productImages = await generateProductImages(designId, baseProductId, customizations);
    
    // Add images to product
    await Promise.all(productImages.map(image => 
      ProductImage.create({
        productId: customProduct.id,
        url: image.url,
        isPrimary: image.isPrimary
      })
    ));
    
    // Get product with images
    const productWithImages = await CustomProduct.findByPk(customProduct.id, {
      include: [{ model: ProductImage }]
    });
    
    res.status(201).json({
      success: true,
      message: "Custom product created successfully",
      product: productWithImages
    });
  } catch (error) {
    console.error("Create custom product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Applying to Become a Reseller

```javascript
exports.applyForReseller = async (req, res) => {
  try {
    const { 
      storeName, 
      description, 
      socialMediaLinks,
      marketingPlan
    } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!storeName) {
      return res.status(400).json({ message: "Store name is required" });
    }
    
    // Check if user already has a reseller account or pending application
    const existingReseller = await Reseller.findOne({
      where: {
        userId
      }
    });
    
    if (existingReseller) {
      return res.status(400).json({ 
        message: "You already have a reseller account or pending application",
        status: existingReseller.status
      });
    }
    
    // Create reseller application
    const reseller = await Reseller.create({
      userId,
      storeName,
      description,
      socialMediaLinks,
      marketingPlan,
      status: 'pending',
      commissionTier: 'standard' // Default tier
    });
    
    // Notify admins of new application
    notifyAdmins('new_reseller_application', {
      resellerId: reseller.id,
      userId,
      storeName
    });
    
    res.status(201).json({
      success: true,
      message: "Reseller application submitted successfully",
      reseller
    });
  } catch (error) {
    console.error("Reseller application error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Listing a Product for Reselling

```javascript
exports.listProductForReselling = async (req, res) => {
  try {
    const { productId } = req.params;
    const { markup } = req.body;
    const userId = req.user.id;
    
    // Validate reseller status
    const reseller = await Reseller.findOne({
      where: {
        userId,
        status: 'approved'
      }
    });
    
    if (!reseller) {
      return res.status(403).json({ message: "You must be an approved reseller to list products" });
    }
    
    // Find the product
    const product = await CustomProduct.findOne({
      where: {
        id: productId,
        allowReselling: true,
        status: 'active'
      }
    });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or not available for reselling" });
    }
    
    // Validate markup
    const minMarkup = 5; // 5%
    const maxMarkup = 50; // 50%
    
    if (markup < minMarkup || markup > maxMarkup) {
      return res.status(400).json({ 
        message: `Markup must be between ${minMarkup}% and ${maxMarkup}%` 
      });
    }
    
    // Calculate reseller price
    const basePrice = product.price;
    const markupAmount = (basePrice * markup) / 100;
    const resellerPrice = basePrice + markupAmount;
    
    // Create reseller listing
    const listing = await ResellerListing.create({
      productId,
      resellerId: reseller.id,
      basePrice,
      markup,
      resellerPrice,
      status: 'active'
    });
    
    res.status(201).json({
      success: true,
      message: "Product listed for reselling successfully",
      listing
    });
  } catch (error) {
    console.error("List product for reselling error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

## Best Practices

1. **Design Protection**: Implement watermarking and copyright protection for designs
2. **Quality Control**: Establish quality standards for custom products
3. **Fair Commission Structure**: Create transparent and fair commission rates
4. **Reseller Vetting**: Implement thorough vetting process for resellers
5. **Dispute Resolution**: Create a system for handling disputes between designers and resellers
6. **Marketing Tools**: Provide marketing tools and resources for resellers
7. **Analytics**: Provide detailed analytics for both designers and resellers