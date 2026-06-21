import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate session on initial mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sessions/current', {
          credentials: 'include' 
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData); 
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setLoading(false); 
      }
    };

    checkSession();
  }, []); 

  // Authenticate user and store session
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
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Invalid username or password.');
      }
    } catch (error) {
      console.error("Login attempt failed:", error);
      throw error; 
    }
  };

  // Terminate session
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

  // Prevent protected routes from rendering before session is verified
  if (loading) {
    return <div className="text-center mt-5">Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};