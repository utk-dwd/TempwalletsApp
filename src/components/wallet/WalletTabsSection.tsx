import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TabKey } from '../../types';
import { WalletTx } from '../../services/walletApi';
import { shortAddress } from '../../utils/auth';

type Props = {
  styles: any;
  activeTab: TabKey;
  walletBusy: boolean;
  walletAddresses: Record<string, unknown> | null;
  chainBalancesCount: number;
  paymasterBalancesCount: number;
  hideBalances: boolean;
  selectedNativeHuman: string;
  selectedNativeSymbol: string;
  selectedBalanceChangePct: string;
  selectedBalanceUsdValue: string;
  selectedNetworkLogo: string;
  selectedNetworkSymbol: string;
  selectedNetworkName: string;
  chainTokenBalances: any[];
  recentAnyTransactions: WalletTx[];
  onChangeTab: (tab: TabKey) => void;
  onRefresh: () => void;
  onToggleHideBalances: () => void;
  onOpenLightningInfo: () => void;
  formatUnits: (value: string, decimals: number, maxFractionDigits?: number) => string;
};

export function WalletTabsSection({
  styles,
  activeTab,
  walletBusy,
  walletAddresses,
  chainBalancesCount,
  paymasterBalancesCount,
  hideBalances,
  selectedNativeHuman,
  selectedNativeSymbol,
  selectedBalanceChangePct,
  selectedBalanceUsdValue,
  selectedNetworkLogo,
  selectedNetworkSymbol,
  selectedNetworkName,
  chainTokenBalances,
  recentAnyTransactions,
  onChangeTab,
  onRefresh,
  onToggleHideBalances,
  onOpenLightningInfo,
  formatUnits,
}: Props) {
  return (
    <View style={styles.balanceCard}>
      <View style={styles.tabHeader}>
        <View style={styles.topDivider} />
        {(['balance', 'transactions', 'lightning'] as TabKey[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onChangeTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'balance' ? 'Balance' : tab === 'transactions' ? 'Transactions' : 'Lightning Nodes'}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.refreshButton} onPress={onRefresh} disabled={walletBusy}>
          {walletBusy ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="refresh" size={16} color="#6b7280" />
          )}
        </Pressable>
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'balance' && (
          <View style={styles.balancePanel}>
            <Text style={styles.balancePanelHeading}>TOTAL BALANCE</Text>
            <Text style={styles.balanceSyncMeta}>
              {walletAddresses
                ? `Addresses synced • ${chainBalancesCount} chains • ${paymasterBalancesCount} paymasters`
                : 'Wallet not synced yet'}
            </Text>
            <View style={styles.balancePanelTopRow}>
              <Text style={styles.balancePanelAmount}>
                {hideBalances ? '******' : `${selectedNativeHuman} ${selectedNativeSymbol}`}
              </Text>
              <View style={styles.balanceChangePill}>
                <Ionicons name="trending-up" size={12} color="#16a34a" />
                <Text style={styles.balanceChangeText}>{selectedBalanceChangePct}</Text>
              </View>
              <Pressable style={styles.balanceHideBtn} onPress={onToggleHideBalances}>
                <Text style={styles.balanceHideBtnText}>{hideBalances ? 'Show' : 'Hide'}</Text>
                <Ionicons name={hideBalances ? 'eye-outline' : 'eye-off-outline'} size={15} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.balanceTokenRow}>
              <View style={styles.balanceTokenLeft}>
                <Image source={{ uri: selectedNetworkLogo }} style={styles.balanceTokenLogo} />
                <View>
                  <Text style={styles.balanceTokenSymbol}>{selectedNetworkSymbol}</Text>
                  <Text style={styles.balanceTokenChain}>{selectedNetworkName.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.balanceTokenRight}>
                <Text style={styles.balanceTokenUsd}>{hideBalances ? '****' : selectedBalanceUsdValue}</Text>
                <Text style={styles.balanceTokenNative}>
                  {hideBalances ? '****' : `${selectedNativeHuman} ${selectedNativeSymbol}`}
                </Text>
              </View>
            </View>

            {chainTokenBalances.length === 0 ? (
              <View style={styles.emptyState}>
                <Image source={require('../../../assets/empty-mailbox.gif')} style={styles.emptyImage} />
                <Text style={styles.emptyText}>No Tokens Available</Text>
              </View>
            ) : (
              <View style={styles.profileSection}>
                <Text style={styles.txSectionTitle}>Chain Token Balances</Text>
                {chainTokenBalances.slice(0, 5).map((token) => (
                  <View key={`${token.chain}-${token.symbol}-${token.address || 'native'}`} style={styles.statRow}>
                    <Text style={styles.statLabel}>{token.symbol}</Text>
                    <Text style={styles.statValue}>
                      {typeof (token as any).balanceHuman === 'string'
                        ? (token as any).balanceHuman
                        : formatUnits(String((token as any).balance ?? '0'), Number((token as any).decimals ?? 18), 6)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'transactions' && (
          <>
            {recentAnyTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Image source={require('../../../assets/empty-mailbox.gif')} style={styles.emptyImage} />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.profileSection}>
                <Text style={styles.txSectionTitle}>
                  Recent Transactions ({Math.min(recentAnyTransactions.length, 8)})
                </Text>
                {recentAnyTransactions.slice(0, 8).map((tx) => (
                  <View key={`${tx.chain}-${tx.txHash}`} style={styles.txItem}>
                    <View style={styles.txLeft}>
                      <Text style={styles.txChain}>{String(tx.chain || '').toUpperCase()}</Text>
                      <Text style={styles.txHash} numberOfLines={1}>
                        {shortAddress(tx.txHash)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txStatus,
                        tx.status === 'success'
                          ? styles.txStatusSuccess
                          : tx.status === 'failed'
                            ? styles.txStatusFailed
                            : styles.txStatusPending,
                      ]}
                    >
                      {tx.status}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'lightning' && (
          <View style={styles.emptyState}>
            <Image source={require('../../../assets/empty-mailbox.gif')} style={styles.emptyImage} />
            <Text style={styles.emptyText}>No Lightning Nodes Available</Text>
            <Pressable style={styles.primaryButton} onPress={onOpenLightningInfo}>
              <MaterialCommunityIcons name="flash" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Create / Join Lightning Node</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
