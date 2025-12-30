import React from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import {
  FaUserShield,
  FaUser,
  FaEnvelope,
  FaBan,
  FaCheckCircle,
  FaTrashAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

const AdminUsers = () => {
  // Fetch all users
  const { users, loading, currentUserId } = useTracker(() => {
    const handle = Meteor.subscribe("allUsers");
    return {
      users: Meteor.users.find({}).fetch(),
      loading: !handle.ready(),
      currentUserId: Meteor.userId(),
    };
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const handleToggleRole = (userId, currentIsAdmin) => {
    const action = currentIsAdmin
      ? "revoke admin rights from"
      : "grant admin rights to";
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      Meteor.call("admin.toggleRole", userId, (error) => {
        if (error) {
          toast.error(error.reason || "Failed to update role");
        } else {
          toast.success(`User role updated successfully`);
        }
      });
    }
  };

  const handleToggleBan = (userId, currentIsBanned) => {
    const action = currentIsBanned ? "unban" : "ban";
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      Meteor.call("admin.toggleBan", userId, (error) => {
        if (error) {
          toast.error(error.reason || "Failed to update ban status");
        } else {
          toast.success(`User ${action}ned successfully`);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage users and their permissions</p>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.profile?.name || "User"}{" "}
                          {currentUserId === user._id && "(You)"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaEnvelope className="text-gray-400 mr-2" />
                      {user.emails?.[0]?.address || "No email"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.profile?.isAdmin ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <FaUserShield className="mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.profile?.isBanned ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <FaBan className="mr-1" /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaCheckCircle className="mr-1" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {currentUserId !== user._id && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            handleToggleRole(user._id, user.profile?.isAdmin)
                          }
                          className="text-indigo-600 hover:text-indigo-900 px-2 py-1 hover:bg-indigo-50 rounded"
                          title={
                            user.profile?.isAdmin
                              ? "Revoke Admin"
                              : "Make Admin"
                          }
                        >
                          <FaUserShield />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleBan(user._id, user.profile?.isBanned)
                          }
                          className={`${
                            user.profile?.isBanned
                              ? "text-green-600 hover:text-green-900"
                              : "text-red-600 hover:text-red-900"
                          } px-2 py-1 hover:bg-gray-100 rounded`}
                          title={
                            user.profile?.isBanned ? "Unban User" : "Ban User"
                          }
                        >
                          {user.profile?.isBanned ? (
                            <FaCheckCircle />
                          ) : (
                            <FaBan />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
