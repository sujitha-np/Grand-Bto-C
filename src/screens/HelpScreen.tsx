import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  I18nManager,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { Images } from '../assets/images';
import Header from '../components/common/Header';
import { useContact } from '../hooks/queries';
import Toast from 'react-native-toast-message';

interface HelpScreenProps {
  onBack: () => void;
}

function HelpScreen({ onBack }: HelpScreenProps) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const isArabic = i18n.language?.startsWith('ar') || I18nManager.isRTL;
  const styles = React.useMemo(
    () => createStyles(colors, insets, isArabic),
    [colors, insets, isArabic],
  );

  const { data: contactResponse, isLoading } = useContact();
  const contact = contactResponse?.data;

  const phone = contact?.phone || contact?.mobilo;
  const whatsapp = contact?.whatsapp_no;
  const email = contact?.email;
  const address = isArabic
    ? contact?.address_ar || contact?.address_en
    : contact?.address_en || contact?.address_ar;

  const handlePhonePress = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not open phone dialer',
      });
    });
  };

  const handleWhatsAppPress = (waNumber: string) => {
    const cleanNumber = waNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}`;
    Linking.openURL(url).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not open WhatsApp',
      });
    });
  };

  const handleEmailPress = (emailAddress: string) => {
    Linking.openURL(`mailto:${emailAddress}`).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not open email client',
      });
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <Header title={t('account.help', 'Help')} onBack={onBack} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {phone ? (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handlePhonePress(phone)}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={Images.call}
                  style={styles.icon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.label}>
                  {isArabic ? 'الهاتف' : 'Phone'}
                </Text>
                <Text style={styles.value}>{phone}</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {whatsapp ? (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleWhatsAppPress(whatsapp)}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={Images.chatBubble}
                  style={styles.icon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.label}>
                  {isArabic ? 'واتساب' : 'WhatsApp'}
                </Text>
                <Text style={styles.value}>{whatsapp}</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {email ? (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleEmailPress(email)}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={Images.mail}
                  style={styles.icon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.label}>
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </Text>
                <Text style={styles.value}>{email}</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {address ? (
            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <Image
                  source={Images.location}
                  style={styles.icon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.label}>
                  {isArabic ? 'العنوان' : 'Address'}
                </Text>
                <Text style={styles.value}>{address}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any, insets: any, isArabic: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: sw(20),
      paddingTop: sh(16),
      paddingBottom: insets.bottom + sh(24),
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: sw(16),
      padding: sw(16),
      marginBottom: sh(14),
      borderWidth: 1,
      borderColor: colors.borderSubtle || '#EEEEEE',
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    iconContainer: {
      width: sw(44),
      height: sw(44),
      borderRadius: sw(22),
      backgroundColor: colors.primaryLight || '#FFF8F2',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isArabic ? 0 : sw(14),
      marginLeft: isArabic ? sw(14) : 0,
    },
    icon: {
      width: sw(22),
      height: sw(22),
      tintColor: colors.primary,
    },
    contentContainer: {
      flex: 1,
    },
    label: {
      fontSize: fs(12),
      fontFamily: colors.fontMedium || 'Manrope-Medium',
      color: colors.textMuted || '#888888',
      marginBottom: sh(4),
      textAlign: isArabic ? 'right' : 'left',
    },
    value: {
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold || 'Manrope-SemiBold',
      color: colors.text,
      lineHeight: fs(20),
      textAlign: isArabic ? 'right' : 'left',
    },
  });

export default HelpScreen;
