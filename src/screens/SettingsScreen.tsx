import React, { useState } from 'react';
import {
  I18nManager,
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
import { Header } from '../components/common';

interface SettingsScreenProps {
  onBack: () => void;
}

function SettingsScreen({ onBack }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const colors = useTheme();
  const currentLanguage = useAppSelector(state => state.language.current);
  const themeMode = useAppSelector(state => state.theme.mode);
  const isDark = themeMode === 'dark';
  const [notifications, setNotifications] = useState(true);
  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

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

      <Header title={t('settings.title')} onBack={onBack} />

      <View style={styles.menuList}>
        {/* Saved Address */}
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>◎</Text>
            <Text style={styles.menuLabel}>{t('settings.savedAddress')}</Text>
          </View>
          <Text style={styles.menuValue}>{t('settings.savedValue')}</Text>
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setNotifications(!notifications)}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🔔</Text>
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
            <Text style={styles.menuIcon}>文A</Text>
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
            <Text style={styles.menuIcon}>🌙</Text>
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
            <Text style={styles.menuIcon}>🌐</Text>
            <Text style={styles.menuLabel}>{t('settings.country')}</Text>
          </View>
          <Text style={styles.menuValue}>{t('settings.countryValue')}</Text>
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
    menuList: {
      paddingHorizontal: sw(24),
      paddingTop: sh(20),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: sh(20),
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      fontSize: fs(20),
      width: sw(30),
      color: '#3B2B20',
    },
    menuLabel: {
      fontSize: fs(15),
      color: colors.text,
      fontFamily: colors.fontMedium,
      marginLeft: sw(12),
    },
    menuValue: {
      fontSize: fs(14),
      color: colors.textMuted,
      fontFamily: colors.fontRegular,
    },
    toggle: {
      width: sw(44),
      height: sw(24),
      borderRadius: sw(12),
      justifyContent: 'center',
      backgroundColor: colors.border,
    },
    toggleActive: {
      backgroundColor: '#FF7B00',
    },
    toggleThumb: {
      position: 'absolute',
      width: sw(20),
      height: sw(20),
      borderRadius: sw(10),
      backgroundColor: '#FFFFFF',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      left: 2,
    },
    toggleThumbActive: {
      left: 22,
    },
  });

export default SettingsScreen;
