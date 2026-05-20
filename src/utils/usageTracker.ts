const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

export const getUsageCount = (): number => {
  const count = localStorage.getItem('pic_swift_usages');
  return count ? parseInt(count, 10) : 0;
};

export const incrementUsageCount = (): number => {
  const current = getUsageCount();
  const next = current + 1;
  localStorage.setItem('pic_swift_usages', next.toString());
  // Dispatch a custom event to notify App.tsx to check gating rules
  window.dispatchEvent(new Event('usage_incremented'));
  return next;
};

// Check if user is logged in by verifying if the local user state exists
export const isUserLoggedIn = (): boolean => {
  return localStorage.getItem('pic_swift_user') !== null;
};

export const getCurrentUser = (): { email: string; name?: string } | null => {
  const user = localStorage.getItem('pic_swift_user');
  return user ? JSON.parse(user) : null;
};

// Fetch current user from server (verifies HTTP-Only cookie)
export const checkServerSession = async (): Promise<{ email: string; name?: string } | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('pic_swift_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth_state_changed'));
        return data.user;
      }
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }
  // Clear local storage if server authentication fails
  localStorage.removeItem('pic_swift_user');
  window.dispatchEvent(new Event('auth_state_changed'));
  return null;
};

// Auth API Calls

export const signupUserApi = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('pic_swift_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth_state_changed'));
      return { success: true };
    }
    return { success: false, error: data.error || 'Registration failed.' };
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const loginUserApi = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('pic_swift_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth_state_changed'));
      return { success: true };
    }
    return { success: false, error: data.error || 'Invalid credentials.' };
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const logoutUserApi = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error('Logout request failed:', err);
  }
  localStorage.removeItem('pic_swift_user');
  localStorage.setItem('pic_swift_usages', '0');
  window.dispatchEvent(new Event('auth_state_changed'));
};

export const googleLoginApi = async (credential: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('pic_swift_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth_state_changed'));
      return { success: true };
    }
    return { success: false, error: data.error || 'Google login failed.' };
  } catch (err) {
    return { success: false, error: 'Network error connecting to Google Auth API.' };
  }
};

export const googleMockLoginApi = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/google-mock`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('pic_swift_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth_state_changed'));
      return { success: true };
    }
    return { success: false, error: data.error || 'Google Mock login failed.' };
  } catch (err) {
    return { success: false, error: 'Network error connecting to mock auth.' };
  }
};
