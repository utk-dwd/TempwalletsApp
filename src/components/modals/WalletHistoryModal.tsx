import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WalletHistoryEntry } from '../../services/walletApi';

type Props = {
  visible: boolean;
  walletHistory: WalletHistoryEntry[];
  walletBusy: boolean;
  onClose: () => void;
  onSwitchWallet: (walletId: string) => void;
  onDeleteWallet: (walletId: string) => void;
  styles: any;
};

export function WalletHistoryModal({
  visible,
  walletHistory,
  walletBusy,
  onClose,
  onSwitchWallet,
  onDeleteWallet,
  styles,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.walletHistoryModalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Wallet History</Text>
            <Pressable style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={16} color="#c7c7c7" />
            </Pressable>
          </View>
          {walletHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No wallet history yet</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {walletHistory.map((wallet) => (
                <View key={wallet.id} style={styles.walletHistoryRow}>
                  <Pressable
                    style={styles.walletHistorySelectBtn}
                    onPress={() => onSwitchWallet(wallet.id)}
                    disabled={walletBusy}
                  >
                    <Text style={styles.walletHistoryTitle}>
                      {wallet.label || `Wallet ${wallet.id.slice(0, 6)}`}
                    </Text>
                    <Text style={styles.walletHistoryMeta}>
                      {wallet.isActive ? 'Active' : 'Tap to switch'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.walletHistoryDeleteBtn}
                    onPress={() => onDeleteWallet(wallet.id)}
                    disabled={walletBusy}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ff8b8b" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
