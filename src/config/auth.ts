export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';
export const FINGERPRINT_KEY = 'device_fingerprint';

export const normalizeApiUrl = (rawUrl?: string) => {
  const fallback = 'http://10.0.2.2:5005';
  const input = (rawUrl || fallback).trim();
  const ipPortMatch = input.match(/^(\d{1,3}(?:\.\d{1,3}){3})\.(\d{2,5})$/);
  const fixedInput = ipPortMatch ? `${ipPortMatch[1]}:${ipPortMatch[2]}` : input;

  if (fixedInput.startsWith('http://') || fixedInput.startsWith('https://')) {
    return fixedInput;
  }

  return `http://${fixedInput}`;
};

export const API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
export const MOBILE_API_URL = process.env.EXPO_PUBLIC_MOBILE_API_URL
  ? normalizeApiUrl(process.env.EXPO_PUBLIC_MOBILE_API_URL)
  : '';
export const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
