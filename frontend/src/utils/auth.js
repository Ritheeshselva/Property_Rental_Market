// Authentication utility functions

/**
 * Triggers an auth change event to notify components that authentication state has changed
 */
export const triggerAuthChange = () => {
  window.dispatchEvent(new Event('authChanged'));
};

/**
 * Checks if user is currently logged in
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

/**
 * Gets current user data from localStorage
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

/**
 * Logs out user by clearing localStorage and triggering auth change
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  triggerAuthChange();
};

/**
 * Logs in user by setting localStorage and triggering auth change
 */
export const login = (token, userData) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  triggerAuthChange();
};