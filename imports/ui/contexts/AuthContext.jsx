import React, { createContext, useContext, useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { useTracker } from "meteor/react-meteor-data";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);

  // Use Meteor's reactive data source to track user state
  const { user, isLoggingIn } = useTracker(() => {
    const currentUser = Meteor.user();
    const loggingIn = Meteor.loggingIn();
    
    return {
      user: currentUser,
      isLoggingIn: loggingIn
    };
  }, []);

  useEffect(() => {
    // Set loading to false once Meteor finishes checking login state
    if (!isLoggingIn) {
      setLoading(false);
    }
  }, [isLoggingIn]);

  const login = async (email, password) => {
    return new Promise((resolve, reject) => {
      Meteor.loginWithPassword(email, password, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };

  const signup = async (email, password, profile) => {
    return new Promise((resolve, reject) => {
      Accounts.createUser(
        {
          email,
          password,
          profile,
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  };

  const logout = async () => {
    return new Promise((resolve) => {
      Meteor.logout(() => {
        resolve();
      });
    });
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
