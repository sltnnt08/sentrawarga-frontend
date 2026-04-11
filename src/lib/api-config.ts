const DEFAULT_REMOTE_API_BASE_URL = 'https://sentrawarga-backend.onrender.com/api';
const DEFAULT_LOCAL_API_BASE_URL = '/api';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const isLocalHostname = (hostname: string) => LOCAL_HOSTNAMES.has(hostname.toLowerCase());

const shouldUseLocalApiDefault = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return isLocalHostname(window.location.hostname);
};

const toLocalProxyApiPath = (value: string) => {
  if (!shouldUseLocalApiDefault()) {
    return value;
  }

  try {
    const url = new URL(value);

    if (isLocalHostname(url.hostname)) {
      return '/api';
    }

    return value;
  } catch {
    return value;
  }
};

const toHttpForLocalhost = (value: string) => {
  try {
    const url = new URL(value);

    if (url.protocol === 'https:' && isLocalHostname(url.hostname)) {
      url.protocol = 'http:';
      return url.toString();
    }

    return value;
  } catch {
    return value;
  }
};

const normalizeApiBaseUrl = (value: string) => {
  const adjustedValue = toLocalProxyApiPath(toHttpForLocalhost(value));

  try {
    const url = new URL(adjustedValue);
    const normalizedPath = url.pathname === '/' || url.pathname === '' ? '/api' : url.pathname.replace(/\/$/, '');
    url.pathname = normalizedPath;
    return url.toString().replace(/\/$/, '');
  } catch {
    const trimmedValue = adjustedValue.replace(/\/$/, '');
    return trimmedValue.endsWith('/api') ? trimmedValue : `${trimmedValue}/api`;
  }
};

const toBackendRootUrl = (apiBaseUrl: string) => {
  try {
    const url = new URL(apiBaseUrl);

    if (url.pathname === '/api') {
      url.pathname = '/';
    } else if (url.pathname.endsWith('/api')) {
      url.pathname = url.pathname.slice(0, -4) || '/';
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    const trimmedBase = apiBaseUrl.replace(/\/$/, '');

    if (trimmedBase === '/api') {
      return '';
    }

    return trimmedBase.endsWith('/api') ? trimmedBase.slice(0, -4) : trimmedBase;
  }
};

const resolvedRawBaseUrl =
  (import.meta.env.VITE_API_BASE_URL || '').trim() ||
  (shouldUseLocalApiDefault() ? DEFAULT_LOCAL_API_BASE_URL : DEFAULT_REMOTE_API_BASE_URL);

export const API_BASE_URL = normalizeApiBaseUrl(resolvedRawBaseUrl);
export const BACKEND_ROOT_URL = toBackendRootUrl(API_BASE_URL);
