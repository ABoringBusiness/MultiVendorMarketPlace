// This is a client-side example for handling real-time notifications
// using Socket.IO in a React application

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Assuming you have an auth context

// Custom hook for handling notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const { token, isAuthenticated } = useAuth();
  
  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    // Connect to Socket.IO server
    const socketInstance = io(process.env.REACT_APP_API_URL, {
      auth: { token }
    });
    
    // Connection events
    socketInstance.on('connect', () => {
      console.log('Socket.IO connected');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });
    
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token]);
  
  // Listen for notifications
  useEffect(() => {
    if (!socket) return;
    
    // Handle incoming notifications
    socket.on('notification', (notification) => {
      // Add new notification to state
      setNotifications(prev => [notification, ...prev]);
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png'
        });
      }
    });
    
    // Cleanup listener on unmount
    return () => {
      socket.off('notification');
    };
  }, [socket]);
  
  // Fetch notifications from API on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchNotifications();
    fetchUnreadCount();
  }, [isAuthenticated, token]);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        
        // Decrement unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Update local state
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};

// Notification component example
export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  return (
    <div className="notification-bell">
      <button onClick={() => setIsOpen(!isOpen)}>
        <i className="fa fa-bell" />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>Mark all as read</button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                    
                    // Navigate to action link if provided
                    if (notification.actionLink) {
                      window.location.href = notification.actionLink;
                    }
                  }}
                >
                  <div className="notification-icon">
                    {notification.type === 'order' && <i className="fa fa-shopping-cart" />}
                    {notification.type === 'auction' && <i className="fa fa-gavel" />}
                    {notification.type === 'bid' && <i className="fa fa-money" />}
                    {notification.type === 'payment' && <i className="fa fa-credit-card" />}
                    {notification.type === 'system' && <i className="fa fa-cog" />}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};