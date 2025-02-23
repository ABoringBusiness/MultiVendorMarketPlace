import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { ROLES } from "../constants/roles.js";
import { ProductModel } from "../models/supabase/productModel.js";
import { OrderModel } from "../models/supabase/orderModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { supabase } from "../database/connection.js";

// Disable a seller
export const disableSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Check authentication first (401)
  if (!req.user || !req.user.role) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  // Check admin role (403)
  if (req.user.role.toUpperCase() !== ROLES.ADMIN.toUpperCase()) {
    return next(new ErrorHandler("Only admins can perform this action.", 403));
  }

  try {
    // Check if seller exists and is actually a seller
    const { data: seller, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (findError) {
      console.error('Error finding seller:', findError);
      return next(new ErrorHandler("Failed to find seller", 500));
    }

    if (!seller) {
      return next(new ErrorHandler("Seller not found.", 404));
    }

    if (seller.role.toUpperCase() !== ROLES.SELLER.toUpperCase()) {
      return next(new ErrorHandler("User is not a seller.", 404));
    }

    // Update seller status
    const { data: updatedSeller, error } = await supabase
      .from('users')
      .update({
        status: 'disabled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error disabling seller:', error);
      return next(new ErrorHandler("Failed to disable seller", 500));
    }

    // Send response
    res.status(200).json({
      success: true,
      message: "Seller disabled successfully.",
      seller: updatedSeller
    });

    // Notify seller via email in background
    try {
      await sendEmail({
        email: seller.email,
        subject: "Account Disabled",
        message: "Your seller account has been disabled by an administrator. Please contact support for more information."
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }
  } catch (error) {
    console.error('Error in disabling seller:', error);
    return next(new ErrorHandler("Failed to disable seller", 500));
  }
});

// Disable a product
export const disableProduct = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update({
      status: 'disabled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating product:', updateError);
    return next(new ErrorHandler("Failed to update product", 500));
  }

  // Notify seller
  const seller = await UserModel.findById(product.seller_id);
  if (seller) {
    await sendEmail({
      email: seller.email,
      subject: "Product Disabled",
      message: `Your product "${product.title}" has been disabled by an administrator. Please contact support for more information.`
    });
  }

  res.status(200).json({
    success: true,
    message: "Product disabled successfully.",
    product: updatedProduct
  });
});

// Override order status
export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await OrderModel.findById(id);
  if (!order) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  // Validate status
  const validStatuses = ['pending', 'paid', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid status.", 400));
  }

  const updatedOrder = await OrderModel.update(id, {
    status,
    updated_at: new Date()
  });

  // Notify both buyer and seller
  const [buyer, seller] = await Promise.all([
    UserModel.findById(order.buyer_id),
    UserModel.findById(order.seller_id)
  ]);

  if (buyer) {
    await sendEmail({
      email: buyer.email,
      subject: "Order Status Updated",
      message: `Your order status has been updated to ${status} by an administrator.`
    });
  }

  if (seller) {
    await sendEmail({
      email: seller.email,
      subject: "Order Status Updated",
      message: `Order status has been updated to ${status} by an administrator.`
    });
  }

  res.status(200).json({
    success: true,
    message: "Order status updated successfully.",
    order: updatedOrder
  });
});
