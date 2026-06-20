import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';

interface PaymentFailedViewProps {
  paymentError: string;
  createdOrderUniqueId: string | null;
  createdOrderId: number | null;
  onRetryPayment: () => void;
  onBackToCheckout: () => void;
}

export const PaymentFailedView: React.FC<PaymentFailedViewProps> = ({
  paymentError,
  createdOrderUniqueId,
  createdOrderId,
  onRetryPayment,
  onBackToCheckout,
}) => {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: sw(32) }]}>
      {/* Error Icon */}
      <View style={[styles.errorIconContainer, { backgroundColor: '#FF3B3015' }]}>
        <Text style={[styles.errorCheckmark, { color: '#FF3B30' }]}>✗</Text>
      </View>

      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Payment Failed
      </Text>

      <Text style={[styles.errorDescription, { color: colors.textMuted, textAlign: 'center', marginTop: sh(8) }]}>
        {paymentError}
      </Text>

      {createdOrderUniqueId ? (
        <View style={[styles.orderIdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.orderIdLabel, { color: colors.textMuted }]}>Order ID</Text>
          <Text style={[styles.orderIdValue, { color: colors.text }]}>#{createdOrderUniqueId}</Text>
        </View>
      ) : createdOrderId ? (
        <View style={[styles.orderIdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.orderIdLabel, { color: colors.textMuted }]}>Order ID</Text>
          <Text style={[styles.orderIdValue, { color: colors.text }]}>#{createdOrderId}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.failedButton, { backgroundColor: colors.primary }]}
        onPress={onRetryPayment}
        activeOpacity={0.8}
      >
        <Text style={styles.failedButtonText}>Retry Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.failedButtonSecondary, { borderColor: colors.primary }]}
        onPress={onBackToCheckout}
        activeOpacity={0.8}
      >
        <Text style={[styles.failedButtonSecondaryText, { color: colors.primary }]}>
          Back to Checkout
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
  errorIconContainer: {
    width: sw(96),
    height: sw(96),
    borderRadius: sw(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(28),
  },
  errorCheckmark: {
    fontSize: fs(44),
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: fs(24),
    fontWeight: '700',
    marginBottom: sh(12),
    textAlign: 'center',
  },
  errorDescription: {
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
  failedButton: {
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
  failedButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
  },
  failedButtonSecondary: {
    width: '100%',
    height: sh(52),
    borderRadius: sw(26),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(24),
  },
  failedButtonSecondaryText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
});
export default PaymentFailedView;
