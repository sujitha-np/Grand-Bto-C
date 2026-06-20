import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';

interface OrderSuccessViewProps {
  successOrderId: string;
  preorderDate: string;
  onGoToOrders?: (preorderDate?: string) => void;
  onOrderPlaced?: () => void;
  onBack: () => void;
  onGoToHome?: () => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({
  successOrderId,
  preorderDate,
  onGoToOrders,
  onOrderPlaced,
  onBack,
  onGoToHome,
}) => {
  const { t } = useTranslation();
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: sw(32) }]}>
      {/* Success Icon */}
      <View style={[styles.successIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Text style={[styles.successCheckmark, { color: colors.primary }]}>✓</Text>
      </View>

      <Text style={[styles.successTitle, { color: colors.text }]}>
        Order Placed Successfully!
      </Text>

      <Text style={[styles.successDescription, { color: colors.textMuted }]}>
        Your order has been received and is being processed.
      </Text>

      {successOrderId && successOrderId !== 'success' && !successOrderId.startsWith('TEMP_') && (
        <View style={[styles.orderIdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.orderIdLabel, { color: colors.textMuted }]}>Order ID</Text>
          <Text style={[styles.orderIdValue, { color: colors.text }]}>#{successOrderId}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.successButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (onGoToOrders) {
            onGoToOrders(preorderDate);
          } else if (onOrderPlaced) {
            onOrderPlaced();
          } else {
            onBack();
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.successButtonText}>View Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.successButtonSecondary, { borderColor: colors.primary }]}
        onPress={() => {
          if (onGoToHome) {
            onGoToHome();
          } else {
            onBack();
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.successButtonSecondaryText, { color: colors.primary }]}>
          Go to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  successIconContainer: {
    width: sw(96),
    height: sw(96),
    borderRadius: sw(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(28),
  },
  successCheckmark: {
    fontSize: fs(44),
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: fs(24),
    fontWeight: '700',
    marginBottom: sh(12),
    textAlign: 'center',
  },
  successDescription: {
    fontSize: fs(15),
    textAlign: 'center',
    lineHeight: fs(22),
    marginBottom: sh(32),
  },
  orderIdContainer: {
    width: '100%',
    paddingVertical: sh(16),
    paddingHorizontal: sw(24),
    borderRadius: sw(12),
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sh(40),
  },
  orderIdLabel: {
    fontSize: fs(14),
    fontWeight: '500',
  },
  orderIdValue: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  successButton: {
    width: '100%',
    height: sh(52),
    borderRadius: sw(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
  },
  successButtonSecondary: {
    width: '100%',
    height: sh(52),
    borderRadius: sw(26),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(24),
  },
  successButtonSecondaryText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
});
export default OrderSuccessView;
