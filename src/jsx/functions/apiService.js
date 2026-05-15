/**
 * apiService.js
 * Centralized service for handling all API requests.
 */

const PRODUCTION_URL = 'https://industrialn6.pages.dev';
const API_BASE_PATH = '/api/data';

const getBaseUrl = () => {
  // If we are in capacitor (android/ios) or not on the production domain, use the absolute production URL
  if (window.location.origin.includes('localhost') || 
      window.location.origin.includes('capacitor://') || 
      window.location.origin.includes('http://localhost')) {
    return PRODUCTION_URL;
  }
  return window.location.origin;
};

const getApiUrl = () => {
  return new URL(API_BASE_PATH, getBaseUrl());
};


const getAuthToken = () => {
  const stored = localStorage.getItem('currentUser');
  if (!stored) return '';
  try {
    const user = JSON.parse(stored);
    return user.token ? `Bearer ${user.token}` : '';
  } catch (e) {
    return '';
  }
};

const handleApiError = (error, status) => {
  const isAuthError = 
    status === 401 || 
    (error && typeof error === 'string' && (
      error.includes('Sesión inválida') || 
      error.includes('token') || 
      error.includes('seguridad') ||
      error.includes('autenticación')
    ));

  if (isAuthError) {
    console.warn("Autenticación fallida o sesión expirada. Redirigiendo al login...");
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new CustomEvent('auth_error'));
    // Fallback if event is not handled
    setTimeout(() => {
      if (window.location.hash !== '' && window.location.hash !== '#/') {
        window.location.replace(window.location.origin);
      }
    }, 1000);
  }
};

const checkRefreshToken = (response) => {
  const newToken = response.headers.get('X-Refresh-Token');
  if (newToken) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        user.token = newToken;
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {
        console.error("Error updating token:", e);
      }
    }
  }
};

export const apiRequest = async (type, body = {}, userId = null, method = 'POST') => {
  if (!userId) {
    const stored = localStorage.getItem('currentUser');
    if (stored) userId = JSON.parse(stored).id;
  }

  const url = getApiUrl();
  url.searchParams.set('type', type);
  if (userId) url.searchParams.set('userId', userId);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthToken()
    }
  };

  if (method === 'POST') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), options);
    checkRefreshToken(response);
    const data = await response.json();

    if (!response.ok) {
      handleApiError(data.error, response.status);
      throw new Error(data.error || 'Ocurrió un error en la comunicación con el servidor.');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${type}):`, error);
    throw error;
  }
};

export const apiLoadData = async (userId, selectedYearId, selectedCourseId, includeAllStudents = false) => {
  const url = getApiUrl();
  url.searchParams.set('type', 'grid');
  url.searchParams.set('userId', userId);
  if (selectedYearId) url.searchParams.set('yearId', selectedYearId);
  if (selectedCourseId) url.searchParams.set('courseId', selectedCourseId);
  if (includeAllStudents) url.searchParams.set('includeAllStudents', 'true');

  const options = {
    method: 'GET',
    headers: {
      'Authorization': getAuthToken()
    }
  };

  try {
    const response = await fetch(url.toString(), options);
    checkRefreshToken(response);
    const data = await response.json();

    if (!response.ok) {
      handleApiError(data.error, response.status);
      throw new Error(data.error || 'Error al cargar los datos.');
    }

    return data;
  } catch (error) {
    console.error('API LoadData Error:', error);
    throw error;
  }
};

const apiService = {
  apiRequest,
  apiLoadData,
  getGrid: apiLoadData,
  post: (type, userId, body) => apiRequest(type, body, userId, 'POST'),
  get: async (type, params = {}) => {
    const url = getApiUrl();
    url.searchParams.set('type', type);
    url.searchParams.set('v', Date.now());
    Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));

    const options = {
      method: 'GET',
      headers: {
        'Authorization': getAuthToken()
      }
    };

    const response = await fetch(url.toString(), options);
    checkRefreshToken(response);
    const data = await response.json();
    if (!response.ok) {
      handleApiError(data.error, response.status);
      throw new Error(data.error || 'API GET Error');
    }
    return data;
  }
};

export default apiService;
