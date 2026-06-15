import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { fs, sw, sh } from '../../utils/responsive';
import { Images } from '../../assets/images';

interface OrderSummaryProps {
  colors: any;
  subtotal: number;
  delivery: number;
  total: number;
}

export default function OrderSummary({
  colors,
  subtotal,
  delivery,
  total,
}: OrderSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image
          source={Images.orderSummary}
          style={[styles.icon, { tintColor: colors.text }]}
        />
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: colors.fontSemiBold },
          ]}
        >
          Order summary
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: colors.textMuted, fontFamily: colors.fontRegular },
          ]}
        >
          Subtotal
        </Text>
        <Text
          style={[
            styles.value,
            { color: colors.text, fontFamily: colors.fontRegular },
          ]}
        >
          {subtotal.toFixed(2)} QAR
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: colors.textMuted, fontFamily: colors.fontRegular },
          ]}
        >
          Delivery
        </Text>
        <Text
          style={[
            styles.value,
            { color: colors.text, fontFamily: colors.fontRegular },
          ]}
        >
          {delivery.toFixed(2)} QAR
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: sh(32),
    padding: sw(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sh(20),
  },
  icon: {
    width: sw(20),
    height: sw(20),
    resizeMode: 'contain',
    marginRight: sw(8),
  },
  title: {
    fontSize: fs(18),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sh(12),
  },
  label: {
    fontSize: fs(14),
  },
  value: {
    fontSize: fs(14),
  },
});
