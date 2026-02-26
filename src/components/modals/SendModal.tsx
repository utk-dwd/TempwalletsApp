import React from 'react';
import { Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedNetworkLogo: string;
  selectedNetworkName: string;
  selectedNativeSymbol: string;
  sendAmount: string;
  onChangeSendAmount: (value: string) => void;
  recipientAddress: string;
  onChangeRecipientAddress: (value: string) => void;
  onPasteRecipient: () => Promise<void>;
  onOpenNetworkList: () => void;
  onSubmit: () => void;
  styles: any;
};

export function SendModal({
  visible,
  onClose,
  selectedNetworkLogo,
  selectedNetworkName,
  selectedNativeSymbol,
  sendAmount,
  onChangeSendAmount,
  recipientAddress,
  onChangeRecipientAddress,
  onPasteRecipient,
  onOpenNetworkList,
  onSubmit,
  styles,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.actionModalOverlay}>
        <View style={styles.sendModalCard}>
          <View style={styles.sendHeaderRow}>
            <View style={styles.sendNetworkBadge}>
              <Image source={{ uri: selectedNetworkLogo }} style={styles.sendNetworkLogo} />
              <Text style={styles.sendNetworkText}>{selectedNetworkName}</Text>
            </View>
            <Pressable style={styles.sendChangeButton} onPress={onOpenNetworkList}>
              <Text style={styles.sendChangeText}>CHANGE</Text>
              <Ionicons name="chevron-down" size={12} color="#cbd5e1" />
            </Pressable>
            <Pressable style={styles.actionModalCloseCompact} onPress={onClose}>
              <Ionicons name="close" size={24} color="#e5e7eb" />
            </Pressable>
          </View>

          <Text style={styles.sendSubtitle}>Transfer to recipient&apos;s address</Text>
          <Text style={styles.sendLabel}>Token</Text>
          <Text style={styles.sendTokenValue}>{selectedNativeSymbol} (native)</Text>

          <Text style={styles.sendLabel}>Amount</Text>
          <TextInput
            value={sendAmount}
            onChangeText={onChangeSendAmount}
            placeholder="0.00"
            placeholderTextColor="#4b5563"
            style={styles.sendInput}
            keyboardType="decimal-pad"
          />

          <Text style={styles.sendLabel}>Recipient</Text>
          <View style={styles.recipientRow}>
            <TextInput
              value={recipientAddress}
              onChangeText={onChangeRecipientAddress}
              placeholder="Enter address"
              placeholderTextColor="#6b7280"
              style={styles.recipientInput}
              autoCapitalize="none"
            />
            <Pressable style={styles.recipientIconBtn} onPress={onPasteRecipient}>
              <Ionicons name="clipboard-outline" size={18} color="#d1d5db" />
            </Pressable>
          </View>

          <View style={styles.sendFooterActions}>
            <Pressable style={styles.sendCancelBtn} onPress={onClose}>
              <Text style={styles.sendCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.sendPrimaryBtn} onPress={onSubmit}>
              <Text style={styles.sendPrimaryText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
