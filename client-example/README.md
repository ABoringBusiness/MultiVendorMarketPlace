# Real-Time Notification System

This directory contains example client-side code for implementing real-time notifications in a React application using Socket.IO.

## Features

- Real-time notifications using Socket.IO
- Notification badge with unread count
- Notification dropdown with list of notifications
- Mark notifications as read
- Delete notifications
- Browser notifications (with permission)

## Implementation

### Server-Side

The server-side implementation includes:

1. **Socket.IO Integration**: Socket.IO is initialized in the server and authenticates users using JWT tokens.
2. **Notification Model**: A database model for storing notifications.
3. **Notification Service**: A service for creating, retrieving, and managing notifications.
4. **Notification Controller**: API endpoints for managing notifications.
5. **Notification Helpers**: Utility functions for creating notifications for different events.

### Client-Side

The client-side implementation includes:

1. **Socket.IO Connection**: Establishes a connection to the Socket.IO server with authentication.
2. **Notification Hook**: A custom React hook for managing notifications.
3. **Notification Component**: A UI component for displaying notifications.
4. **CSS Styles**: Styles for the notification component.

## Usage

### Installation

```bash
npm install socket.io-client
```

### Integration

1. Import the notification hook and component:

```jsx
import { useNotifications, NotificationBell } from './NotificationHandler';
import './notifications.css';
```

2. Use the notification bell component in your layout:

```jsx
function AppHeader() {
  return (
    <header className="app-header">
      <div className="logo">My Marketplace</div>
      <nav>
        <a href="/">Home</a>
        <a href="/products">Products</a>
        <a href="/auctions">Auctions</a>
      </nav>
      <div className="user-actions">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
```

3. Use the notification hook in your components:

```jsx
function NotificationPage() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  return (
    <div className="notification-page">
      <h1>Notifications</h1>
      <button onClick={markAllAsRead}>Mark all as read</button>
      
      {notifications.map(notification => (
        <div key={notification.id} className="notification-card">
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <div className="notification-actions">
            {!notification.isRead && (
              <button onClick={() => markAsRead(notification.id)}>
                Mark as read
              </button>
            )}
            <button onClick={() => deleteNotification(notification.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Browser Notifications

The system also supports browser notifications. To request permission:

```jsx
useEffect(() => {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}, []);
```

## Customization

You can customize the notification styles by modifying the `notifications.css` file.