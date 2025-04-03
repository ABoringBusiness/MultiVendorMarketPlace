const notificationService = require('../services/notificationService');

// Order notification helpers
const orderNotifications = {
  // Notify buyer when order is created
  orderCreated: async (order, buyer) => {
    await notificationService.createNotification(
      buyer.id,
      'Order Placed Successfully',
      `Your order #${order.orderNumber} has been placed successfully.`,
      'order',
      `/orders/${order.id}`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );
  },
  
  // Notify seller when a new order is received
  newOrderReceived: async (order, seller) => {
    await notificationService.createNotification(
      seller.id,
      'New Order Received',
      `You have received a new order #${order.orderNumber}.`,
      'order',
      `/seller/orders/${order.id}`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );
  },
  
  // Notify buyer when order status is updated
  orderStatusUpdated: async (order, buyer) => {
    const statusMessages = {
      'processing': 'Your order is now being processed.',
      'shipped': 'Your order has been shipped.',
      'delivered': 'Your order has been delivered.',
      'cancelled': 'Your order has been cancelled.'
    };
    
    await notificationService.createNotification(
      buyer.id,
      `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
      `Order #${order.orderNumber}: ${statusMessages[order.status] || 'Status has been updated.'}`,
      'order',
      `/orders/${order.id}`,
      { orderId: order.id, orderNumber: order.orderNumber, status: order.status }
    );
  },
  
  // Notify buyer when payment is successful
  paymentSuccessful: async (order, buyer) => {
    await notificationService.createNotification(
      buyer.id,
      'Payment Successful',
      `Your payment for order #${order.orderNumber} was successful.`,
      'payment',
      `/orders/${order.id}`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );
  },
  
  // Notify buyer when payment fails
  paymentFailed: async (order, buyer) => {
    await notificationService.createNotification(
      buyer.id,
      'Payment Failed',
      `Your payment for order #${order.orderNumber} has failed. Please try again.`,
      'payment',
      `/orders/${order.id}/payment`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );
  }
};

// Auction notification helpers
const auctionNotifications = {
  // Notify seller when auction is created
  auctionCreated: async (auction, seller) => {
    await notificationService.createNotification(
      seller.id,
      'Auction Created',
      `Your auction "${auction.title}" has been created successfully.`,
      'auction',
      `/auctions/${auction.id}`,
      { auctionId: auction.id }
    );
  },
  
  // Notify bidders when auction is about to end
  auctionEnding: async (auction, bidderIds) => {
    if (bidderIds.length === 0) return;
    
    await notificationService.createNotificationForUsers(
      bidderIds,
      'Auction Ending Soon',
      `The auction "${auction.title}" is ending in 1 hour.`,
      'auction',
      `/auctions/${auction.id}`,
      { auctionId: auction.id }
    );
  },
  
  // Notify winner when auction ends
  auctionWon: async (auction, winner) => {
    await notificationService.createNotification(
      winner.id,
      'Auction Won',
      `Congratulations! You won the auction "${auction.title}".`,
      'auction',
      `/auctions/${auction.id}`,
      { auctionId: auction.id }
    );
  },
  
  // Notify seller when auction ends
  auctionEnded: async (auction, seller) => {
    await notificationService.createNotification(
      seller.id,
      'Auction Ended',
      `Your auction "${auction.title}" has ended.`,
      'auction',
      `/auctions/${auction.id}`,
      { auctionId: auction.id }
    );
  },
  
  // Notify bidder when outbid
  bidOutbid: async (auction, outbidUser) => {
    await notificationService.createNotification(
      outbidUser.id,
      'You Have Been Outbid',
      `Someone has placed a higher bid on "${auction.title}".`,
      'bid',
      `/auctions/${auction.id}`,
      { auctionId: auction.id }
    );
  },
  
  // Notify bidder when bid is placed
  bidPlaced: async (auction, bidder) => {
    await notificationService.createNotification(
      bidder.id,
      'Bid Placed Successfully',
      `Your bid on "${auction.title}" has been placed successfully.`,
      'bid',
      `/auctions/${auction.id}`,
      { auctionId: auction.id }
    );
  }
};

// Penny auction notification helpers
const pennyAuctionNotifications = {
  // Notify bidder when bid is placed
  bidPlaced: async (pennyAuction, bidder) => {
    await notificationService.createNotification(
      bidder.id,
      'Bid Placed Successfully',
      `Your bid on "${pennyAuction.title}" has been placed successfully.`,
      'bid',
      `/penny-auctions/${pennyAuction.id}`,
      { pennyAuctionId: pennyAuction.id }
    );
  },
  
  // Notify bidder when auto-bid is activated
  autoBidActivated: async (pennyAuction, bidder) => {
    await notificationService.createNotification(
      bidder.id,
      'Auto-Bid Activated',
      `Your auto-bidding for "${pennyAuction.title}" has been activated.`,
      'bid',
      `/penny-auctions/${pennyAuction.id}`,
      { pennyAuctionId: pennyAuction.id }
    );
  },
  
  // Notify bidder when auto-bid is deactivated
  autoBidDeactivated: async (pennyAuction, bidder, reason) => {
    await notificationService.createNotification(
      bidder.id,
      'Auto-Bid Deactivated',
      `Your auto-bidding for "${pennyAuction.title}" has been deactivated. ${reason || ''}`,
      'bid',
      `/penny-auctions/${pennyAuction.id}`,
      { pennyAuctionId: pennyAuction.id }
    );
  },
  
  // Notify bidder when bid balance is low
  bidBalanceLow: async (bidder) => {
    await notificationService.createNotification(
      bidder.id,
      'Bid Balance Low',
      'Your bid balance is running low. Purchase more bids to continue participating in penny auctions.',
      'system',
      '/bid-packages',
      null,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    );
  },
  
  // Notify winner when penny auction ends
  auctionWon: async (pennyAuction, winner) => {
    await notificationService.createNotification(
      winner.id,
      'Penny Auction Won',
      `Congratulations! You won the penny auction "${pennyAuction.title}".`,
      'auction',
      `/penny-auctions/${pennyAuction.id}`,
      { pennyAuctionId: pennyAuction.id }
    );
  }
};

// System notification helpers
const systemNotifications = {
  // Notify user about account changes
  accountUpdated: async (user) => {
    await notificationService.createNotification(
      user.id,
      'Account Updated',
      'Your account information has been updated successfully.',
      'system',
      '/account',
      null,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    );
  },
  
  // Notify user about password changes
  passwordChanged: async (user) => {
    await notificationService.createNotification(
      user.id,
      'Password Changed',
      'Your password has been changed successfully.',
      'system',
      '/account',
      null,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    );
  },
  
  // Notify all users about system maintenance
  systemMaintenance: async (startTime, endTime, affectedServices) => {
    const message = `System maintenance is scheduled from ${startTime} to ${endTime}. The following services may be affected: ${affectedServices.join(', ')}.`;
    
    await notificationService.createNotificationForRole(
      'buyer',
      'Scheduled Maintenance',
      message,
      'system',
      null,
      { startTime, endTime, affectedServices },
      new Date(endTime)
    );
    
    await notificationService.createNotificationForRole(
      'seller',
      'Scheduled Maintenance',
      message,
      'system',
      null,
      { startTime, endTime, affectedServices },
      new Date(endTime)
    );
  }
};

module.exports = {
  orderNotifications,
  auctionNotifications,
  pennyAuctionNotifications,
  systemNotifications
};