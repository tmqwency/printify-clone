import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Notifications } from '/imports/api/collections/notifications';
import { FaBell, FaTrash, FaCheckDouble, FaExclamationTriangle, FaBoxOpen, FaClipboardList } from 'react-icons/fa';
import { toast } from 'react-toastify';

const NotificationsPage = () => {
  const [limit, setLimit] = useState(20);

  const { notifications, loading, totalCount } = useTracker(() => {
    const handle = Meteor.subscribe('notifications.mine');
    
    return {
      loading: !handle.ready(),
      notifications: Notifications.find({}, { sort: { createdAt: -1 }, limit }).fetch(),
      totalCount: Notifications.find().count()
    };
  }, [limit]);

  const markAsRead = (id) => {
    Meteor.call('notifications.markRead', id);
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation(); // Prevent marking as read when deleting
    if (window.confirm('Are you sure you want to delete this notification?')) {
        Meteor.call('notifications.delete', id, (err) => {
            if (err) toast.error(err.reason || 'Failed to delete');
            else toast.success('Notification deleted');
        });
    }
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear ALL notifications? This cannot be undone.')) {
        Meteor.call('notifications.clear', (err) => {
            if (err) toast.error(err.reason || 'Failed to clear notifications');
            else toast.success('All notifications cleared');
        });
    }
  };

  const markAllAsRead = () => {
    Meteor.call('notifications.markAllRead', (err) => {
        if (err) toast.error('Failed to mark all as read');
        else toast.success('All marked as read');
    });
  };

  const getIcon = (type) => {
      switch(type) {
          case 'usage_limit_warning': return <FaExclamationTriangle />;
          case 'order_status_change': return <FaBoxOpen />;
          case 'order_created': return <FaClipboardList />;
          default: return <FaBell />;
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

  if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">View and manage your alerts</p>
        </div>
        <div className="flex gap-3">
             <button
                onClick={markAllAsRead}
                disabled={notifications.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
             >
                 <FaCheckDouble /> Mark all read
             </button>
             <button
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
             >
                 <FaTrash /> Clear All
             </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                    <FaBell className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                <p className="mt-1">You're all caught up!</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                    <div 
                        key={notification._id}
                        onClick={() => markAsRead(notification._id)}
                        className={`p-6 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!notification.read ? 'bg-blue-50/30' : ''}`}
                    >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className={`text-base ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                                    {notification.title}
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                            
                            {/* Optional: Render data if needed, like order ID link */}
                            {notification.data && notification.data.externalOrderId && (
                                <div className="mt-2 text-sm text-primary-600">
                                    Order #{notification.data.externalOrderId}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center px-2">
                             <button
                                onClick={(e) => deleteNotification(e, notification._id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
                             >
                                 <FaTrash />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Load More */}
      {notifications.length < totalCount && (
          <div className="text-center pt-4">
              <button
                onClick={() => setLimit(l => l + 20)}
                className="text-primary-600 font-medium hover:text-primary-700"
              >
                  Load More
              </button>
          </div>
      )}
    </div>
  );
};

export default NotificationsPage;
