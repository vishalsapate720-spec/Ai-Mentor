import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // 🔹 FIX: Safely initialize user state to avoid "undefined" JSON parse errors
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      // "undefined" string check is critical here
      return storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("AuthContext: Error parsing user from localStorage", error);
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  // Sync authentication state whenever user changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Check if both exist and are valid
    if (token && storedUser && storedUser !== "undefined") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    // Ensure token is extracted correctly from the response object
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear specific session data like course progress
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('course-progress-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Safety: Clear everything to prevent stale data
    localStorage.clear(); 
  };

  const updateUser = (updatedUserData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};