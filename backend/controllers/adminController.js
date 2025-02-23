import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { ProductModel } from "../models/supabase/productModel.js";
import { OrderModel } from "../models/supabase/orderModel.js";
import { UserModel } from "../models/supabase/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";

// Disable a seller
export const disableSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const seller = await UserModel.findById(id);

  if (!seller) {
    return next(new ErrorHandler("Seller not found.", 404));
  }

  if (seller.role !== 'seller') {
    return next(new ErrorHandler("User is not a seller.", 400));
  }

  const updatedSeller = await UserModel.update(id, {
    status: 'disabled',
    updated_at: new Date()
  });

  // Notify seller via email
  await sendEmail({
    email: seller.email,
    subject: "Account Disabled",
    message: "Your seller account has been disabled by an administrator. Please contact support for more information."
  });

  res.status(200).json({
    success: true,
    message: "Seller disabled successfully.",
    seller: updatedSeller
  });
});

// Disable a product
export const disableProduct = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const updatedProduct = await ProductModel.update(id, {
    status: 'disabled',
    updated_at: new Date()
  });

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
