import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, [isAuthenticated]);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      // If token is invalid, log out
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      await authService.login(email, password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (code, state) => {
    setLoading(true);
    try {
      const response = await authService.handleGoogleOAuthCallback(code, state);
      // Store tokens IMMEDIATELY if we have them
      if (response && response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        setIsAuthenticated(true);
        setUser(response.user);
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }
    } catch (error) {
      // Don't throw or return error immediately - let the callback page check for tokens
      // The response might have succeeded even if there's an error in processing
      const errorMessage = error.response?.data?.detail || error.message || '';
      
      // Check if tokens were set despite the error
      const hasToken = localStorage.getItem('access_token');
      if (hasToken) {
        // Tokens exist - probably succeeded, return success
        setIsAuthenticated(true);
        return { success: true };
      }
      
      // No tokens - return error, but filter communication errors
      const isCommunicationError = !errorMessage || 
          errorMessage.toLowerCase().includes('network') ||
          errorMessage.toLowerCase().includes('communicat') ||
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('fetch') ||
          error.code === 'ERR_NETWORK';
      
      if (isCommunicationError) {
        // For communication errors, return success=false but no error message
        // The callback page will check for tokens
        return { success: false };
      }
      
      return {
        success: false,
        error: errorMessage || 'Google authentication failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const response = await authService.register(data.email, data.password, data.first_name, data.last_name);
      return { success: true, message: response.message };
    } catch (error) {
      // Extract error message from Django REST Framework response
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle Django REST Framework validation errors
        if (typeof errorData === 'object') {
          // Check for field-specific errors (e.g., {email: ["error message"]})
          const fieldErrors = Object.values(errorData).flat();
          if (fieldErrors.length > 0) {
            errorMessage = Array.isArray(fieldErrors[0]) ? fieldErrors[0][0] : fieldErrors[0];
          } else if (errorData.detail) {
            // Check for detail field
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            // Check for message field
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, logout, refreshUser, handleGoogleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
