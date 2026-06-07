import React, { createContext, useState, useEffect } from 'react';

// 1. Create the Context (The "Elevator" tunnel)
export const AuthContext = createContext();

// 2. Create the Provider component (The "Engine" pumping data)
export const AuthProvider = ({ children }) => {
  // State variable to hold user data. If null, no user is logged in.
  const [user, setUser] = useState(null);
  
  // Loading state to prevent premature rendering before the server responds
  const [loading, setLoading] = useState(true);

  // --- NEW: Session Check on Initial Mount ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check with the backend if a valid session cookie already exists
        const response = await fetch('http://localhost:3001/api/sessions/current', {
          credentials: 'include' // Crucial: Send the cookie with the request
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData); // User was already logged in, restore their data
        }
      } catch (error) {
        console.error("Session check failed", error);
      } finally {
        // Regardless of success or failure, the initial loading phase is over
        setLoading(false); 
      }
    };

    checkSession();
  }, []); // Empty dependency array ensures this runs only once on initial load

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
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Network error during login:", error);
      return false;
    }
  };

  // --- Logout Function ---
  const logout = async () => {
    try {
      await fetch('http://localhost:3001/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include',
      });
      setUser(null); // Clear the global user state
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Suspend rendering of the app until the initial session check is complete
  if (loading) {
    return <div className="text-center mt-5">Loading app...</div>;
  }

  // Provide the user state and auth methods to the rest of the application
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};