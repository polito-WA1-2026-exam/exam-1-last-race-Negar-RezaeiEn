import React, { createContext, useState, useEffect } from 'react';

// 1. Create the Context (The central authentication hub)
export const AuthContext = createContext();

// 2. Create the Provider component (Wraps the app to inject auth state)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Session Check on Initial Mount ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sessions/current', {
          credentials: 'include' // Crucial: Send cookies to Passport.js
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData); // Restore user session
        }
      } catch (error) {
        console.error("Session check failed", error);
      } finally {
        setLoading(false); 
      }
    };

    checkSession();
  }, []); 

  // --- Login Function ---
  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        // MODIFIED: Extract backend error message and throw it to be caught by Login.jsx
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Invalid username or password.');
      }
    } catch (error) {
      console.error("Login attempt failed:", error);
      throw error; // Re-throw the error so the UI can display the alert
    }
  };

  // --- Logout Function ---
  const logout = async () => {
    try {
      await fetch('http://localhost:3001/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include',
      });
      setUser(null); 
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Suspend rendering of the app until the initial session check is complete
  if (loading) {
    return <div className="text-center mt-5">Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};