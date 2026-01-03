import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // Allow access for development/testing
  const isDevelopment = true;
  return isDevelopment ? children : (isAuthenticated ? children : <Navigate to="/login" replace />);
};
