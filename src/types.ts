import type { SessionTypes, SignClientTypes } from '@walletconnect/types';

export type TabKey = 'balance' | 'transactions' | 'lightning';
export type ScreenKey = 'wallet' | 'about';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

export type UserProfile = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  googleId?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
};

export type UserStats = {
  walletCount: number;
  transactionCount: number;
  totalBalance: string;
  activeWallets: number;
  createdAt?: string;
  lastLoginAt?: string | null;
};

export type UserActivity = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type WalletConnectSession = SessionTypes.Struct;
export type WalletConnectRequestEvent = SignClientTypes.EventArguments['session_request'];
export type WalletConnectProposalEvent = SignClientTypes.EventArguments['session_proposal'];
