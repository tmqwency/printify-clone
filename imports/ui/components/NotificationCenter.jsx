import React, { useState, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { FaBell } from 'react-icons/fa';
import { Notifications } from '/imports/api/collections/notifications';
import { toast } from 'react-toastify';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { notifications, unreadCount, loading } = useTracker(() => {
    const handle = Meteor.subscribe('notifications.mine');
    
    return {
      loading: !handle.ready(),
      notifications: Notifications.find({}, { sort: { createdAt: -1 } }).fetch(),
      unreadCount: Notifications.find({ read: false }).count()
    };
  }, []);

  const markAsRead = (id) => {
    Meteor.call('notifications.markRead', id);
  };

  const markAllAsRead = () => {
    if (unreadCount > 0) {
        Meteor.call('notifications.markAllRead', (err) => {
            if (err) toast.error('Failed to mark all as read');
        });
    }
  };

  const getIconColor = (type) => {
      switch(type) {
          case 'usage_limit_warning': return 'text-red-500 bg-red-100';
          case 'order_status_change': return 'text-blue-500 bg-blue-100';
          case 'order_created': return 'text-green-500 bg-green-100';
          default: return 'text-gray-500 bg-gray-100';
      }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-700">Notifications</h3>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllAsRead}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Mark all read
                    </button>
                )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <ul>
                        {notifications.map((notification) => (
                            <li 
                                key={notification._id}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                                onClick={() => markAsRead(notification._id)}
                            >
                                <div className="flex gap-3">
                                    <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center ${getIconColor(notification.type)}`}>
                                        <FaBell size={12} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="p-2 border-t border-gray-100 text-center bg-gray-50">
                <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                    View All
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
