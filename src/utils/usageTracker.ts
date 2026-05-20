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

export const isUserLoggedIn = (): boolean => {
  return localStorage.getItem('pic_swift_user') !== null;
};

export const getCurrentUser = (): { email: string; name?: string } | null => {
  const user = localStorage.getItem('pic_swift_user');
  return user ? JSON.parse(user) : null;
};

export const loginUser = (email: string, name?: string) => {
  localStorage.setItem('pic_swift_user', JSON.stringify({ email, name }));
  window.dispatchEvent(new Event('auth_state_changed'));
};

export const logoutUser = () => {
  localStorage.removeItem('pic_swift_user');
  // Reset usages on logout to let them try it again or re-log
  localStorage.setItem('pic_swift_usages', '0');
  window.dispatchEvent(new Event('auth_state_changed'));
};
