# Quick Start Guide: Admin Panel APIs

This guide provides essential information for quickly implementing and using the seller and buyer admin panel APIs.

## 1. Setup

```bash
# Install dependencies
npm install

# Start the server with admin panel support
node src/app-with-admin.js
```

## 2. Authentication

```javascript
// Example authentication request
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seller@example.com', password: 'password123' })
});

const { token } = await response.json();

// Use token in subsequent requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## 3. Key Endpoints

### Seller Admin

```
GET    /api/admin/seller/dashboard     # Get dashboard statistics
GET    /api/admin/seller/products      # List products
GET    /api/admin/seller/orders        # List orders
PUT    /api/admin/seller/orders/:id/status  # Update order status
GET    /api/admin/seller/inventory     # View inventory
PUT    /api/admin/seller/inventory/:id # Update inventory
```

### Buyer Admin

```
GET    /api/admin/buyer/dashboard      # Get dashboard statistics
GET    /api/admin/buyer/orders         # List orders
GET    /api/admin/buyer/orders/:id     # Get order details
PUT    /api/admin/buyer/orders/:id/cancel  # Cancel order
GET    /api/admin/buyer/reviews        # List reviews
POST   /api/admin/buyer/reviews        # Create/update review
```

## 4. Frontend Integration

```javascript
// Example React component for seller dashboard
function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('http://localhost:5000/api/admin/seller/dashboard', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const data = await response.json();
        setStats(data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        setLoading(false);
      }
    }
    
    fetchDashboard();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="dashboard">
      <h1>Seller Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Products</h3>
          <p>Total: {stats.products.total}</p>
          <p>Active: {stats.products.active}</p>
        </div>
        
        <div className="stat-card">
          <h3>Orders</h3>
          <p>Total: {stats.orders.total}</p>
          <p>Recent: {stats.orders.recent}</p>
        </div>
        
        <div className="stat-card">
          <h3>Revenue</h3>
          <p>Total: ${stats.revenue.total}</p>
          <p>Recent: ${stats.revenue.recent}</p>
        </div>
        
        <div className="stat-card">
          <h3>Reviews</h3>
          <p>Average: {stats.reviews.average} ⭐</p>
          <p>Total: {stats.reviews.total}</p>
        </div>
      </div>
      
      <h2>Top Products</h2>
      <ul>
        {stats.topProducts.map(product => (
          <li key={product.id}>
            {product.title} - ${product.price} (Sold: {product.totalQuantity})
          </li>
        ))}
      </ul>
      
      {/* Add chart for monthly sales */}
    </div>
  );
}
```

## 5. Real-time Updates with Socket.IO

```javascript
// Client-side Socket.IO integration
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join seller dashboard room
socket.emit('join-dashboard', userId, 'seller');

// Listen for dashboard updates
socket.on('dashboard-data', (data) => {
  console.log('Dashboard updated:', data);
  // Update UI with new data
});

// Listen for order updates
socket.on('order-updated', (data) => {
  console.log('Order updated:', data);
  // Update order list or show notification
});

// Disconnect when component unmounts
return () => {
  socket.disconnect();
};
```

## 6. Common Use Cases

### Inventory Management

```javascript
// Update inventory levels
async function updateInventory(productId, stockQuantity, price, isActive) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/seller/inventory/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stockQuantity, price, isActive })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
}
```

### Order Processing

```javascript
// Update order status
async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/seller/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}
```

## 7. Error Handling

```javascript
// Example error handling
async function fetchData(endpoint) {
  try {
    const response = await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (response.status === 403) {
        // Forbidden - insufficient permissions
        return { error: 'You do not have permission to access this resource' };
      }
      
      // Other errors
      const errorData = await response.json();
      return { error: errorData.message || 'An error occurred' };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return { error: 'Network error' };
  }
}
```

## 8. Testing Tips

1. Use the Swagger UI at `http://localhost:5000/api/docs` for interactive testing
2. Import the Postman collection from `docs/postman/admin-panel-apis.json`
3. Create test users with different roles (seller, buyer) for comprehensive testing
4. Test error scenarios (invalid input, unauthorized access, etc.)
5. Verify real-time updates with multiple browser sessions