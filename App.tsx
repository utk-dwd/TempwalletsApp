import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking as RNLinking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Dimensions,
  TextInput,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as ExpoLinking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Application from 'expo-application';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WalletKit, type IWalletKit } from '@reown/walletkit';
import { Core } from '@walletconnect/core';
import type { SessionTypes } from '@walletconnect/types';
import {
  TabKey,
  ScreenKey,
  AuthUser,
  UserProfile,
  UserStats,
  UserActivity,
  WalletConnectSession,
  WalletConnectRequestEvent,
  WalletConnectProposalEvent,
} from './src/types';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  FINGERPRINT_KEY,
  API_URL,
  MOBILE_API_URL,
  TEMPWALLETS_BACKEND_URL,
  WC_PROJECT_ID,
} from './src/config/auth';
import { decodeUserParam, shortAddress } from './src/utils/auth';
import {
  extractPrimaryEvmAddressFromUiPayload,
  formatUnits,
  hexToRgba,
  isValidEvmAddress,
  normalizeEvmAddress,
} from './src/utils/wallet';
import { getRequestedEip155ChainIds } from './src/utils/walletConnect';
import { AboutScreen } from './src/screens/AboutScreen';
import { userApi } from './src/services/userApi';
import {
  walletApi,
  WalletHistoryEntry,
  AnyAsset,
  WalletTx,
  ChainBalance,
} from './src/services/walletApi';
import {
  startWalletAddressesStream,
  startWalletBalancesStream,
  type WalletBalancesStreamEvent,
} from './src/services/walletStreams';
import {
  ABOUT_BLOGS,
  ABOUT_SERVICES,
  ABOUT_TEAM,
  ACTIONS,
  DEFAULT_VISIBLE_NETWORK_IDS,
  NETWORK_BASE_ASSET_BY_ID,
  NETWORK_ITEM_BY_ID,
  NETWORK_LIST,
  TESTIMONIALS,
  type WalletNetworkItem,
} from './src/constants/walletUi';
import { WalletOverviewSection } from './src/components/wallet/WalletOverviewSection';
import { WalletTabsSection } from './src/components/wallet/WalletTabsSection';
import { SendModal } from './src/components/modals/SendModal';
import { NetworkListModal } from './src/components/modals/NetworkListModal';
import { WalletHistoryModal } from './src/components/modals/WalletHistoryModal';

const INITIAL_ADDRESS = '0x52e87d9c5f3a1d2b9a7f5c8e3a1b9c0d8e3a8e3ac';
const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('wallet');
  const [activeTab, setActiveTab] = useState<TabKey>('balance');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [xpAwarding, setXpAwarding] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profilePictureInput, setProfilePictureInput] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [userXp, setUserXp] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState(INITIAL_ADDRESS);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [walletConnectUrl, setWalletConnectUrl] = useState('');
  const [isWcInitializing, setIsWcInitializing] = useState(false);
  const [isWcPairing, setIsWcPairing] = useState(false);
  const [wcError, setWcError] = useState<string | null>(null);
  const [wcSessions, setWcSessions] = useState<WalletConnectSession[]>([]);
  const [backendWcSessions, setBackendWcSessions] = useState<any[]>([]);
  const [pendingWcProposals, setPendingWcProposals] = useState<any[]>([]);
  const [pendingWcRequestsByTopic, setPendingWcRequestsByTopic] = useState<Record<string, any[]>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletHistory, setWalletHistory] = useState<WalletHistoryEntry[]>([]);
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false);
  const [walletAddresses, setWalletAddresses] = useState<Record<string, unknown> | null>(null);
  const [chainBalances, setChainBalances] = useState<ChainBalance[]>([]);
  const [anyAssets, setAnyAssets] = useState<AnyAsset[]>([]);
  const [chainTokenBalances, setChainTokenBalances] = useState<AnyAsset[]>([]);
  const [chainTransactions, setChainTransactions] = useState<WalletTx[]>([]);
  const [anyTransactions, setAnyTransactions] = useState<WalletTx[]>([]);
  const [paymasterBalances, setPaymasterBalances] = useState<ChainBalance[]>([]);
  const [walletUserId, setWalletUserId] = useState<string | null>(null);
  const [showNetworkList, setShowNetworkList] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState('ethereumErc4337');
  const [visibleNetworkIds, setVisibleNetworkIds] = useState<string[]>(DEFAULT_VISIBLE_NETWORK_IDS);
  const [hideBalances, setHideBalances] = useState(false);
  const createSpin = useRef(new Animated.Value(0)).current;
  const wcClientRef = useRef<IWalletKit | null>(null);
  const apiBaseUrlRef = useRef<string | null>(null);
  const isHandlingScanRef = useRef(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const greeting = useMemo(() => {
    if (authUser?.name) {
      const [firstName] = authUser.name.split(' ');
      return `Hello, ${firstName}!`;
    }
    return 'Hello, User!';
  }, [authUser?.name]);

  const visibleNetworks = useMemo<
    Array<{
      id: string;
      label: string;
      badge: string;
      subtitle: string;
      color: string;
      logo: string;
      dot?: boolean;
    }>
  >(
    () =>
      visibleNetworkIds
        .map((id) => NETWORK_ITEM_BY_ID[id])
        .filter((item): item is WalletNetworkItem => Boolean(item))
        .map((item) => ({
          id: item.id,
          label: item.name,
          badge: item.badge === 'EOA' ? 'EOA' : 'Gasless',
          subtitle: item.badge === 'EOA' ? '' : 'EIP-7702',
          color: item.color,
          logo: item.logo,
          dot: item.dot,
        })),
    [visibleNetworkIds]
  );

  const selectedNetwork = useMemo<WalletNetworkItem>(
    () =>
      (NETWORK_ITEM_BY_ID[selectedNetworkId] ||
        NETWORK_ITEM_BY_ID.ethereumErc4337) as WalletNetworkItem,
    [selectedNetworkId],
  );
  const selectedChain = useMemo(() => {
    const name = selectedNetwork.name.toLowerCase();
    if (name.includes('ethereum')) return 'ethereum';
    if (name.includes('base')) return 'base';
    if (name.includes('arbitrum')) return 'arbitrum';
    if (name.includes('polygon')) return 'polygon';
    if (name.includes('avalanche')) return 'avalanche';
    return 'ethereum';
  }, [selectedNetwork.name]);

  const selectedChainId = useMemo(() => {
    const map: Record<string, number> = {
      ethereum: 1,
      base: 8453,
      arbitrum: 42161,
      polygon: 137,
      avalanche: 43114,
    };
    return map[selectedChain] || 1;
  }, [selectedChain]);

  // Prefer the native asset for the selected chain for display and sends.
  const selectedNativeAsset = useMemo(() => {
    const nativeFromChain = chainTokenBalances.find((t) => (t as any)?.address === null) as any;
    if (nativeFromChain) return nativeFromChain;

    const nativeFromAny = anyAssets.find(
      (asset) =>
        (asset as any)?.address === null &&
        String((asset as any)?.chain || '')
          .toLowerCase()
          .includes(selectedChain)
    ) as any;
    return nativeFromAny || null;
  }, [anyAssets, chainTokenBalances, selectedChain]);

  const selectedNativeHuman = useMemo(() => {
    if (!selectedNativeAsset) return '0';
    const fromApi = (selectedNativeAsset as any).balanceHuman;
    if (typeof fromApi === 'string' && fromApi.trim()) return fromApi.trim();
    const decimals = Number((selectedNativeAsset as any).decimals ?? 18);
    const bal = String((selectedNativeAsset as any).balance ?? '0');
    return formatUnits(bal, decimals, 6);
  }, [selectedNativeAsset]);

  const selectedNativeSymbol = useMemo(() => {
    const sym = (selectedNativeAsset as any)?.symbol;
    return typeof sym === 'string' && sym.trim() ? sym.trim() : 'ETH';
  }, [selectedNativeAsset]);

  const selectedBalance = useMemo(
    () => ({
      amount: `${selectedNativeHuman} ${selectedNativeSymbol}`,
      usdValue: '$0.00',
      changePct: '+0.00%',
    }),
    [selectedNativeHuman, selectedNativeSymbol]
  );

  const recentAnyTransactions = useMemo(() => {
    const map = new Map<string, WalletTx>();
    for (const tx of anyTransactions) {
      const key = `${String(tx.chain || '').toLowerCase()}:${String(tx.txHash || '').toLowerCase()}`;
      if (!key.includes(':') || key.endsWith(':')) continue;
      if (!map.has(key)) map.set(key, tx);
    }
    const list = Array.from(map.values());
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return list;
  }, [anyTransactions]);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          SecureStore.getItemAsync(AUTH_USER_KEY),
        ]);

        if (!storedToken) {
          await SecureStore.deleteItemAsync(AUTH_USER_KEY);
          return;
        }

        const authBaseUrl = await resolveApiBaseUrl();
        const meResponse = await fetch(new URL('/auth/me', authBaseUrl).toString(), {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!meResponse.ok) {
          await clearAuthState();
          return;
        }

        const meData = (await meResponse.json()) as Partial<AuthUser> & { id?: string };
        const userFromApi: AuthUser = {
          id: meData.id || '',
          email: meData.email ?? null,
          name: meData.name ?? null,
          picture: meData.picture ?? null,
        };

        const finalUser = userFromApi.id
          ? userFromApi
          : storedUser
            ? decodeUserParam(storedUser)
            : null;

        if (!finalUser) {
          await clearAuthState();
          return;
        }

        await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(finalUser));
        setAuthToken(storedToken);
        setAuthUser(finalUser);
      } catch {
        await clearAuthState();
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadAuthState();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const id = authUser?.id || (await getOrCreateFingerprint());
        if (!cancelled) setWalletUserId(id);
      } catch {
        if (!cancelled) setWalletUserId(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (!walletUserId) return;
    let stopAddresses: null | (() => void) = null;
    let stopBalances: null | (() => void) = null;
    let cancelled = false;

    const upsertChainBalance = (chain: string, balance: string) => {
      setChainBalances((prev) => {
        const key = String(chain || '').toLowerCase();
        const next = prev.slice();
        const idx = next.findIndex((b) => String(b.chain || '').toLowerCase() === key);
        if (idx >= 0) next[idx] = { ...next[idx], chain, balance };
        else next.push({ chain, balance });
        return next;
      });
    };

    const run = async () => {
      try {
        const baseUrl = await resolveApiBaseUrl();
        if (cancelled) return;
        stopAddresses = startWalletAddressesStream(
          { baseUrl, token: authToken, userId: walletUserId },
          (payload) => {
            setWalletAddresses(payload);
            const primary = extractPrimaryEvmAddressFromUiPayload(payload);
            if (primary) setWalletAddress(normalizeEvmAddress(primary));
          },
        );
        stopBalances = startWalletBalancesStream(
          { baseUrl, token: authToken, userId: walletUserId },
          (payload: WalletBalancesStreamEvent) => {
            const chain = String(payload?.chain || '').trim();
            if (!chain) return;
            if (typeof payload?.nativeBalance === 'string') {
              upsertChainBalance(chain, payload.nativeBalance);
            }
            if (chain === selectedChain && Array.isArray(payload?.tokens)) {
              // Stream token list is backend-defined; treat as AnyAsset[] when possible.
              setChainTokenBalances(payload.tokens as any);
            }
          },
        );
      } catch {
        // Streaming is best-effort; ignore failures.
      }
    };

    run();
    return () => {
      cancelled = true;
      try {
        stopAddresses?.();
      } catch {}
      try {
        stopBalances?.();
      } catch {}
    };
  }, [walletUserId, authToken, selectedChain]);

  useEffect(() => {
    loadWalletRuntimeData(false);
    if (authToken) {
      loadWalletHistory();
    } else {
      setWalletHistory([]);
    }
  }, [authToken, authUser?.id]);

  useEffect(() => {
    refreshSelectedChainData(false);
  }, [authToken, authUser?.id, selectedChain]);

  useEffect(() => {
    if (activeTab !== 'transactions') return;
    const run = async () => {
      try {
        const baseUrl = await resolveApiBaseUrl();
        const token = authToken;
        const userId = authUser?.id || (await getOrCreateFingerprint());
        const txAny = await walletApi.getTransactionsAny(baseUrl, token, 100, { userId } as any);
        setAnyTransactions(txAny);
      } catch {
        // ignore (rate limit / offline)
      }
    };
    run();
  }, [activeTab, authToken, authUser?.id]);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isCreating) {
      createSpin.setValue(0);
      loop = Animated.loop(
        Animated.timing(createSpin, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
    }

    return () => {
      if (loop) {
        loop.stop();
      }
    };
  }, [createSpin, isCreating]);

  useEffect(() => {
    if (!showConnectModal) {
      setShowScanner(false);
      setWalletConnectUrl('');
      setWcError(null);
      isHandlingScanRef.current = false;
    }
  }, [showConnectModal]);

  const spinInterpolate = createSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const generateWalletAddress = () => {
    const chars = '0123456789abcdef';
    let hex = '';
    for (let i = 0; i < 40; i += 1) {
      hex += chars[Math.floor(Math.random() * chars.length)];
    }
    return `0x${hex}`;
  };

  const getOrCreateFingerprint = async () => {
    const existing = await SecureStore.getItemAsync(FINGERPRINT_KEY);
    if (existing) {
      return existing;
    }

    let androidId = '';
    try {
      androidId = await Application.getAndroidId();
    } catch {
      androidId = '';
    }

    const devicePart =
      androidId || Application.applicationId || Math.random().toString(36).slice(2, 10);
    const fingerprint = `temp-mobile-${devicePart}`;
    await SecureStore.setItemAsync(FINGERPRINT_KEY, fingerprint);
    return fingerprint;
  };

  const isBackendReachable = async (baseUrl: string) => {
    const probeEndpoints = [
      '/health',
      '/wallet/addresses?userId=temp-mobile-probe',
      '/auth/google',
    ];
    for (const endpoint of probeEndpoints) {
      try {
        const probeUrl = new URL(endpoint, baseUrl).toString();
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        );
        const response = await Promise.race([fetch(probeUrl), timeout]);
        // Treat any non-5xx response as "backend reachable" for this probe.
        if ((response as Response).status < 500) {
          return true;
        }
      } catch {
        // Continue probing other known endpoints.
      }
    }
    return false;
  };

  const getPreferredApiBaseUrl = () => MOBILE_API_URL || API_URL;

  const resolveGoogleAuthBaseUrl = async () => {
    const candidates = [MOBILE_API_URL, API_URL].filter(
      (url, idx, arr) => Boolean(url) && arr.indexOf(url) === idx
    );
    for (const candidate of candidates) {
      const reachable = await isBackendReachable(candidate);
      if (reachable) {
        return candidate;
      }
    }
    throw new Error(
      `Backend is unreachable from emulator. Checked: ${candidates.join(', ')}`
    );
  };

  const resolveApiBaseUrl = async () => {
    if (apiBaseUrlRef.current) {
      return apiBaseUrlRef.current;
    }
    const resolved = await resolveGoogleAuthBaseUrl();
    apiBaseUrlRef.current = resolved;
    return resolved;
  };

  const clearAuthState = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(AUTH_USER_KEY),
    ]);
    setAuthToken(null);
    setAuthUser(null);
  };

  const requireAuthAndBase = async () => {
    if (!authToken) {
      throw new Error('Please sign in first.');
    }
    const baseUrl = await resolveApiBaseUrl();
    return { baseUrl, token: authToken };
  };

  const loadWalletRuntimeData = async (refresh: boolean = false) => {
    try {
      // Use the same resolved base URL as write operations (create/send),
      // otherwise reads can hit a different backend and look "stuck".
      const baseUrl = await resolveApiBaseUrl();
      const token = authToken;
      const userId = authUser?.id || (await getOrCreateFingerprint());
      const uiAddresses = await walletApi.getAddresses(baseUrl, token, { userId });
      setWalletAddresses(uiAddresses);
      const primaryAddress = extractPrimaryEvmAddressFromUiPayload(uiAddresses);
      if (primaryAddress) setWalletAddress(normalizeEvmAddress(primaryAddress));

      const balancesPromise = refresh
        ? walletApi
            .refreshBalances(baseUrl, token, { userId })
            .then((r) => r.balances || [])
        : walletApi.getBalances(baseUrl, token, { userId, refresh });
      const [balancesRes, assetsRes, paymasterRes] = await Promise.allSettled([
        balancesPromise,
        walletApi.getAssetsAny(baseUrl, token, { userId, refresh }),
        walletApi.getPaymasterBalances(baseUrl, token, { userId }),
      ]);

      if (balancesRes.status === 'fulfilled') setChainBalances(balancesRes.value);
      if (assetsRes.status === 'fulfilled') setAnyAssets(assetsRes.value);
      if (paymasterRes.status === 'fulfilled') setPaymasterBalances(paymasterRes.value);

      // Only fetch any-chain transactions when the Transactions tab is visible (or on explicit refresh).
      if (activeTab === 'transactions' || refresh) {
        try {
          const txAny = await walletApi.getTransactionsAny(
            baseUrl,
            token,
            100,
            { userId, refresh } as any
          );
          setAnyTransactions(txAny);
        } catch {
          // Don't fail the whole screen if tx fetch is rate-limited.
        }
      }
    } catch (error) {
      Alert.alert('Wallet API error', error instanceof Error ? error.message : 'Failed loading wallet data');
    }
  };

  const refreshSelectedChainData = async (refresh: boolean = false) => {
    try {
      const baseUrl = await resolveApiBaseUrl();
      const token = authToken;
      const userId = authUser?.id || (await getOrCreateFingerprint());
      const [tokensRes, txsRes] = await Promise.allSettled([
        walletApi.getTokenBalances(baseUrl, token, selectedChain, { userId, refresh }),
        walletApi.getTransactions(baseUrl, token, selectedChain, 50, { userId, refresh } as any),
      ]);
      if (tokensRes.status === 'fulfilled') setChainTokenBalances(tokensRes.value);
      if (txsRes.status === 'fulfilled') setChainTransactions(txsRes.value);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed loading chain data';
      Alert.alert(
        'Chain API error',
        msg.includes('Backend is unreachable')
          ? `Backend not reachable.\n\nSet EXPO_PUBLIC_MOBILE_API_URL or EXPO_PUBLIC_API_URL to your Tempwallet backend (default: ${TEMPWALLETS_BACKEND_URL}).`
          : msg
      );
    }
  };

  const loadWalletHistory = async () => {
    try {
      const { baseUrl, token } = await requireAuthAndBase();
      const history = await walletApi.getWalletHistory(baseUrl, token);
      setWalletHistory(history.wallets || []);
    } catch (error) {
      Alert.alert('Wallet history error', error instanceof Error ? error.message : 'Failed to load history');
    }
  };

  const loadUserApisData = async () => {
    setProfileLoading(true);
    try {
      const { baseUrl, token } = await requireAuthAndBase();
      const [profile, stats, activity, xp] = await Promise.all([
        userApi.getProfile(baseUrl, token),
        userApi.getStats(baseUrl, token),
        userApi.getActivity(baseUrl, token, 50),
        userApi.getXp(baseUrl, token),
      ]);

      setProfileData(profile);
      setProfileNameInput(profile.name || '');
      setProfilePictureInput(profile.picture || '');
      setUserStats(stats);
      setUserActivities(activity);
      setUserXp(xp.xp || 0);
    } catch (error) {
      Alert.alert('User API error', error instanceof Error ? error.message : 'Failed loading user data');
    } finally {
      setProfileLoading(false);
    }
  };

  const openProfileModal = async () => {
    if (!authToken || !authUser) {
      Alert.alert('Sign in required', 'Please sign in with Google first.');
      return;
    }
    setShowProfileModal(true);
    await loadUserApisData();
  };

  const saveUserProfile = async () => {
    setProfileSaving(true);
    try {
      const { baseUrl, token } = await requireAuthAndBase();
      const updated = await userApi.updateProfile(baseUrl, token, {
        name: profileNameInput.trim() || null,
        picture: profilePictureInput.trim() || null,
      });
      setProfileData(updated);
      const mergedUser: AuthUser = {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        picture: updated.picture,
      };
      setAuthUser(mergedUser);
      await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(mergedUser));
      Alert.alert('Profile updated', 'Your profile has been saved.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const awardUserXp = async () => {
    setXpAwarding(true);
    try {
      const { baseUrl, token } = await requireAuthAndBase();
      const response = await userApi.awardXp(baseUrl, token, {
        amount: 5,
        reason: 'Mobile milestone action',
      });
      setUserXp(response.totalXP);
      Alert.alert('XP awarded', `+${response.xp} XP (Total: ${response.totalXP})`);
      await loadUserApisData();
    } catch (error) {
      Alert.alert('XP award failed', error instanceof Error ? error.message : 'Unable to award XP.');
    } finally {
      setXpAwarding(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and associated data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAccountDeleting(true);
            try {
              const { baseUrl, token } = await requireAuthAndBase();
              await userApi.deleteAccount(baseUrl, token);
              await clearAuthState();
              setShowProfileModal(false);
              Alert.alert('Account deleted', 'Your account was deleted successfully.');
            } catch (error) {
              Alert.alert(
                'Delete failed',
                error instanceof Error ? error.message : 'Unable to delete account.'
              );
            } finally {
              setAccountDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    try {
      const fingerprint = await getOrCreateFingerprint();
      const authBaseUrl = await resolveGoogleAuthBaseUrl();
      const tryLoginWithRedirect = async (redirectUri: string, mobileRedirectUrl: string) => {
        // Backend contract supports `returnUrl`; keep `mobileRedirectUrl` for backward compatibility.
        const state = JSON.stringify({ fingerprint, returnUrl: mobileRedirectUrl, mobileRedirectUrl });
        const authUrlObj = new URL('/auth/google', authBaseUrl);
        authUrlObj.searchParams.set('state', state);
        const authUrl = authUrlObj.toString();

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
        if (result.type !== 'success' || !result.url) {
          return null;
        }

        const parsed = ExpoLinking.parse(result.url);
        const tokenParam = parsed.queryParams?.token;
        const userParam = parsed.queryParams?.user;
        const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
        const userString = Array.isArray(userParam) ? userParam[0] : userParam;
        if (!token || !userString) {
          return null;
        }

        const parsedUser = decodeUserParam(String(userString));
        if (!parsedUser) {
          return null;
        }

        return { token, parsedUser };
      };

      // Attempt 1: Expo proxy redirect (https), often accepted by stricter backend allow-lists.
      // This is especially useful in Expo Go where custom-scheme deep links are not always allowed.
      let proxyRedirect = '';
      try {
        // In Expo Go this usually resolves to https://auth.expo.io/... and works with strict backend allow-lists.
        proxyRedirect = AuthSession.getRedirectUrl('auth/callback');
      } catch {
        proxyRedirect = '';
      }
      let authPayload =
        proxyRedirect && proxyRedirect.startsWith('https://')
          ? await tryLoginWithRedirect(proxyRedirect, proxyRedirect)
          : null;

      // Attempt 2: deep link back to app.
      // - Expo Go: exp://.../--/auth/callback
      // - Standalone/dev-client: tempwallets://auth/callback
      if (!authPayload) {
        const appRedirect = ExpoLinking.createURL('auth/callback');
        authPayload = await tryLoginWithRedirect(appRedirect, appRedirect);
      }

      // Attempt 3: website callback fallback for shared backend setups.
      if (!authPayload) {
        const webCallback = 'https://www.tempwallets.com/auth/callback';
        authPayload = await tryLoginWithRedirect(webCallback, webCallback);
      }

      if (!authPayload) {
        Alert.alert('Authentication cancelled', 'Google sign-in was not completed.');
        return;
      }

      await Promise.all([
        SecureStore.setItemAsync(AUTH_TOKEN_KEY, authPayload.token),
        SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(authPayload.parsedUser)),
      ]);

      apiBaseUrlRef.current = authBaseUrl;
      setAuthToken(authPayload.token);
      setAuthUser(authPayload.parsedUser);
      Alert.alert('Signed in', `Welcome ${authPayload.parsedUser.name || 'to Tempwallets'}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete Google login.';
      Alert.alert('Google Sign-In error', message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        const authBaseUrl = await resolveApiBaseUrl();
        await fetch(new URL('/auth/logout', authBaseUrl).toString(), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    } catch {
      // Ignore logout request failures; local logout should still work.
    } finally {
      await clearAuthState();
    }
  };

  const handleAuthPress = async () => {
    if (isAuthLoading || isSigningIn) {
      return;
    }
    if (authUser) {
      await handleLogout();
      return;
    }
    await handleGoogleSignIn();
  };

  const resolveWalletUserId = async () => authUser?.id || getOrCreateFingerprint();

  useEffect(() => {
    if (!showConnectModal) return;
    let cancelled = false;
    const run = async () => {
      try {
        const userId = await resolveWalletUserId();
        const qs = `?userId=${encodeURIComponent(userId)}`;
        const sessionsRes = await wcApiRequest<{ sessions: any[] }>(`/walletconnect/sessions${qs}`);
        if (cancelled) return;
        setBackendWcSessions(Array.isArray((sessionsRes as any)?.sessions) ? (sessionsRes as any).sessions : []);

        const proposalsRes = await wcApiRequest<{ proposals: any[] }>(
          `/walletconnect/proposals/pending${qs}`,
        );
        if (cancelled) return;
        setPendingWcProposals(
          Array.isArray((proposalsRes as any)?.proposals) ? (proposalsRes as any).proposals : [],
        );

        const topics = (Array.isArray((sessionsRes as any)?.sessions) ? (sessionsRes as any).sessions : [])
          .map((s: any) => String(s?.topic || '').trim())
          .filter(Boolean)
          .slice(0, 3);

        const requestsMap: Record<string, any[]> = {};
        for (const topic of topics) {
          try {
            const reqRes = await wcApiRequest<{ requests: any[] }>(
              `/walletconnect/sessions/${encodeURIComponent(topic)}/requests/pending${qs}`,
            );
            requestsMap[topic] = Array.isArray((reqRes as any)?.requests)
              ? (reqRes as any).requests
              : [];
          } catch {
            requestsMap[topic] = [];
          }
        }
        if (!cancelled) setPendingWcRequestsByTopic(requestsMap);
      } catch {
        if (!cancelled) {
          setBackendWcSessions([]);
          setPendingWcProposals([]);
          setPendingWcRequestsByTopic({});
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [showConnectModal, authUser?.id, authToken]);

  const wcApiRequest = async <T,>(
    endpoint: string,
    init?: RequestInit
  ): Promise<T> => {
    const baseUrl = await resolveApiBaseUrl();
    const response = await fetch(new URL(endpoint, baseUrl).toString(), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers || {}),
      },
    });
    if (!response.ok) {
      const raw = await response.text();
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        const msg = Array.isArray(parsed?.message)
          ? parsed.message.join(', ')
          : parsed?.message || raw;
        throw new Error(msg || `WalletConnect API failed (${response.status})`);
      } catch {
        throw new Error(raw || `WalletConnect API failed (${response.status})`);
      }
    }
    return response.json() as Promise<T>;
  };

  const syncWcSessions = () => {
    const client = wcClientRef.current;
    if (!client) {
      setWcSessions([]);
      return;
    }
    const sessions = Object.values(client.getActiveSessions() || {});
    setWcSessions(sessions);
  };

  const confirmDialog = (title: string, message: string, confirmText: string) =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: 'Reject', style: 'cancel', onPress: () => resolve(false) },
          { text: confirmText, onPress: () => resolve(true) },
        ],
        { cancelable: false }
      );
    });

  const initializeWalletConnect = async () => {
    if (wcClientRef.current || isWcInitializing) {
      return;
    }
    if (!WC_PROJECT_ID) {
      throw new Error('EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID is missing');
    }

    setIsWcInitializing(true);
    setWcError(null);
    try {
      const core = new Core({ projectId: WC_PROJECT_ID });
      const walletKit = await WalletKit.init({
        core,
        metadata: {
          name: 'Tempwallets',
          description: 'Tempwallets mobile app',
          url: 'https://tempwallets.com',
          icons: ['https://tempwallets.com/tempwallets-logo.png'],
        },
      });

      walletKit.on('session_proposal', async (proposal: WalletConnectProposalEvent) => {
        const userId = await resolveWalletUserId();
        try {
          await wcApiRequest('/walletconnect/save-proposal', {
            method: 'POST',
            body: JSON.stringify({
              userId,
              proposalId: proposal.id,
              proposer: proposal.params.proposer,
              requiredNamespaces: proposal.params.requiredNamespaces,
              optionalNamespaces: proposal.params.optionalNamespaces,
              expiresAt: new Date(proposal.params.expiryTimestamp * 1000).toISOString(),
            }),
          });
        } catch {
          // Continue with local approval flow even if save-proposal fails.
        }

        const name = proposal.params.proposer.metadata?.name || 'Unknown dApp';
        const url = proposal.params.proposer.metadata?.url || '';
        const approved = await confirmDialog(
          'WalletConnect Request',
          `Connect your Tempwallet to ${name}?${url ? `\n\n${url}` : ''}`,
          'Connect'
        );

        if (!approved) {
          await wcApiRequest('/walletconnect/reject-proposal', {
            method: 'POST',
            body: JSON.stringify({ userId, proposalId: proposal.id, reason: 'User rejected' }),
          }).catch(() => undefined);
          await walletKit.rejectSession({
            id: proposal.id,
            reason: { code: 5000, message: 'User rejected' },
          });
          return;
        }

        let approvedChains = getRequestedEip155ChainIds(proposal);
        if (approvedChains.length === 0) {
          const accountPayload = await wcApiRequest<{
            accounts: Array<{ chainId: number }>;
          }>(`/walletconnect/accounts?userId=${encodeURIComponent(userId)}`);
          approvedChains = [...new Set(accountPayload.accounts.map((a) => a.chainId))];
        }
        if (approvedChains.length === 0) {
          throw new Error('No supported chains found for this wallet.');
        }

        const approval = await wcApiRequest<{
          namespaces: SessionTypes.Namespaces;
        }>('/walletconnect/approve-proposal', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            proposalId: proposal.id,
            approvedChains,
          }),
        });

        const { topic } = await walletKit.approveSession({
          id: proposal.id,
          namespaces: approval.namespaces,
        });

        const activeSessions = walletKit.getActiveSessions();
        const session = activeSessions[topic];
        if (session) {
          await wcApiRequest('/walletconnect/save-session', {
            method: 'POST',
            body: JSON.stringify({
              userId,
              session,
              namespaces: approval.namespaces,
            }),
          }).catch(() => undefined);
        }
        syncWcSessions();
      });

      walletKit.on('session_request', async (event: WalletConnectRequestEvent) => {
        const userId = await resolveWalletUserId();
        const method = event.params.request.method;
        const approved = await confirmDialog(
          'Signing Request',
          `Approve request "${method}" from connected dApp?`,
          'Approve'
        );

        if (!approved) {
          await walletKit.respondSessionRequest({
            topic: event.topic,
            response: {
              id: event.id,
              jsonrpc: '2.0',
              error: { code: 5000, message: 'User rejected request' },
            },
          });
          return;
        }

        const signature = await wcApiRequest<{ signature: string }>('/walletconnect/sign', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            topic: event.topic,
            requestId: event.id,
            method,
            params: event.params.request.params,
            chainId: event.params.chainId,
          }),
        });

        await walletKit.respondSessionRequest({
          topic: event.topic,
          response: {
            id: event.id,
            jsonrpc: '2.0',
            result: signature.signature,
          },
        });
      });

      walletKit.on('session_delete', async ({ topic }) => {
        const userId = await resolveWalletUserId();
        await wcApiRequest(`/walletconnect/sessions/${encodeURIComponent(topic)}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        }).catch(() => undefined);
        syncWcSessions();
      });

      wcClientRef.current = walletKit;
      syncWcSessions();
    } finally {
      setIsWcInitializing(false);
    }
  };

  const disconnectDappSession = async (topic: string) => {
    const client = wcClientRef.current;
    if (!client) {
      return;
    }
    const userId = await resolveWalletUserId();
    await client.disconnectSession({
      topic,
      reason: { code: 6000, message: 'User disconnected' },
    });
    await wcApiRequest(`/walletconnect/sessions/${encodeURIComponent(topic)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }).catch(() => undefined);
    syncWcSessions();
  };

  const connectWalletConnectUri = async (uri: string) => {
    const client = wcClientRef.current;
    if (!client) {
      setWcError('WalletConnect client is not ready. Try again.');
      return;
    }
    if (!uri.startsWith('wc:')) {
      setWcError('Invalid WalletConnect URI.');
      return;
    }
    setIsWcPairing(true);
    setWcError(null);
    try {
      await client.pair({ uri });
      setWalletConnectUrl('');
      setShowScanner(false);
    } catch (error) {
      setWcError(error instanceof Error ? error.message : 'Failed to connect dApp.');
    } finally {
      setIsWcPairing(false);
    }
  };

  const handleStartScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Camera permission', 'Camera permission is required for QR scanning.');
        return;
      }
    }
    setShowScanner(true);
    setWcError(null);
    isHandlingScanRef.current = false;
  };

  const handleAction = async (actionId: string) => {
    if (actionId === 'connect') {
      setShowConnectModal(true);
      setWcError(null);
      try {
        await initializeWalletConnect();
      } catch (error) {
        setWcError(error instanceof Error ? error.message : 'Failed to initialize WalletConnect.');
      }
      return;
    }

    if (actionId === 'send') {
      setShowSendModal(true);
      return;
    }

    if (actionId === 'history') {
      setWalletBusy(true);
      await loadWalletHistory();
      setWalletBusy(false);
      setShowWalletHistoryModal(true);
      return;
    }

    if (actionId === 'copy') {
      await Clipboard.setStringAsync(normalizeEvmAddress(walletAddress));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      return;
    }

    if (actionId === 'create') {
      if (isCreating) {
        return;
      }
      setIsCreating(true);
      setWalletBusy(true);
      try {
        const baseUrl = await resolveApiBaseUrl();
        const userId = await resolveWalletUserId();
        const token = authToken;
        const created = await walletApi.createOrImportSeed(baseUrl, token, {
          userId,
          mode: 'random',
        });

        // Update UI immediately from the create response (prevents "looks stuck" bug).
        if (created?.ethereum) {
          setWalletAddress(normalizeEvmAddress(created.ethereum));
        } else if (created?.addresses) {
          const primary = extractPrimaryEvmAddressFromUiPayload(created.addresses);
          if (primary) setWalletAddress(normalizeEvmAddress(primary));
        }
        if (created?.addresses) {
          setWalletAddresses(created.addresses);
        }

        await loadWalletRuntimeData(true);
        await refreshSelectedChainData(true);
        if (authToken) {
          await loadWalletHistory();
        }
        setCopied(false);
        Alert.alert('Wallet created', 'A new wallet seed and address were generated.');
      } catch (error) {
        Alert.alert('Create wallet failed', error instanceof Error ? error.message : 'Unable to create wallet.');
      } finally {
        setWalletBusy(false);
        setTimeout(() => setIsCreating(false), 600);
      }
      return;
    }
  };

  const handleConnectSubmit = async () => {
    const uri = walletConnectUrl.trim();
    if (!uri) {
      setWcError('Paste a WalletConnect URL to connect.');
      return;
    }
    await connectWalletConnectUri(uri);
  };

  const handleSendSubmit = async () => {
    if (!sendAmount.trim() || Number(sendAmount) <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount to send.');
      return;
    }
    if (!recipientAddress.trim()) {
      Alert.alert('Recipient required', 'Enter recipient wallet address.');
      return;
    }
    if (!isValidEvmAddress(recipientAddress)) {
      Alert.alert('Invalid address', 'Enter a valid EVM address (0x + 40 hex chars).');
      return;
    }
    try {
      setWalletBusy(true);
      const baseUrl = await resolveApiBaseUrl();
      const token = authToken;
      const userId = await resolveWalletUserId();
      // Default to legacy transactions (EOA-style) for reliability.
      // The backend can auto-route to gasless on EIP-7702 chains, but that depends on paymaster config.
      const sendResult = await walletApi.sendCrypto(baseUrl, token, {
        userId,
        chain: selectedChain,
        amount: sendAmount.trim(),
        recipientAddress: normalizeEvmAddress(recipientAddress),
        forceLegacyTx: true,
      });
      Alert.alert('Transaction sent', `Tx hash: ${sendResult.txHash || 'submitted'}`);
      setShowSendModal(false);
      setSendAmount('');
      setRecipientAddress('');
      await loadWalletRuntimeData(true);
      await refreshSelectedChainData(true);
    } catch (error) {
      Alert.alert('Send failed', error instanceof Error ? error.message : 'Transaction failed.');
    } finally {
      setWalletBusy(false);
    }
  };

  const handleQrScanned = async ({ data }: { data: string }) => {
    if (isHandlingScanRef.current || isWcPairing) {
      return;
    }
    if (!data.startsWith('wc:')) {
      return;
    }
    isHandlingScanRef.current = true;
    setWalletConnectUrl(data);
    await connectWalletConnectUri(data);
    setTimeout(() => {
      isHandlingScanRef.current = false;
    }, 800);
  };

  const applySelectedNetwork = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setVisibleNetworkIds((prev) => {
      const withoutSelected = prev.filter((id) => id !== networkId);
      return [networkId, ...withoutSelected].slice(0, 4);
    });
  };

  const handleWalletRefresh = async () => {
    try {
      setWalletBusy(true);
      await loadWalletRuntimeData(true);
      await refreshSelectedChainData(true);
      if (authToken) {
        await loadWalletHistory();
      }
    } finally {
      setWalletBusy(false);
    }
  };

  const handleSwitchWallet = async (walletId: string) => {
    try {
      setWalletBusy(true);
      const { baseUrl, token } = await requireAuthAndBase();
      await walletApi.switchWallet(baseUrl, token, walletId);
      await Promise.all([loadWalletRuntimeData(true), refreshSelectedChainData(true), loadWalletHistory()]);
      setShowWalletHistoryModal(false);
      Alert.alert('Wallet switched', 'Active wallet was switched successfully.');
    } catch (error) {
      Alert.alert('Switch failed', error instanceof Error ? error.message : 'Unable to switch wallet.');
    } finally {
      setWalletBusy(false);
    }
  };

  const handleDeleteWalletHistory = async (walletId: string) => {
    try {
      setWalletBusy(true);
      const { baseUrl, token } = await requireAuthAndBase();
      await walletApi.deleteWalletHistory(baseUrl, token, walletId);
      await loadWalletHistory();
    } catch (error) {
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unable to delete wallet history.');
    } finally {
      setWalletBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {activeScreen === 'about' ? (
        <AboutScreen onBack={() => setActiveScreen('wallet')} />
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <WalletOverviewSection
          styles={styles}
          greeting={greeting}
          signedText={
            authUser
              ? 'Signed in'
              : isSigningIn
                ? 'Opening Google Sign-In...'
                : 'Sign in to sync your wallets'
          }
          walletAddressShort={shortAddress(walletAddress)}
          copied={copied}
          actions={ACTIONS as any}
          visibleNetworks={visibleNetworks}
          selectedNetworkId={selectedNetworkId}
          spinInterpolate={spinInterpolate}
          isCreating={isCreating}
          walletBusy={walletBusy}
          authIconName={authUser ? 'log-out-outline' : isSigningIn ? 'time-outline' : 'log-in-outline'}
          onAuthPress={handleAuthPress}
          onOpenProfile={openProfileModal}
          onOpenAbout={() => setActiveScreen('about')}
          onActionPress={handleAction}
          onOpenNetworkList={() => setShowNetworkList(true)}
          onSelectNetwork={applySelectedNetwork}
          onRefresh={handleWalletRefresh}
          hexToRgba={hexToRgba}
        />

        <WalletTabsSection
          styles={styles}
          activeTab={activeTab}
          walletBusy={walletBusy}
          walletAddresses={walletAddresses}
          chainBalancesCount={chainBalances.length}
          paymasterBalancesCount={paymasterBalances.length}
          hideBalances={hideBalances}
          selectedNativeHuman={selectedNativeHuman}
          selectedNativeSymbol={selectedNativeSymbol}
          selectedBalanceChangePct={selectedBalance.changePct}
          selectedBalanceUsdValue={selectedBalance.usdValue}
          selectedNetworkLogo={selectedNetwork.logo}
          selectedNetworkSymbol={selectedNetwork.symbol}
          selectedNetworkName={selectedNetwork.name}
          chainTokenBalances={chainTokenBalances as any}
          recentAnyTransactions={recentAnyTransactions}
          onChangeTab={setActiveTab}
          onRefresh={handleWalletRefresh}
          onToggleHideBalances={() => setHideBalances((prev) => !prev)}
          onOpenLightningInfo={() => Alert.alert('Lightning Nodes', 'Create or join coming soon')}
          formatUnits={formatUnits}
        />
      </ScrollView>
      )}

      <NetworkListModal
        visible={showNetworkList}
        onClose={() => setShowNetworkList(false)}
        networkList={NETWORK_LIST as any}
        selectedNetworkId={selectedNetworkId}
        onSelectNetwork={applySelectedNetwork}
        hexToRgba={hexToRgba}
        styles={styles}
      />

      <WalletHistoryModal
        visible={showWalletHistoryModal}
        walletHistory={walletHistory}
        walletBusy={walletBusy}
        onClose={() => setShowWalletHistoryModal(false)}
        onSwitchWallet={handleSwitchWallet}
        onDeleteWallet={handleDeleteWalletHistory}
        styles={styles}
      />

      <Modal visible={showConnectModal} transparent animationType="fade" onRequestClose={() => setShowConnectModal(false)}>
        <View style={styles.actionModalOverlay}>
          <View style={styles.connectModalCard}>
            <Pressable style={styles.actionModalClose} onPress={() => setShowConnectModal(false)}>
              <Ionicons name="close" size={22} color="#b7bbc7" />
            </Pressable>
            {isWcInitializing ? (
              <View style={styles.wcLoadingWrap}>
                <ActivityIndicator size="large" color="#60a5fa" />
                <Text style={styles.wcLoadingText}>Initializing WalletConnect...</Text>
              </View>
            ) : wcSessions.length > 0 ? (
              <>
                <Text style={styles.connectedHeaderTitle}>Your Connected dApps</Text>
                <View style={styles.connectedStatusCard}>
                  <Ionicons name="checkmark-done" size={18} color="#8ce99a" />
                  <Text style={styles.connectedStatusText}>
                    {wcSessions.length} active connection{wcSessions.length > 1 ? 's' : ''}
                  </Text>
                </View>
                {(backendWcSessions.length > 0 ||
                  pendingWcProposals.length > 0 ||
                  Object.keys(pendingWcRequestsByTopic).length > 0) && (
                  <Text style={styles.connectedStatusText}>
                    Backend sessions: {backendWcSessions.length} • Pending proposals:{' '}
                    {pendingWcProposals.length} • Pending requests:{' '}
                    {Object.values(pendingWcRequestsByTopic).reduce(
                      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
                      0,
                    )}
                  </Text>
                )}

                <ScrollView style={styles.connectedList} contentContainerStyle={styles.connectedListContent}>
                  {wcSessions.map((session) => (
                    <View key={session.topic} style={styles.connectedDappCard}>
                      <View style={styles.connectedDappTextWrap}>
                        <Text style={styles.connectedDappName}>
                          {session.peer.metadata?.name || 'Unknown dApp'}
                        </Text>
                        <Text style={styles.connectedDappUrl} numberOfLines={1}>
                          {session.peer.metadata?.url || 'No website URL'}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.connectedDisconnectBtn}
                        onPress={() => disconnectDappSession(session.topic)}
                      >
                        <Ionicons name="close" size={20} color="#ff7d7d" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>

                {!showScanner ? (
                  <Pressable style={styles.connectAnotherButton} onPress={handleStartScanner}>
                    <Ionicons name="add" size={20} color="#9ca3af" />
                    <Text style={styles.connectAnotherText}>Connect Another dApp</Text>
                  </Pressable>
                ) : (
                  <View style={styles.inlineScannerWrap}>
                    <CameraView
                      style={styles.inlineScannerCamera}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={handleQrScanned}
                    />
                    <Pressable style={styles.inlineScannerCancel} onPress={() => setShowScanner(false)}>
                      <Text style={styles.inlineScannerCancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.connectTitle}>Connect Your Tempwallet</Text>
                <Text style={styles.connectSubtitle}>Scan QR code to connect to a dApp</Text>
                {(backendWcSessions.length > 0 ||
                  pendingWcProposals.length > 0 ||
                  Object.keys(pendingWcRequestsByTopic).length > 0) && (
                  <Text style={styles.connectSubtitle}>
                    Backend sessions: {backendWcSessions.length} • Pending proposals:{' '}
                    {pendingWcProposals.length} • Pending requests:{' '}
                    {Object.values(pendingWcRequestsByTopic).reduce(
                      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
                      0,
                    )}
                  </Text>
                )}

                {showScanner ? (
                  <View style={styles.scannerContainer}>
                    <CameraView
                      style={styles.scannerCamera}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={handleQrScanned}
                    />
                    <Text style={styles.scanHint}>Scan QR to connect</Text>
                    <Pressable style={styles.inlineScannerCancel} onPress={() => setShowScanner(false)}>
                      <Text style={styles.inlineScannerCancelText}>Cancel scanner</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.qrPlaceholder} onPress={handleStartScanner}>
                    <Text style={styles.qrPlaceholderText}>Tap to scan QR code</Text>
                  </Pressable>
                )}

                <View style={styles.connectInputRow}>
                  <TextInput
                    value={walletConnectUrl}
                    onChangeText={setWalletConnectUrl}
                    placeholder="Or paste WalletConnect URL"
                    placeholderTextColor="#6b7280"
                    style={styles.connectInput}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={[styles.connectButton, isWcPairing && styles.connectButtonDisabled]}
                    onPress={handleConnectSubmit}
                    disabled={isWcPairing}
                  >
                    <Text style={styles.connectButtonText}>{isWcPairing ? 'Connecting' : 'Connect'}</Text>
                  </Pressable>
                </View>
              </>
            )}
            {wcError ? <Text style={styles.wcErrorText}>{wcError}</Text> : null}
          </View>
        </View>
      </Modal>

      <SendModal
        visible={showSendModal}
        onClose={() => setShowSendModal(false)}
        selectedNetworkLogo={selectedNetwork.logo}
        selectedNetworkName={selectedNetwork.name}
        selectedNativeSymbol={selectedNativeSymbol}
        sendAmount={sendAmount}
        onChangeSendAmount={setSendAmount}
        recipientAddress={recipientAddress}
        onChangeRecipientAddress={setRecipientAddress}
        onPasteRecipient={async () => setRecipientAddress(await Clipboard.getStringAsync())}
        onOpenNetworkList={() => setShowNetworkList(true)}
        onSubmit={handleSendSubmit}
        styles={styles}
      />

      <Modal visible={showProfileModal} transparent animationType="slide" onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.actionModalOverlay}>
          <View style={styles.profileModalCard}>
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>Profile & User APIs</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={16} color="#c7c7c7" />
              </Pressable>
            </View>

            {profileLoading ? (
              <View style={styles.profileLoadingWrap}>
                <ActivityIndicator size="large" color="#60a5fa" />
                <Text style={styles.profileLoadingText}>Loading profile, stats, activity and XP...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
                <View style={styles.profileStatGrid}>
                  <View style={styles.profileStatCard}>
                    <Text style={styles.profileStatLabel}>XP</Text>
                    <Text style={styles.profileStatValue}>{userXp}</Text>
                  </View>
                  <View style={styles.profileStatCard}>
                    <Text style={styles.profileStatLabel}>Wallets</Text>
                    <Text style={styles.profileStatValue}>{userStats?.walletCount ?? 0}</Text>
                  </View>
                  <View style={styles.profileStatCard}>
                    <Text style={styles.profileStatLabel}>Transactions</Text>
                    <Text style={styles.profileStatValue}>{userStats?.transactionCount ?? 0}</Text>
                  </View>
                </View>

                <Text style={styles.profileSectionTitle}>Get / Update Profile</Text>
                <TextInput
                  value={profileNameInput}
                  onChangeText={setProfileNameInput}
                  placeholder="Name"
                  placeholderTextColor="#6b7280"
                  style={styles.profileInput}
                />
                <TextInput
                  value={profilePictureInput}
                  onChangeText={setProfilePictureInput}
                  placeholder="Picture URL"
                  placeholderTextColor="#6b7280"
                  style={styles.profileInput}
                  autoCapitalize="none"
                />
                <Pressable style={styles.profileSaveButton} onPress={saveUserProfile} disabled={profileSaving}>
                  <Text style={styles.profileSaveButtonText}>
                    {profileSaving ? 'Saving...' : 'Save Profile (PATCH /user/profile)'}
                  </Text>
                </Pressable>

                <Text style={styles.profileSectionTitle}>User Activity (GET /user/activity)</Text>
                {userActivities.slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.activityItem}>
                    <Text style={styles.activityType}>{item.type}</Text>
                    <Text style={styles.activityDesc}>{item.description}</Text>
                  </View>
                ))}

                <Pressable style={styles.profileRefreshButton} onPress={loadUserApisData}>
                  <Text style={styles.profileRefreshButtonText}>Refresh Stats/Activity/XP</Text>
                </Pressable>

                <Pressable style={styles.profileXpButton} onPress={awardUserXp} disabled={xpAwarding}>
                  <Text style={styles.profileXpButtonText}>
                    {xpAwarding ? 'Awarding...' : 'Award +5 XP (POST /user/xp/award)'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.profileDeleteButton, accountDeleting && { opacity: 0.7 }]}
                  onPress={confirmDeleteAccount}
                  disabled={accountDeleting}
                >
                  <Text style={styles.profileDeleteButtonText}>
                    {accountDeleting ? 'Deleting...' : 'Delete Account (DELETE /user/account)'}
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  upperBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  upperBarSide: {
    flex: 1,
  },
  upperBarSideRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  upperBarCenter: {
    flex: 1.4,
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subGreeting: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  walletCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  walletCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  walletBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  walletBadgeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '600',
  },
  walletLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  walletAddress: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  copiedText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  actionsCard: {
    marginHorizontal: 20,
    backgroundColor: '#1f1f22',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainerActive: {
    backgroundColor: '#4f6b5f',
  },
  actionIconCopiedActive: {
    borderWidth: 2,
    borderColor: '#f8cf6c',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionLabel: {
    color: '#e5e7eb',
    fontSize: 10,
    fontWeight: '500',
  },
  actionLabelMuted: {
    color: '#6b7280',
  },
  actionLabelCopied: {
    color: '#ffffff',
    fontWeight: '700',
  },
  networksCard: {
    marginHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  networksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  seeList: {
    color: '#8a8a8a',
    fontSize: 11,
    fontWeight: '500',
  },
  networksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  networkItem: {
    width: '23%',
    alignItems: 'center',
    gap: 6,
  },
  networkIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2f2f2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkIconActive: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  networkIconMore: {
    backgroundColor: '#2f2f2f',
    borderWidth: 1,
    borderColor: '#3f3f3f',
  },
  networkLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  networkDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34c759',
  },
  networkLabel: {
    color: '#f9fafb',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  networkLabelActive: {
    color: '#ffffff',
  },
  networkBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  networkBadgeText: {
    color: '#60a5fa',
    fontSize: 9,
    fontWeight: '600',
  },
  networkSubtitle: {
    color: '#6b7280',
    fontSize: 9,
    textAlign: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    minHeight: 240,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  topDivider: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  tabButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  refreshButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
  },
  balancePanel: {
    borderWidth: 1,
    borderColor: '#eceef2',
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#fbfbfc',
  },
  balancePanelHeading: {
    color: '#6b7280',
    fontSize: 13,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceSyncMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 10,
  },
  balancePanelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  balancePanelAmount: {
    color: '#0f172a',
    fontSize: 46 / 1.5,
    fontWeight: '800',
  },
  balanceChangePill: {
    marginLeft: 8,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceChangeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceHideBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#eceef2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f6f8',
  },
  balanceHideBtnText: {
    color: '#374151',
    fontSize: 15 / 1.2,
    fontWeight: '600',
  },
  balanceTokenRow: {
    borderWidth: 1,
    borderColor: '#eceef2',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  balanceTokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceTokenLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  balanceTokenSymbol: {
    color: '#0f172a',
    fontSize: 18 / 1.35,
    fontWeight: '700',
  },
  balanceTokenChain: {
    color: '#6b7280',
    fontSize: 12 / 1.2,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceTokenRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  balanceTokenUsd: {
    color: '#0f172a',
    fontSize: 17 / 1.25,
    fontWeight: '700',
  },
  balanceTokenNative: {
    color: '#6b7280',
    fontSize: 15 / 1.2,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // About Screen Styles
  aboutContainer: {
    flex: 1,
    backgroundColor: '#020202',
  },
  aboutWebHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 10,
    paddingHorizontal: 12,
    pointerEvents: 'box-none',
  },
  aboutWebBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  aboutWebView: {
    flex: 1,
    backgroundColor: '#000',
  },
  aboutContent: {
    paddingBottom: 36,
  },
  aboutHero: {
    minHeight: 760,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackground: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 30,
    paddingTop: 38,
    paddingBottom: 24,
  },
  aboutTopbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
    marginTop: 2,
  },
  aboutMenuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogo: {
    width: 220,
    height: 42,
    marginLeft: -6,
  },
  heroContent: {
    alignItems: 'flex-start',
    marginTop: 0,
  },
  heroTitleStack: {
    gap: -14,
    marginBottom: 0,
    zIndex: 10,
  },
  aboutBigTitleOutline: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 78,
    lineHeight: 82,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  aboutBigTitleSolid: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 78,
    lineHeight: 82,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  shapeContainer: {
    height: 248,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 6,
    zIndex: -1,
    width: '100%',
  },
  aboutHeroShape: {
    width: '90%',
    height: 254,
    opacity: 0.96,
    transform: [{ translateX: -4 }],
  },
  heroTextContent: {
    width: '100%',
    alignItems: 'flex-start',
  },
  aboutHeroCaption: {
    color: '#fff',
    fontSize: 46 / 1.35,
    lineHeight: 44 / 1.2,
    fontWeight: '400',
    textAlign: 'left',
    marginBottom: 20,
  },
  aboutHeroSub: {
    color: 'rgba(197,211,233,0.82)',
    fontSize: 9,
    letterSpacing: 1.3,
    textAlign: 'left',
    marginBottom: 36,
    textTransform: 'uppercase',
  },
  aboutCta: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1c2434',
    borderWidth: 1,
    borderColor: '#2b3448',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  aboutCtaText: {
    color: '#fff',
    fontSize: 34 / 2,
    fontWeight: '600',
  },
  aboutStatsRow: {
    marginTop: 58,
    flexDirection: 'row',
    gap: 52,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  profileSection: {
    marginTop: 12,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f4',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  activityAction: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  activityMeta: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 3,
  },
  activityTimestamp: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ffffff',
  },
  aboutStatsValue: {
    color: '#fff',
    fontSize: 43 / 1.5,
    fontWeight: '400',
  },
  aboutStatsLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 34 / 2.2,
    fontWeight: '500',
  },
  aboutSection: {
    paddingHorizontal: 20,
    marginTop: 40,
    gap: 20,
  },
  aboutServiceCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'flex-start',
  },
  aboutServiceIconContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutServiceIcon: {
    width: 64,
    height: 64,
  },
  aboutServiceTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  aboutServiceDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 24,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  aboutLearn: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  aboutRiskSection: {
    paddingHorizontal: 20,
    marginTop: 60,
  },
  aboutRiskTitle: {
    color: '#fff',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '300',
    marginBottom: 16,
  },
  aboutRiskCopy: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 24,
  },
  riskSteps: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    paddingRight: 20,
  },
  riskStepLine: {
    width: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  riskStepText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 22,
  },
  aboutRiskCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 20,
  },
  aboutRiskCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  riskProgressContainer: {
    gap: 8,
  },
  riskProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  riskValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  enterpriseSection: {
    marginTop: 40,
    gap: 20,
  },
  enterpriseTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 38,
  },
  enterpriseStats: {
    flexDirection: 'row',
    gap: 40,
  },
  enterpriseValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 4,
  },
  enterpriseLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  aboutFaqTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '300',
    marginBottom: 16,
    lineHeight: 42,
  },
  aboutBlogCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  aboutBlogImage: {
    width: '100%',
    height: 310,
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  blogNavRow: {
    position: 'absolute',
    right: 20,
    top: 290,
    flexDirection: 'row',
    gap: 10,
  },
  blogNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  aboutBlogDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 34 / 2.3,
    marginBottom: 10,
  },
  aboutBlogTitle: {
    color: '#fff',
    fontSize: 54 / 2,
    lineHeight: 62 / 2,
    fontWeight: '400',
    marginBottom: 10,
  },
  aboutBlogDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 17,
    lineHeight: 30,
  },
  blogLearnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  blogTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  blogTag: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  blogTagText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15 / 1.2,
  },
  testimonialSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: -10,
    marginBottom: 20,
  },
  testimonialScroll: {
    gap: 16,
    paddingRight: 20,
  },
  testimonialCard: {
    width: 300,
    backgroundColor: '#0F1012',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 20,
    padding: 24,
  },
  testimonialHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  testimonialName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testimonialHandle: {
    color: '#666',
    fontSize: 13,
  },
  testimonialText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  aboutTeamShowcaseCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#120f16',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    position: 'relative',
    height: 380,
  },
  aboutTeamShowcaseImage: {
    width: '100%',
    height: '100%',
  },
  teamSocialLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  teamSocialRight: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  teamSocialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  teamBadgeWrap: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(58,58,61,0.68)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamNamePill: {
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  teamNamePillText: {
    color: '#fff',
    fontSize: 20 / 1.45,
    fontWeight: '700',
  },
  teamRolePillText: {
    color: '#e4e4e7',
    fontSize: 20 / 1.55,
    fontWeight: '600',
  },
  aboutFooter: {
    paddingHorizontal: 20,
    marginTop: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 40,
    paddingBottom: 40,
  },
  videoPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#111',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 40,
    marginBottom: 40,
  },
  aboutFooterHeading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  aboutFooterLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginBottom: 12,
  },
  aboutFooterLogo: {
    width: 200,
    height: 44,
    marginBottom: 16,
  },
  footerDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: '90%',
  },
  aboutFooterCopy: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '92%',
    maxWidth: 360,
    backgroundColor: '#0f0f10',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f1f22',
    overflow: 'hidden',
    maxHeight: '68%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f22',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 18,
  },
  modalSection: {
    gap: 10,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalSectionTitle: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalItem: {
    width: '30.5%',
    aspectRatio: 1,
    backgroundColor: '#151517',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 4,
  },
  modalItemActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#1c1c1f',
  },
  modalItemIconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  modalDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34c759',
  },
  modalSymbol: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  modalName: {
    color: '#8a8a8a',
    fontSize: 10,
  },
  modalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  modalBadge7702: {
    backgroundColor: 'rgba(96,165,250,0.2)',
  },
  modalBadgeEoa: {
    backgroundColor: 'rgba(168,85,247,0.2)',
  },
  modalBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  modalBadgeText7702: {
    color: '#60a5fa',
  },
  modalBadgeTextEoa: {
    color: '#c084fc',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1f1f22',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  modalFooterText: {
    color: '#5f5f5f',
    fontSize: 10,
  },
  walletHistoryModalCard: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: '#0f0f10',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f1f22',
    overflow: 'hidden',
    maxHeight: '60%',
  },
  walletHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171719',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  walletHistorySelectBtn: {
    flex: 1,
  },
  walletHistoryTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  walletHistoryMeta: {
    color: '#8d8d95',
    fontSize: 11,
    marginTop: 3,
  },
  walletHistoryDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,139,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  connectModalCard: {
    width: '100%',
    backgroundColor: '#050506',
    borderWidth: 1,
    borderColor: '#171922',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
  },
  actionModalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  connectTitle: {
    color: '#f8fafc',
    textAlign: 'center',
    fontSize: 48 / 2,
    lineHeight: 56 / 2,
    fontWeight: '700',
    marginTop: 2,
  },
  connectSubtitle: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 18,
  },
  qrPlaceholder: {
    minHeight: 340,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2432',
    backgroundColor: '#06080b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrPlaceholderText: {
    color: '#6b7280',
    fontSize: 36 / 2,
    lineHeight: 48 / 2,
    fontWeight: '500',
  },
  connectInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#06080b',
    borderWidth: 1,
    borderColor: '#1f2432',
    padding: 4,
  },
  connectInput: {
    flex: 1,
    color: '#f9fafb',
    fontSize: 16 / 1.8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  connectButton: {
    height: 42,
    minWidth: 108,
    borderRadius: 12,
    backgroundColor: '#b8b8b8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  connectButtonText: {
    color: '#18181b',
    fontSize: 16 / 1.5,
    fontWeight: '700',
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  wcErrorText: {
    marginTop: 10,
    color: '#f87171',
    textAlign: 'center',
    fontSize: 12,
  },
  scannerContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2b3448',
    marginBottom: 14,
    backgroundColor: '#0b0e14',
  },
  scannerCamera: {
    width: '100%',
    height: 320,
  },
  scanHint: {
    color: '#a5b4d6',
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 8,
  },
  wcLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
    gap: 12,
  },
  wcLoadingText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  connectedHeaderTitle: {
    color: '#f8fafc',
    textAlign: 'center',
    fontSize: 40 / 2,
    lineHeight: 48 / 2,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 14,
  },
  connectedStatusCard: {
    borderWidth: 1,
    borderColor: 'rgba(83, 211, 116, 0.45)',
    backgroundColor: 'rgba(50, 109, 66, 0.28)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  connectedStatusText: {
    color: '#8ce99a',
    fontSize: 18 / 1.45,
    fontWeight: '700',
  },
  connectedList: {
    maxHeight: 280,
    marginBottom: 12,
  },
  connectedListContent: {
    gap: 10,
  },
  connectedDappCard: {
    backgroundColor: '#1c2230',
    borderWidth: 1,
    borderColor: '#2f3d57',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectedDappTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  connectedDappName: {
    color: '#f8fafc',
    fontSize: 19 / 1.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  connectedDappUrl: {
    color: '#9ca3af',
    fontSize: 15 / 1.7,
  },
  connectedDisconnectBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#f4b65f',
    backgroundColor: '#1f2635',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectAnotherButton: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2f3b53',
    backgroundColor: '#1b2231',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectAnotherText: {
    color: '#9ca3af',
    fontSize: 16 / 1.4,
    fontWeight: '600',
  },
  inlineScannerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2f3b53',
    backgroundColor: '#111827',
  },
  inlineScannerCamera: {
    width: '100%',
    height: 220,
  },
  inlineScannerCancel: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b2231',
    borderTopWidth: 1,
    borderTopColor: '#2f3b53',
  },
  inlineScannerCancelText: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
  },
  sendModalCard: {
    width: '100%',
    backgroundColor: '#050506',
    borderWidth: 1,
    borderColor: '#171922',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  sendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendNetworkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendNetworkLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sendNetworkText: {
    color: '#f9fafb',
    fontSize: 18 / 1.3,
    fontWeight: '700',
  },
  sendChangeButton: {
    marginLeft: 10,
    backgroundColor: '#161a24',
    borderWidth: 1,
    borderColor: '#2a3141',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sendChangeText: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  actionModalCloseCompact: {
    marginLeft: 'auto',
  },
  sendSubtitle: {
    color: '#9ca3af',
    fontSize: 15 / 1.2,
    marginTop: 12,
    marginBottom: 18,
  },
  sendLabel: {
    color: '#d1d5db',
    fontSize: 14 / 1.2,
    fontWeight: '600',
    marginBottom: 8,
  },
  sendWarning: {
    color: '#f87171',
    fontSize: 15 / 1.2,
    lineHeight: 22 / 1.2,
    marginBottom: 14,
  },
  sendTokenValue: {
    color: '#e5e7eb',
    fontSize: 14 / 1.2,
    fontWeight: '700',
    marginBottom: 14,
  },
  sendInput: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2432',
    backgroundColor: '#06080b',
    color: '#f9fafb',
    fontSize: 18 / 1.4,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2432',
    backgroundColor: '#06080b',
    marginBottom: 18,
    paddingLeft: 12,
    paddingRight: 6,
  },
  recipientInput: {
    flex: 1,
    color: '#f9fafb',
    fontSize: 15 / 1.2,
  },
  recipientIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1f2430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendFooterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sendCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1f2432',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCancelText: {
    color: '#f3f4f6',
    fontSize: 16 / 1.25,
    fontWeight: '600',
  },
  sendPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#b8b8b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPrimaryText: {
    color: '#18181b',
    fontSize: 16 / 1.25,
    fontWeight: '700',
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '82%',
    backgroundColor: '#0b0c10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2532',
    overflow: 'hidden',
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2532',
  },
  profileModalTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  profileLoadingWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  profileLoadingText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 12,
  },
  profileContent: {
    padding: 14,
    gap: 10,
  },
  profileStatGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  profileStatCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2532',
    backgroundColor: '#121622',
    paddingVertical: 10,
    alignItems: 'center',
  },
  profileStatLabel: {
    color: '#9ca3af',
    fontSize: 11,
  },
  profileStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  profileSectionTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  profileInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2532',
    backgroundColor: '#06080b',
    color: '#fff',
    paddingHorizontal: 12,
    fontSize: 13,
  },
  profileSaveButton: {
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginTop: 2,
  },
  profileSaveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  activityItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2532',
    backgroundColor: '#111827',
    padding: 10,
  },
  txSectionTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#0b1220',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  txLeft: {
    flex: 1,
    paddingRight: 10,
  },
  txChain: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  txHash: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  txStatus: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  txStatusSuccess: {
    color: '#22c55e',
  },
  txStatusFailed: {
    color: '#ef4444',
  },
  txStatusPending: {
    color: '#f59e0b',
  },
  activityType: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  activityDesc: {
    color: '#d1d5db',
    fontSize: 12,
    lineHeight: 18,
  },
  profileRefreshButton: {
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
  },
  profileRefreshButtonText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
  },
  profileXpButton: {
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14532d',
  },
  profileXpButtonText: {
    color: '#dcfce7',
    fontSize: 12,
    fontWeight: '700',
  },
  profileDeleteButton: {
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f1d1d',
    marginBottom: 8,
  },
  profileDeleteButtonText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '700',
  },
});
