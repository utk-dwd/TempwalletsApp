export type WalletRequestOptions = {
  userId?: string | null;
  refresh?: boolean;
};

async function requestWithAuth<T>(
  baseUrl: string,
  token: string | null | undefined,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers || undefined);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(new URL(endpoint, baseUrl).toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function withUserId(endpoint: string, userId?: string | null) {
  if (!userId) return endpoint;
  const joinChar = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${joinChar}userId=${encodeURIComponent(userId)}`;
}

export type WalletHistoryEntry = {
  id: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
};

export type ChainBalance = {
  chain: string;
  balance: string;
};

export type AnyAsset = {
  chain: string;
  address: string | null;
  symbol: string;
  balance: string;
  decimals: number;
  balanceHuman?: string;
};

export type WalletTx = {
  txHash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: number | null;
  blockNumber: number | null;
  status: 'success' | 'failed' | 'pending';
  chain: string;
  tokenSymbol?: string;
  tokenAddress?: string;
};

export const walletApi = {
  createOrImportSeed(
    baseUrl: string,
    token: string | null | undefined,
    payload: { userId?: string; mode: 'random' | 'mnemonic'; mnemonic?: string }
  ) {
    return requestWithAuth<{
      ok: boolean;
      ethereum?: string | null;
      addresses?: any;
    }>(baseUrl, token, '/wallet/seed', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getWalletHistory(baseUrl: string, token: string | null | undefined) {
    return requestWithAuth<{ wallets: WalletHistoryEntry[] }>(
      baseUrl,
      token,
      '/wallet/history'
    );
  },

  switchWallet(baseUrl: string, token: string | null | undefined, walletId: string) {
    return requestWithAuth<{ ok: boolean }>(baseUrl, token, '/wallet/switch', {
      method: 'POST',
      body: JSON.stringify({ walletId }),
    });
  },

  deleteWalletHistory(baseUrl: string, token: string | null | undefined, walletId: string) {
    return requestWithAuth<{ ok: boolean }>(
      baseUrl,
      token,
      `/wallet/history/${encodeURIComponent(walletId)}`,
      { method: 'DELETE' }
    );
  },

  getAddresses(baseUrl: string, token: string | null | undefined, options?: WalletRequestOptions) {
    return requestWithAuth<any>(baseUrl, token, withUserId('/wallet/addresses', options?.userId));
  },

  getBalances(baseUrl: string, token: string | null | undefined, options?: WalletRequestOptions & { refresh?: boolean }) {
    let endpoint = withUserId('/wallet/balances', options?.userId);
    if (options?.refresh) endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}refresh=true`;
    return requestWithAuth<ChainBalance[]>(baseUrl, token, endpoint);
  },

  getAssetsAny(baseUrl: string, token: string | null | undefined, options?: WalletRequestOptions & { refresh?: boolean }) {
    let endpoint = withUserId('/wallet/assets-any', options?.userId);
    if (options?.refresh) endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}refresh=true`;
    return requestWithAuth<AnyAsset[]>(baseUrl, token, endpoint);
  },

  getTokenBalances(baseUrl: string, token: string | null | undefined, chain: string, options?: WalletRequestOptions & { refresh?: boolean }) {
    let endpoint = withUserId(`/wallet/token-balances?chain=${encodeURIComponent(chain)}`, options?.userId);
    if (options?.refresh) endpoint = `${endpoint}&refresh=true`;
    return requestWithAuth<AnyAsset[]>(baseUrl, token, endpoint);
  },

  getTransactions(baseUrl: string, token: string | null | undefined, chain: string, limit: number = 50, options?: WalletRequestOptions) {
    let endpoint = withUserId(
      `/wallet/transactions?chain=${encodeURIComponent(chain)}&limit=${limit}`,
      options?.userId
    );
    if (options?.refresh) endpoint = `${endpoint}&refresh=true`;
    return requestWithAuth<WalletTx[]>(baseUrl, token, endpoint);
  },

  getTransactionsAny(baseUrl: string, token: string | null | undefined, limit: number = 100, options?: WalletRequestOptions) {
    let endpoint = withUserId(`/wallet/transactions-any?limit=${limit}`, options?.userId);
    if (options?.refresh) endpoint = `${endpoint}&refresh=true`;
    return requestWithAuth<WalletTx[]>(baseUrl, token, endpoint);
  },

  sendCrypto(
    baseUrl: string,
    token: string | null | undefined,
    payload: {
      userId?: string;
      chain: string;
      tokenAddress?: string;
      tokenDecimals?: number;
      amount: string;
      recipientAddress: string;
    }
  ) {
    return requestWithAuth<{ txHash: string }>(baseUrl, token, '/wallet/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  sendEip7702(
    baseUrl: string,
    token: string | null | undefined,
    payload: {
      userId?: string;
      chainId: number;
      recipientAddress: string;
      amount: string;
      tokenAddress?: string;
      tokenDecimals?: number;
    }
  ) {
    return requestWithAuth<any>(baseUrl, token, '/wallet/eip7702/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getPaymasterBalances(baseUrl: string, token: string | null | undefined, options?: WalletRequestOptions) {
    return requestWithAuth<ChainBalance[]>(
      baseUrl,
      token,
      withUserId('/wallet/erc4337/paymaster-balances', options?.userId)
    );
  },

  testEip7702Support(baseUrl: string, token: string | null | undefined, chain: string) {
    return requestWithAuth<any>(
      baseUrl,
      token,
      `/wallet/eip7702/test/${encodeURIComponent(chain)}`
    );
  },

  getDelegationStatus(
    baseUrl: string,
    token: string | null | undefined,
    payload: { userId?: string; chainId: number }
  ) {
    const endpoint = withUserId(
      `/wallet/eip7702/delegation-status?chainId=${payload.chainId}`,
      payload.userId
    );
    return requestWithAuth<any>(baseUrl, token, endpoint);
  },

  getEip7702SupportedChains(baseUrl: string, token: string | null | undefined) {
    return requestWithAuth<any[]>(baseUrl, token, '/wallet/eip7702/supported-chains');
  },

  waitForEip7702Confirmation(
    baseUrl: string,
    token: string | null | undefined,
    payload: { chainId: number; userOpHash: string; timeoutMs?: number }
  ) {
    return requestWithAuth<any>(baseUrl, token, '/wallet/eip7702/wait-for-confirmation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
