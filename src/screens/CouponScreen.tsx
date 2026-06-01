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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { usePromocodes } from '../hooks/queries';
import { fs, sw, sh } from '../utils/responsive';
import { Promocode } from '../services/api/promocode';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { Images } from '../assets/images';
import Header from '../components/common/Header';

interface CouponScreenProps {
  onBack: () => void;
}

function CouponScreen({ onBack }: CouponScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: promocodeData, isLoading, error } = usePromocodes();

  const promocodes: Promocode[] = promocodeData?.data || [];

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Toast.show({
      type: 'success',
      text1: 'Copied!',
      text2: `Promo code ${code} copied to clipboard`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const isExpiringSoon = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 && diffDays >= 0;
  };

  const renderPromocode = ({ item }: { item: Promocode }) => {
    const expired = isExpired(item.end_date);
    const expiringSoon = isExpiringSoon(item.end_date);

    // Format the offer value to remove unnecessary decimals
    const formattedValue = Number.isInteger(parseFloat(item.offer_value))
      ? parseInt(item.offer_value).toString()
      : parseFloat(item.offer_value).toString();

    return (
      <View style={[styles.couponCard, expired && styles.couponCardExpired]}>
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
          <Text style={styles.couponCode}>Code: #########</Text>
          <View style={styles.expiryRow}>
            <Image
              source={Images.calendar}
              style={styles.expiryIcon}
              resizeMode="contain"
            />
            <Text style={[styles.expiryText, expired && styles.expiredText]}>
              {expired
                ? 'Expired'
                : expiringSoon
                ? 'Expires: Today'
                : `Expires: ${formatDate(item.end_date)}`}
            </Text>
          </View>

          {!expired && (
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => handleCopyCode(item.promo_code)}
              activeOpacity={0.7}
            >
              <Image
                source={Images.copy}
                style={styles.copyIcon}
                resizeMode="contain"
              />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Coupon"
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
          title="Coupon"
          onBack={onBack}
          containerStyle={styles.headerContainer}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load coupons</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Coupon"
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
            <Text style={styles.emptyTitle}>No coupons available</Text>
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sw(20),
    },
    headerContainer: {
      marginTop: sh(30),
    },
    listContent: {
      padding: sw(20),
      paddingBottom: sh(20),
    },
    couponCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: sw(16),
      marginBottom: sh(20),
      padding: sw(16),
      //   elevation: 3,
      //   shadowColor: '#000',
      //   shadowOffset: { width: 0, height: 2 },
      //   shadowOpacity: 0.15,
      //   shadowRadius: 6,
      //   borderWidth: 1,
      //   borderColor: colors.borderSubtle || '#E5E5E5',
    },
    couponCardExpired: {
      opacity: 0.5,
    },
    couponBadge: {
      width: sw(120),
      height: sw(120),
      borderRadius: sw(20),
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: sw(16),
    },
    couponBadgeImage: {
      borderRadius: sw(20),
    },
    couponValue: {
      fontSize: fs(40),
      fontFamily: colors.fontBold,
      color: '#3B2B20',
      textAlign: 'center',
    },
    couponUnit: {
      fontSize: fs(18),
      fontFamily: colors.fontSemiBold,
      color: '#3B2B20',
    },
    couponContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    couponTitle: {
      fontSize: fs(16),
      color: colors.text,
      fontFamily: colors.fontBold,
      marginBottom: sh(4),
    },
    couponCode: {
      fontSize: fs(13),
      color: colors.textSecondary,
      fontFamily: colors.fontMedium,
      marginBottom: sh(8),
    },
    expiryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sh(8),
    },
    expiryIcon: {
      width: sw(14),
      height: sw(14),
      marginRight: sw(6),
      tintColor: colors.textSecondary,
    },
    expiryText: {
      fontSize: fs(12),
      color: colors.textSecondary,
      fontFamily: colors.fontRegular,
    },
    expiredText: {
      color: colors.error,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: sw(16),
      paddingVertical: sh(6),
      borderRadius: sw(100),
      borderWidth: 0.5,
      borderColor: colors.text,
      backgroundColor: colors.background,
    },
    copyIcon: {
      width: sw(16),
      height: sw(16),
      marginRight: sw(6),
    },
    copyButtonText: {
      fontSize: fs(13),
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sh(80),
      paddingHorizontal: sw(40),
    },
    emptyIcon: {
      fontSize: fs(60),
      marginBottom: sh(20),
    },
    emptyTitle: {
      fontSize: fs(20),
      color: colors.text,
      fontFamily: colors.fontBold,
      marginBottom: sh(8),
      textAlign: 'center',
    },
    emptyText: {
      fontSize: fs(14),
      color: colors.textSecondary,
      fontFamily: colors.fontRegular,
      textAlign: 'center',
    },
    errorText: {
      fontSize: fs(16),
      color: colors.error,
      fontFamily: colors.fontMedium,
      textAlign: 'center',
    },
  });

export default CouponScreen;
