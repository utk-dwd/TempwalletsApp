import type { AuthUser } from '../types';

export const decodeUserParam = (encodedUser: string): AuthUser | null => {
  try {
    return JSON.parse(decodeURIComponent(encodedUser)) as AuthUser;
  } catch {
    try {
      return JSON.parse(encodedUser) as AuthUser;
    } catch {
      return null;
    }
  }
};

export const shortAddress = (address: string) =>
  `${address.slice(0, 7)}...${address.slice(-5)}`;
