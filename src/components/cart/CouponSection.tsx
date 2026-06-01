import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { fs, sw, sh } from '../../utils/responsive';
import { Images } from '../../assets/images';

interface CouponSectionProps {
  colors: any;
  onApply: (code: string) => void;
  applying?: boolean;
  onViewAll: () => void;
  preFilledCode?: string;
}

export default function CouponSection({
  colors,
  onApply,
  applying,
  onViewAll,
  preFilledCode,
}: CouponSectionProps) {
  const [promoInput, setPromoInput] = useState(preFilledCode || '');

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image
            source={Images.coupon}
            style={[styles.icon, { tintColor: colors.text }]}
          />
          <Text
            style={[
              styles.title,
              { color: colors.text, fontFamily: colors.fontSemiBold },
            ]}
          >
            Apply Code
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllRow}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.viewAllText,
              { color: colors.darkBrown, fontFamily: colors.fontRegular },
            ]}
          >
            View All
          </Text>
          <View
            style={[styles.viewAllCircle, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.viewAllArrow}>{'>'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Input row */}
      <View style={[styles.inputRow, { borderColor: colors.borderSubtle }]}>
        <Text
          style={[
            styles.floatingLabel,
            {
              color: colors.textMuted,
              backgroundColor: colors.white,
              fontFamily: colors.fontRegular,
            },
          ]}
        >
          Promo Code
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, fontFamily: colors.fontRegular },
          ]}
          value={promoInput}
          onChangeText={setPromoInput}
          placeholder=""
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          onPress={() => promoInput.trim() && onApply(promoInput.trim())}
          disabled={applying || !promoInput.trim()}
          style={styles.applyBtn}
        >
          {applying ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.applyText,
                { color: colors.primary, fontFamily: colors.fontSemiBold },
              ]}
            >
              Apply
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sh(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: sw(20),
    height: sw(20),
    resizeMode: 'contain',
    marginRight: sw(8),
  },
  title: {
    fontSize: fs(16),
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
  },
  viewAllText: {
    fontSize: fs(14),
  },
  viewAllCircle: {
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllArrow: {
    color: '#FFFFFF',
    fontSize: fs(12),
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: sw(8),
    paddingHorizontal: sw(12),
    minHeight: sh(52),
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    top: -sh(9),
    left: sw(10),
    fontSize: fs(12),
    paddingHorizontal: sw(3),
  },
  input: {
    flex: 1,
    fontSize: fs(14),
    paddingVertical: sh(8),
  },
  applyBtn: {
    paddingHorizontal: sw(8),
    paddingVertical: sh(4),
  },
  applyText: {
    fontSize: fs(15),
  },
});
