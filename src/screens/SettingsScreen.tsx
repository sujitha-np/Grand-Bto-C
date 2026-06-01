import React, { useState, useEffect } from 'react';
import {
  I18nManager,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage } from '../store/languageSlice';
import { toggleTheme } from '../store/themeSlice';
import { Language, LANGUAGES } from '../i18n';
import i18n from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { Images } from '../assets/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addressService } from '../services/api/address';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigateToAddresses?: () => void;
}

function SettingsScreen({ onBack, onNavigateToAddresses }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const colors = useTheme();
  const currentLanguage = useAppSelector(state => state.language.current);
  const themeMode = useAppSelector(state => state.theme.mode);
  const isDark = themeMode === 'dark';
  const [notifications, setNotifications] = useState(true);
  const [addressCount, setAddressCount] = useState(0);
  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  useEffect(() => {
    fetchAddressCount();
  }, []);

  const fetchAddressCount = async () => {
    try {
      const customerId = await AsyncStorage.getItem('customerId');
      if (customerId) {
        const response = await addressService.getSavedAddresses(customerId);
        if (response.success && response.data) {
          setAddressCount(response.data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleLanguageToggle = () => {
    const nextLang: Language = currentLanguage === 'en' ? 'ar' : 'en';
    const isRTL = nextLang === LANGUAGES.ar;
    i18n.changeLanguage(nextLang);
    dispatch(setLanguage(nextLang));
    I18nManager.forceRTL(isRTL);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.menuList}>
        {/* Saved Address */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={onNavigateToAddresses}
        >
          <View style={styles.menuLeft}>
            <Image
              source={Images.address}
              style={styles.menuIconImage}
              resizeMode="contain"
            />
            <Text style={styles.menuLabel}>{t('settings.savedAddress')}</Text>
          </View>
          <Text style={styles.menuValue}>{addressCount} Saved</Text>
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setNotifications(!notifications)}
        >
          <View style={styles.menuLeft}>
            <Image
              source={Images.notification}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
            <Text style={styles.menuLabel}>{t('settings.notifications')}</Text>
          </View>
          <View style={[styles.toggle, notifications && styles.toggleActive]}>
            <View
              style={[
                styles.toggleThumb,
                notifications && styles.toggleThumbActive,
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Language */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={handleLanguageToggle}
        >
          <View style={styles.menuLeft}>
            <Image
              source={Images.language}
              style={styles.menuIconImage}
              resizeMode="contain"
            />
            <Text style={styles.menuLabel}>{t('settings.language')}</Text>
          </View>
          <Text style={styles.menuValue}>
            {currentLanguage === 'en' ? 'English' : 'العربية'}
          </Text>
        </TouchableOpacity>

        {/* Dark Theme */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => dispatch(toggleTheme())}
        >
          <View style={styles.menuLeft}>
            <Image
              source={Images.theme}
              style={styles.menuIconImage}
              resizeMode="contain"
            />
            <Text style={styles.menuLabel}>{t('settings.darkTheme')}</Text>
          </View>
          <View style={[styles.toggle, isDark && styles.toggleActive]}>
            <View
              style={[styles.toggleThumb, isDark && styles.toggleThumbActive]}
            />
          </View>
        </TouchableOpacity>

        {/* Country */}
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Image
              source={Images.country}
              style={styles.menuIconImage}
              resizeMode="contain"
            />
            <Text style={styles.menuLabel}>{t('settings.country')}</Text>
          </View>
          <Text style={styles.menuValue}>Qatar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sw(20),
      paddingVertical: sh(16),
      backgroundColor: colors.background,
    },
    backBtn: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(20),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    backIcon: {
      fontSize: fs(18),
      color: colors.text,
      fontFamily: colors.fontBold,
    },
    headerTitle: {
      fontSize: fs(20),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
    },
    headerSpacer: {
      width: sw(40),
    },
    menuList: {
      paddingHorizontal: sw(20),
      paddingTop: sh(8),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: sh(18),
      borderBottomWidth: 0,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuIconImage: {
      width: sw(24),
      height: sw(24),
      tintColor: colors.text,
      marginRight: sw(16),
    },
    notificationIcon: {
      width: sw(24),
      height: sw(24),
      marginRight: sw(16),
    },
    menuLabel: {
      fontSize: fs(16),
      color: colors.text,
      fontFamily: colors.fontRegular,
    },
    menuValue: {
      fontSize: fs(15),
      color: colors.textMuted,
      fontFamily: colors.fontRegular,
    },
    toggle: {
      width: sw(48),
      height: sh(26),
      borderRadius: sw(13),
      justifyContent: 'center',
      backgroundColor: '#D1D5DB',
      position: 'relative',
    },
    toggleActive: {
      backgroundColor: '#FFE9D5',
    },
    toggleThumb: {
      position: 'absolute',
      width: sw(22),
      height: sw(22),
      borderRadius: sw(11),
      backgroundColor: '#FFFFFF',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      left: sw(2),
    },
    toggleThumbActive: {
      left: sw(24),
      backgroundColor: '#FF7B00',
    },
  });

export default SettingsScreen;
