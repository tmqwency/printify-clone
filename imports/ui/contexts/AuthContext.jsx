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
    return {
      user: Meteor.user(),
      isLoggingIn: Meteor.loggingIn(),
    };
  }, []);

  useEffect(() => {
    // Only set loading to false when we are sure the login process is done.
    // However, on first load, isLoggingIn might be false for a split second.
    // We should trust the tracker's return. 
    // If user is present, we are loaded.
    // If isLoggingIn is true, we are loading.
    // If neither, and we've had a tick, we are likely not logged in.
    
    // Simplest fix: The useTracker hook will run immediately.
    // If we are logging in, we show loading.
    // If we have a user, we are authenticated.
    // If we don't have a user and aren't logging in, we are unauthenticated.
    
    // We sync the local loading state with isLoggingIn
    setLoading(isLoggingIn);
  }, [isLoggingIn, user]);

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
