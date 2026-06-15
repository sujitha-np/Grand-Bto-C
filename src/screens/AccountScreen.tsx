import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Images } from '../assets/images';
import {
  useCustomerProfile,
  useLoyaltyPoints,
  usePromocodes,
} from '../hooks/queries';

interface AccountScreenProps {
  onLogout: () => void;
  onAccountInfo?: () => void;
  onSettings?: () => void;
  onFeedback?: () => void;
  onOrderHistory?: () => void;
  onLoyaltyPoints?: () => void;
  onCoupons?: () => void;
}

function AccountScreen({
  onLogout,
  onAccountInfo,
  onSettings,
  onFeedback,
  onOrderHistory,
  onLoyaltyPoints,
  onCoupons,
}: AccountScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [customerId, setCustomerId] = useState<string | undefined>();

  // Fetch customer profile
  const { data: profileData, isLoading: profileLoading } =
    useCustomerProfile(customerId);
  const profile = profileData?.data;

  // Fetch loyalty points
  const { data: loyaltyData } = useLoyaltyPoints(customerId);
  const loyaltyPoints = loyaltyData?.data?.total_loyalty_points || 0;

  // Fetch promocodes
  const { data: promocodeData } = usePromocodes();
  const promocodes = promocodeData?.data || [];

  // Count non-expired coupons
  const availableCoupons = promocodes.filter((promo: any) => {
    return new Date(promo.end_date) >= new Date();
  }).length;

  useEffect(() => {
    const loadCustomerId = async () => {
      try {
        const storedCustomerId = await AsyncStorage.getItem('customerId');
        if (storedCustomerId) {
          setCustomerId(storedCustomerId);
        }
      } catch (error) {
        console.error('Error loading customerId:', error);
      }
    };

    loadCustomerId();
  }, []);

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const menuItems = [
    { id: '1', title: t('account.accountInfo'), icon: Images.name },
    {
      id: '2',
      title: t('account.loyaltyPoints'),
      icon: Images.loyality,
      value: `${loyaltyPoints} ${t('account.points')}`,
    },
    { id: '3', title: t('account.coupon'), icon: Images.coupon },
    { id: '4', title: t('account.orderHistory'), icon: Images.orderHistory },
    { id: '5', title: t('account.settings'), icon: Images.settings },
    { id: '6', title: t('account.about'), icon: Images.about },
    { id: '7', title: t('account.help'), icon: Images.help },
  ];

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('customerId');
      await AsyncStorage.removeItem('userToken');
      onLogout();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header Section with Image Background */}
        <ImageBackground
          source={Images.homescreenBg}
          style={styles.headerBg}
          imageStyle={styles.headerBgImage}
        >
          {/* Profile Row */}
          <View style={styles.profileRow}>
            <View style={styles.profileLeft}>
              <View style={styles.avatarContainer}>
                {/* Placeholder for actual avatar */}
                <Image source={Images.account} style={styles.avatar} />
              </View>
              {profileLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.profileName}>
                  {profile?.name_en || 'Guest'}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.helpButton} onPress={onFeedback}>
              <Image source={Images.chatBubble} style={styles.helpIcon} />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Overlapping Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={onCoupons}>
            <Image source={Images.couponCard} style={styles.statIcon} />
            <View>
              <Text style={styles.statLabel}>{t('account.coupon')}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValueNumber}>{availableCoupons}</Text>
                <Text style={styles.statValueText}>
                  {t('account.available')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
              console.log('Loyalty Points card clicked');
              if (onLoyaltyPoints) {
                onLoyaltyPoints();
              }
            }}
          >
            <Image source={Images.loyaltyCard} style={styles.statIcon} />
            <View>
              <Text style={styles.statLabel}>{t('account.loyaltyPoints')}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValueNumber}>{loyaltyPoints}</Text>
                <Text style={styles.statValueText}>{t('account.points')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                console.log('Menu item clicked:', item.id, item.title);
                if (item.id === '1') {
                  onAccountInfo && onAccountInfo();
                } else if (item.id === '2') {
                  console.log('Calling onLoyaltyPoints');
                  onLoyaltyPoints && onLoyaltyPoints();
                } else if (item.id === '3') {
                  onCoupons && onCoupons();
                } else if (item.id === '4') {
                  onOrderHistory && onOrderHistory();
                } else if (item.id === '5') {
                  onSettings && onSettings();
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <Image
                  source={item.icon}
                  style={styles.menuIcon}
                  resizeMode="contain"
                />
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Log out button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Image
            source={Images.logout}
            style={styles.logoutIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoutText}>{t('account.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerBg: {
      paddingHorizontal: sw(20),
      paddingBottom: sh(140), // stretch the gradient down significantly
      paddingTop: insets.top > 0 ? insets.top : sh(20),
    },
    headerBgImage: {
      borderBottomLeftRadius: sw(24),
      borderBottomRightRadius: sw(24),
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: sh(20),
    },
    profileLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      width: sw(48),
      height: sw(48),
      borderRadius: sw(24),
      backgroundColor: colors.card,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    profileName: {
      fontSize: fs(20),
      color: colors.darkBrown,
      marginLeft: sw(12),
      fontFamily: 'Manrope-Medium',
    },
    helpButton: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(20),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    helpIcon: {
      width: sw(20),
      height: sw(20),
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: sw(20),
      marginTop: -sh(100), // pull cards up into the gradient
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: sw(16),
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sh(16),
      paddingHorizontal: sw(12),
      marginHorizontal: sw(4),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    statIcon: {
      width: sw(40),
      height: sw(40),
      marginRight: sw(8),
    },
    statLabel: {
      fontSize: fs(10),
      marginBottom: sh(2),
      color: colors.textMuted,
      fontFamily: 'Manrope-Medium',
    },
    statValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    statValueNumber: {
      fontSize: fs(16),
      color: colors.darkBrown,
      fontFamily: 'Manrope-Bold',
    },
    statValueText: {
      fontSize: fs(12),
      color: colors.text,
      fontFamily: 'Manrope-Medium',
      marginLeft: sw(4),
    },
    menuContainer: {
      marginTop: sh(45),
      paddingHorizontal: sw(24),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: sh(16),
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      width: sw(22),
      height: sw(22),
      marginRight: sw(24), // increase spacing from text
      tintColor: colors.darkBrown,
    },
    menuTitle: {
      fontSize: fs(14),
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    menuValue: {
      fontSize: fs(12),
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: sh(40),
      marginBottom: sh(40),
    },
    logoutIcon: {
      width: sw(20),
      height: sw(20),
      marginRight: sw(8),
    },
    logoutText: {
      fontSize: fs(14),
      color: '#E04141',
      fontFamily: 'Manrope-Medium',
    },
  });

export default AccountScreen;
