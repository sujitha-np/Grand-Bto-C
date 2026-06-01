import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ImageBackground,
  Image,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { usePromocodes } from '../hooks/queries';
import { fs, sw, sh } from '../utils/responsive';
import { Promocode } from '../services/api/promocode';
import { Images } from '../assets/images';
import Header from '../components/common/Header';

interface PromoCodesScreenProps {
  onBack: () => void;
  onSelectPromo: (code: string) => void;
}

export default function PromoCodesScreen({
  onBack,
  onSelectPromo,
}: PromoCodesScreenProps) {
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: promocodeData, isLoading, error } = usePromocodes();
  const promocodes: Promocode[] = promocodeData?.data || [];

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPromocode = ({ item }: { item: Promocode }) => {
    const expired = isExpired(item.end_date);
    const formattedValue = Number.isInteger(parseFloat(item.offer_value))
      ? parseInt(item.offer_value).toString()
      : parseFloat(item.offer_value).toString();

    return (
      <TouchableOpacity
        style={[styles.couponCard, expired && styles.couponCardExpired]}
        activeOpacity={expired ? 1 : 0.75}
        onPress={() => {
          if (!expired) {
            onSelectPromo(item.promo_code);
            onBack();
          }
        }}
      >
        <ImageBackground
          source={Images.loyalityBg}
          style={styles.couponBadge}
          imageStyle={styles.couponBadgeImage}
          resizeMode="cover"
        >
          <Text style={styles.couponValue}>
            {formattedValue}
            <Text style={styles.couponUnit}>
              {item.offer_type === 1 ? '%off' : 'QAR'}
            </Text>
          </Text>
        </ImageBackground>

        <View style={styles.couponContent}>
          <Text style={styles.couponTitle}>{item.name_en}</Text>
          <Text style={styles.promoCode}>{item.promo_code}</Text>

          {item.min_product_price ? (
            <Text style={styles.minPrice}>
              Min order: QAR {item.min_product_price}
            </Text>
          ) : null}

          <View style={styles.expiryRow}>
            <Image
              source={Images.calendar}
              style={[styles.expiryIcon, { tintColor: colors.textSecondary }]}
              resizeMode="contain"
            />
            <Text style={[styles.expiryText, expired && styles.expiredText]}>
              {expired ? 'Expired' : `Valid till ${formatDate(item.end_date)}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Promo Codes"
          onBack={onBack}
          containerStyle={styles.headerContainer}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Promo Codes"
          onBack={onBack}
          containerStyle={styles.headerContainer}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load promo codes</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Promo Codes"
        onBack={onBack}
        containerStyle={styles.headerContainer}
      />
      <FlatList
        data={promocodes}
        renderItem={renderPromocode}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎟️</Text>
            <Text style={styles.emptyTitle}>No promo codes available</Text>
            <Text style={styles.emptyText}>
              Check back later for exclusive offers
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sw(20),
    },
    headerContainer: { marginTop: sh(30) },
    listContent: { padding: sw(20), paddingBottom: sh(20) },
    couponCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: sw(16),
      marginBottom: sh(20),
      padding: sw(16),
    },
    couponCardExpired: { opacity: 0.5 },
    couponBadge: {
      width: sw(110),
      height: sw(110),
      borderRadius: sw(16),
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: sw(14),
    },
    couponBadgeImage: { borderRadius: sw(16) },
    couponValue: {
      fontSize: fs(36),
      fontFamily: colors.fontBold,
      color: '#3B2B20',
      textAlign: 'center',
    },
    couponUnit: {
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
      color: '#3B2B20',
    },
    couponContent: { flex: 1, gap: sh(4) },
    couponTitle: {
      fontSize: fs(15),
      color: colors.text,
      fontFamily: colors.fontBold,
    },
    promoCode: {
      fontSize: fs(13),
      color: colors.primary,
      fontFamily: colors.fontSemiBold,
      letterSpacing: 1,
    },
    minPrice: {
      fontSize: fs(12),
      color: colors.textMuted,
      fontFamily: colors.fontRegular,
    },
    expiryRow: { flexDirection: 'row', alignItems: 'center' },
    expiryIcon: { width: sw(13), height: sw(13), marginRight: sw(5) },
    expiryText: {
      fontSize: fs(12),
      color: colors.textSecondary,
      fontFamily: colors.fontRegular,
    },
    expiredText: { color: colors.error || '#D32F2F' },
    errorText: { fontSize: fs(14), color: colors.error || '#D32F2F' },
    emptyContainer: { alignItems: 'center', paddingTop: sh(60) },
    emptyIcon: { fontSize: fs(48), marginBottom: sh(12) },
    emptyTitle: {
      fontSize: fs(16),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
      marginBottom: sh(8),
    },
    emptyText: {
      fontSize: fs(14),
      color: colors.textMuted,
      fontFamily: colors.fontRegular,
      textAlign: 'center',
    },
  });
