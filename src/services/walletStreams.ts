import EventSource from 'react-native-sse';

export type WalletAddressesStreamComplete = { type: 'complete' };

export type WalletBalancesStreamComplete = { type: 'complete' };

export type WalletBalancesStreamEvent = {
  chain?: string;
  nativeBalance?: string;
  tokens?: any[];
  type?: string;
};

type StreamOptions = {
  baseUrl: string;
  token?: string | null;
  userId: string;
};

function makeStreamUrl(baseUrl: string, pathWithQuery: string) {
  return new URL(pathWithQuery, baseUrl).toString();
}

function makeHeaders(token?: string | null) {
  if (!token) return undefined;
  // react-native-sse expects header values as objects that implement toString()
  return {
    Authorization: {
      toString() {
        return `Bearer ${token}`;
      },
    },
  } as any;
}

export function startWalletAddressesStream(
  opts: StreamOptions,
  onData: (payload: any) => void,
  onError?: (message: string) => void,
) {
  const url = makeStreamUrl(
    opts.baseUrl,
    `/wallet/addresses-stream?userId=${encodeURIComponent(opts.userId)}`,
  );
  const es = new EventSource(url, { headers: makeHeaders(opts.token) });

  const listener = (event: any) => {
    if (event?.type === 'message') {
      const raw = String(event.data || '').trim();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.type === 'complete') return;
        onData(parsed);
      } catch {
        // ignore malformed events
      }
    } else if (event?.type === 'error' || event?.type === 'exception') {
      onError?.(String(event?.message || 'Stream error'));
    }
  };

  es.addEventListener('open', listener);
  es.addEventListener('message', listener);
  es.addEventListener('error', listener);
  es.addEventListener('close', listener);

  return () => {
    try {
      es.removeAllEventListeners();
      es.close();
    } catch {
      // ignore
    }
  };
}

export function startWalletBalancesStream(
  opts: StreamOptions,
  onData: (payload: WalletBalancesStreamEvent) => void,
  onError?: (message: string) => void,
) {
  const url = makeStreamUrl(
    opts.baseUrl,
    `/wallet/balances-stream?userId=${encodeURIComponent(opts.userId)}`,
  );
  const es = new EventSource(url, { headers: makeHeaders(opts.token) });

  const listener = (event: any) => {
    if (event?.type === 'message') {
      const raw = String(event.data || '').trim();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as WalletBalancesStreamEvent | WalletBalancesStreamComplete;
        if ((parsed as any)?.type === 'complete') return;
        onData(parsed as WalletBalancesStreamEvent);
      } catch {
        // ignore malformed events
      }
    } else if (event?.type === 'error' || event?.type === 'exception') {
      onError?.(String(event?.message || 'Stream error'));
    }
  };

  es.addEventListener('open', listener);
  es.addEventListener('message', listener);
  es.addEventListener('error', listener);
  es.addEventListener('close', listener);

  return () => {
    try {
      es.removeAllEventListeners();
      es.close();
    } catch {
      // ignore
    }
  };
}

