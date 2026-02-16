import type { UserActivity, UserProfile, UserStats } from '../types';

async function requestWithAuth<T>(
  baseUrl: string,
  token: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = new URL(endpoint, baseUrl).toString();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const userApi = {
  getProfile(baseUrl: string, token: string) {
    return requestWithAuth<UserProfile>(baseUrl, token, '/user/profile');
  },
  updateProfile(
    baseUrl: string,
    token: string,
    payload: { name?: string | null; picture?: string | null }
  ) {
    return requestWithAuth<UserProfile>(baseUrl, token, '/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  getStats(baseUrl: string, token: string) {
    return requestWithAuth<UserStats>(baseUrl, token, '/user/stats');
  },
  getActivity(baseUrl: string, token: string, limit: number = 50) {
    return requestWithAuth<UserActivity[]>(
      baseUrl,
      token,
      `/user/activity?limit=${limit}`
    );
  },
  getXp(baseUrl: string, token: string) {
    return requestWithAuth<{ xp: number }>(baseUrl, token, '/user/xp');
  },
  awardXp(baseUrl: string, token: string, payload: { amount: number; reason: string }) {
    return requestWithAuth<{ xp: number; totalXP: number }>(
      baseUrl,
      token,
      '/user/xp/award',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },
  deleteAccount(baseUrl: string, token: string) {
    return requestWithAuth<{ success: boolean }>(baseUrl, token, '/user/account', {
      method: 'DELETE',
    });
  },
};
