const CURRENT_USER_KEY = 'currentUser';
const LOGIN_DATA_KEY = 'loginData';

export const getStoredUser = () => {
  const storedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
};

export const storeUser = (user) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const shouldShowSecurityModal = (user) => {
  return !!user && user.security_acknowledged !== 1 && user.security_acknowledged !== true;
};

export const getRememberedLogin = () => {
  const saved = localStorage.getItem(LOGIN_DATA_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(LOGIN_DATA_KEY);
    return null;
  }
};

export const saveRememberedLogin = (loginData) => {
  localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify(loginData));
};

export const clearRememberedLogin = () => {
  localStorage.removeItem(LOGIN_DATA_KEY);
};

export const refreshStoredToken = (newToken) => {
  if (!newToken) return;

  const user = getStoredUser();
  if (!user) return;

  storeUser({ ...user, token: newToken });
};

export const installRefreshTokenInterceptor = () => {
  if (window.__refreshTokenInterceptorInstalled) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    refreshStoredToken(response.headers.get('X-Refresh-Token'));
    return response;
  };

  window.__refreshTokenInterceptorInstalled = true;
};
