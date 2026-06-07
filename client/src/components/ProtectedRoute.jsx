import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const ProtectedRoute = ({ children }) => {
  // 1. Check the Context to see if anyone is inside
  const { user } = useContext(AuthContext);

  // 2. If the user object is null (anonymous), kick them out to the login page
  // The 'replace' prop replaces the current history entry so they can't use the back button to return here
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If the user exists, open the door and render the requested page (children)
  return children;
};

export default ProtectedRoute;