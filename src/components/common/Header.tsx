import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  containerStyle?: ViewStyle;
}

function Header({
  title,
  onBack,
  showBackButton = true,
  containerStyle,
}: HeaderProps) {
  const colors = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.background }, containerStyle]}>
      {showBackButton && onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: colors.background }]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.backIcon,
              { color: colors.text, fontFamily: colors.fontBold },
            ]}
          >
            {'<'}
          </Text>
        </TouchableOpacity>
      ) : null}
      <Text
        style={[
          styles.headerTitle,
          { color: colors.text, fontFamily: colors.fontSemiBold },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(20),
    paddingVertical: sh(12),
    gap: sw(14),
  },
  backBtn: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backIcon: {
    fontSize: fs(16),
    fontFamily: 'Manrope-Bold',
  },
  headerTitle: {
    fontSize: fs(18),
    fontFamily: 'Manrope-SemiBold',
  },
});

export default Header;
