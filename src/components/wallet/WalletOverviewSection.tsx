import React from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  styles: any;
  greeting: string;
  signedText: string;
  walletAddressShort: string;
  copied: boolean;
  actions: Array<{ id: string; label: string; icon: any }>;
  visibleNetworks: Array<{
    id: string;
    label: string;
    badge: string;
    subtitle: string;
    color: string;
    logo: string;
    dot?: boolean;
  }>;
  selectedNetworkId: string;
  spinInterpolate: any;
  isCreating: boolean;
  walletBusy: boolean;
  authIconName: any;
  onAuthPress: () => void;
  onOpenProfile: () => void;
  onOpenAbout: () => void;
  onActionPress: (id: string) => void;
  onOpenNetworkList: () => void;
  onSelectNetwork: (id: string) => void;
  onRefresh?: () => void;
  hexToRgba: (hex: string, alpha: number) => string;
};

export function WalletOverviewSection({
  styles,
  greeting,
  signedText,
  walletAddressShort,
  copied,
  actions,
  visibleNetworks,
  selectedNetworkId,
  spinInterpolate,
  isCreating,
  walletBusy,
  authIconName,
  onAuthPress,
  onOpenProfile,
  onOpenAbout,
  onActionPress,
  onOpenNetworkList,
  onSelectNetwork,
  hexToRgba,
}: Props) {
  return (
    <>
      <View style={styles.upperBar}>
        <View style={styles.upperBarSide}>
          <Pressable style={styles.iconButton} onPress={onAuthPress}>
            <Ionicons name={authIconName} size={18} color="#fff" />
          </Pressable>
        </View>
        <Pressable style={styles.upperBarCenter} onPress={onOpenProfile}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subGreeting}>{signedText}</Text>
        </Pressable>
        <View style={styles.upperBarSideRight}>
          <Pressable style={styles.iconButton} onPress={onOpenAbout}>
            <Ionicons name="home-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletCardHeader}>
          <Text style={styles.walletLabel}>Ethereum Wallet</Text>
          <View style={styles.walletBadge}>
            <Text style={styles.walletBadgeText}>GasLess / EIP-7702</Text>
          </View>
          <Ionicons name="information-circle-outline" size={12} color="#9ca3af" />
        </View>
        <Text style={styles.walletAddress}>{walletAddressShort}</Text>
      </View>

      <View style={styles.actionsCard}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
            onPress={() => onActionPress(action.id)}
          >
            <View
              style={[
                styles.actionIconContainer,
                action.id === 'connect' && styles.actionIconContainerActive,
                action.id === 'copy' && copied && styles.actionIconCopiedActive,
              ]}
            >
              {action.id === 'connect' ? (
                <Ionicons name="qr-code-outline" size={18} color="#fff" />
              ) : action.id === 'send' ? (
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
              ) : action.id === 'copy' ? (
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#fff" />
              ) : action.id === 'history' ? (
                <Ionicons name="time-outline" size={18} color="#fff" />
              ) : action.id === 'create' ? (
                <Animated.View style={isCreating ? { transform: [{ rotate: spinInterpolate }] } : undefined}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                </Animated.View>
              ) : (
                <MaterialCommunityIcons name={action.icon} size={18} color="#fff" />
              )}
            </View>
            <Text
              style={[
                styles.actionLabel,
                action.id === 'history' && styles.actionLabelMuted,
                action.id === 'copy' && copied && styles.actionLabelCopied,
              ]}
            >
              {action.id === 'copy' && copied ? 'Copied!' : action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.networksCard}>
        <View style={styles.networksHeader}>
          <Text style={styles.sectionTitle}>More Networks</Text>
          <Pressable onPress={onOpenNetworkList}>
            <Text style={styles.seeList}>See List</Text>
          </Pressable>
        </View>
        <View style={styles.networksGrid}>
          {visibleNetworks.map((network) => (
            <Pressable
              key={network.id}
              style={({ pressed }) => [styles.networkItem, pressed && { opacity: 0.85 }]}
              onPress={() => onSelectNetwork(network.id)}
            >
              <View style={styles.networkIconWrap}>
                <View
                  style={[
                    styles.networkIcon,
                    network.color && { backgroundColor: hexToRgba(network.color, 0.2) },
                    selectedNetworkId === network.id && styles.networkIconActive,
                  ]}
                >
                  <Image source={{ uri: network.logo }} style={styles.networkLogo} />
                </View>
                {network.dot && <View style={styles.networkDot} />}
              </View>
              <Text
                style={[
                  styles.networkLabel,
                  selectedNetworkId === network.id && styles.networkLabelActive,
                ]}
              >
                {network.label}
              </Text>
              {network.badge ? (
                <View style={styles.networkBadge}>
                  <Text style={styles.networkBadgeText}>{network.badge}</Text>
                </View>
              ) : null}
              {network.subtitle ? (
                <Text style={styles.networkSubtitle}>{network.subtitle}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}
