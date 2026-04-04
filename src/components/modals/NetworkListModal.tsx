import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WalletNetworkItem } from '../../constants/walletUi';

type NetworkGroup = {
  title: string;
  items: WalletNetworkItem[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  networkList: NetworkGroup[];
  selectedNetworkId: string;
  onSelectNetwork: (id: string) => void;
  hexToRgba: (hex: string, alpha: number) => string;
  styles: any;
};

export function NetworkListModal({
  visible,
  onClose,
  networkList,
  selectedNetworkId,
  onSelectNetwork,
  hexToRgba,
  styles,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Networks</Text>
            <Pressable style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={16} color="#c7c7c7" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {networkList.map((group) => (
              <View key={group.title} style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Text style={styles.modalSectionTitle}>{group.title}</Text>
                  <Ionicons name="help-circle-outline" size={12} color="#6b7280" />
                </View>
                <View style={styles.modalGrid}>
                  {group.items.map((item) => (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.modalItem,
                        selectedNetworkId === item.id && styles.modalItemActive,
                      ]}
                      onPress={() => onSelectNetwork(item.id)}
                    >
                      <View style={styles.modalItemIconWrap}>
                        <View
                          style={[
                            styles.modalItemIcon,
                            item.color && { backgroundColor: hexToRgba(item.color, 0.2) },
                          ]}
                        >
                          <Image source={{ uri: item.logo }} style={styles.modalItemLogo} />
                        </View>
                        {item.dot && <View style={styles.modalDot} />}
                      </View>
                      <Text style={styles.modalSymbol}>{item.symbol}</Text>
                      <Text style={styles.modalName}>{item.name}</Text>
                      <View
                        style={[
                          styles.modalBadge,
                          item.badge === 'EOA' ? styles.modalBadgeEoa : styles.modalBadge7702,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalBadgeText,
                            item.badge === 'EOA' ? styles.modalBadgeTextEoa : styles.modalBadgeText7702,
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>10 networks</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
