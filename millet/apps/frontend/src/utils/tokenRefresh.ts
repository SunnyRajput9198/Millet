/**
 * Refreshes the access token using the refresh token
 * @returns The new access token or null if refresh fails
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return null;
    }

    const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (data.success && data.data) {
      // Store new tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data.accessToken;
    }

    // If refresh fails, clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

/**
 * Gets a valid access token, refreshing if necessary
 * @returns A valid access token or null if authentication fails
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    return null;
  }

  // Try to use current token first
  try {
    const testResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    // If token is valid, return it
    if (testResponse.ok) {
      return accessToken;
    }

    // If token expired (401), try to refresh
    if (testResponse.status === 401) {
      console.log('Access token expired, refreshing...');
      return await refreshAccessToken();
    }

    return null;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
};

/**
 * Clears all authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};