import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';

interface PromoItem {
  title: string;
  discount: string;
  color: string;
}

interface PromoBannersSectionProps {
  onPromoPress?: (index: number) => void;
}

const PROMOS: PromoItem[] = [
  { title: 'BURGER', discount: '50%', color: '#FDE047' },
  { title: 'BURGER', discount: '50%', color: '#FDE047' },
  { title: 'BURGER', discount: '50%', color: '#FDE047' },
];

function PromoBannersSection({ onPromoPress }: PromoBannersSectionProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {PROMOS.map((promo, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.promoCard, { backgroundColor: promo.color }]}
          activeOpacity={0.8}
          onPress={() => onPromoPress?.(i)}
        >
          <View style={styles.topSection}>
            <View style={styles.headerRow}>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <Text style={styles.timeText}>9:41</Text>
            </View>
            <View style={styles.promoBadgeCircle}>
              <Text style={styles.promoBadgeTextTop}>UP TO</Text>
              <Text style={styles.promoBadgeTextMiddle}>{promo.discount}</Text>
              <Text style={styles.promoBadgeTextBottom}>OFF</Text>
            </View>
            <View style={styles.burgerEmojiContainer}>
              <Text style={styles.burgerEmoji}>🍔</Text>
            </View>
          </View>
          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.orderNowBtn} activeOpacity={0.7}>
              <Text style={styles.orderNowText}>{t('home.orderNow')} ›</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: sw(20),
      gap: sw(12),
      paddingTop: sh(20),
      paddingBottom: sh(20),
    },
    promoCard: {
      width: sw(160),
      height: sw(180),
      borderRadius: sw(16),
      overflow: 'hidden',
    },
    topSection: {
      flex: 1,
      backgroundColor: '#A03030', // Dark red background simulating the image top
      padding: sw(12),
      borderBottomLeftRadius: sw(30),
      borderBottomRightRadius: sw(30),
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    promoTitle: {
      fontSize: fs(22),
      color: '#FFFFFF',
      fontFamily: colors.fontBold,
      fontStyle: 'italic',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    timeText: {
      fontSize: fs(12),
      color: '#FFFFFF',
      fontFamily: colors.fontMedium,
    },
    promoBadgeCircle: {
      position: 'absolute',
      left: sw(12),
      top: sh(55),
      width: sw(45),
      height: sw(45),
      borderRadius: sw(22.5),
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.1)',
      zIndex: 2,
      transform: [{ rotate: '-15deg' }],
    },
    promoBadgeTextTop: {
      fontSize: fs(7),
      color: '#FFFFFF',
      fontFamily: colors.fontMedium,
    },
    promoBadgeTextMiddle: {
      fontSize: fs(14),
      color: '#FFFFFF',
      fontFamily: colors.fontBold,
      marginTop: -sh(2),
    },
    promoBadgeTextBottom: {
      fontSize: fs(7),
      color: '#FFFFFF',
      fontFamily: colors.fontMedium,
      marginTop: -sh(4),
    },
    burgerEmojiContainer: {
      position: 'absolute',
      right: -sw(10),
      bottom: -sh(10),
      zIndex: 1,
    },
    burgerEmoji: {
      fontSize: fs(80),
    },
    bottomSection: {
      height: sh(40),
      justifyContent: 'center',
      paddingHorizontal: sw(12),
    },
    orderNowBtn: {
      alignSelf: 'flex-start',
    },
    orderNowText: {
      fontSize: fs(14),
      color: '#000000',
      fontFamily: colors.fontSemiBold,
    },
  });

export default PromoBannersSection;
