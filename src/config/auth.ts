export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';
export const FINGERPRINT_KEY = 'device_fingerprint';
export const TEMPWALLETS_BACKEND_URL = 'https://backend-production-01b2.up.railway.app';

export const normalizeApiUrl = (rawUrl?: string) => {
  const fallback = TEMPWALLETS_BACKEND_URL;
  const input = (rawUrl || fallback).trim();
  const ipPortMatch = input.match(/^(\d{1,3}(?:\.\d{1,3}){3})\.(\d{2,5})$/);
  const fixedInput = ipPortMatch ? `${ipPortMatch[1]}:${ipPortMatch[2]}` : input;

  if (fixedInput.startsWith('http://') || fixedInput.startsWith('https://')) {
    return fixedInput;
  }

  const localLikeHosts = ['localhost', '127.0.0.1', '10.0.2.2'];
  const isIpLike = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d{2,5})?$/.test(fixedInput);
  const isLocalLike = localLikeHosts.some(
    (host) => fixedInput === host || fixedInput.startsWith(`${host}:`)
  );
  const protocol = isLocalLike || isIpLike ? 'http' : 'https';
  return `${protocol}://${fixedInput}`;
};

export const API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
const sanitizePublicApiUrl = (raw?: string) => {
  const value = (raw || '').trim();
  if (!value) return '';
  // Avoid common placeholder values that break emulator reachability checks.
  if (value.includes('your-mobile-backend')) return '';
  if (value.includes('example.com')) return '';
  return normalizeApiUrl(value);
};

export const MOBILE_API_URL = sanitizePublicApiUrl(
  process.env.EXPO_PUBLIC_MOBILE_API_URL
);
export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
