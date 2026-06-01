import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';
import { Offer } from '../../services/api/offer';
import { BASE_URL } from '../../constants/api';

interface PromoBannersSectionProps {
  offers: Offer[];
  onPromoPress?: (offer: Offer, index: number) => void;
}

function PromoBannersSection({
  offers,
  onPromoPress,
}: PromoBannersSectionProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {offers.map((offer, i) => {
        return (
          <TouchableOpacity
            key={offer.id}
            style={styles.promoCard}
            activeOpacity={0.8}
            onPress={() => onPromoPress?.(offer, i)}
          >
            {/* Offer Banner Image */}
            {offer.image_en && (
              <Image
                source={{ uri: `${BASE_URL}${offer.image_en}` }}
                style={styles.offerImage}
                resizeMode="cover"
              />
            )}

            {/* Order Now Button */}
            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.orderNowBtn} activeOpacity={0.7}>
                <Text style={styles.orderNowText}>{t('home.orderNow')} ›</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
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
      height: sw(200),
      borderRadius: sw(16),
      overflow: 'hidden',
      backgroundColor: '#FDE047',
    },
    offerImage: {
      width: '100%',
      height: sw(160),
      backgroundColor: '#f5f5f5',
    },
    bottomSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: sh(50),
      justifyContent: 'center',
      paddingHorizontal: sw(12),
      backgroundColor: '#FDE047',
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
