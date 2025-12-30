import React, { createContext, useContext, useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = () => {
      const currentUser = Meteor.user();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    // Subscribe to user changes
    const handle = Meteor.subscribe("userData");

    return () => handle.stop();
  }, []);

  const login = async (email, password) => {
    return new Promise((resolve, reject) => {
      Meteor.loginWithPassword(email, password, (error) => {
        if (error) {
          reject(error);
        } else {
          setUser(Meteor.user());
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
            setUser(Meteor.user());
            resolve();
          }
        }
      );
    });
  };

  const logout = async () => {
    return new Promise((resolve) => {
      Meteor.logout(() => {
        setUser(null);
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
