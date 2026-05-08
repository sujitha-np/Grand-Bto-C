import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { Images } from '../assets/images';

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
  onSettings: () => void;
}

function WelcomeScreen({
  onLogin,
  onRegister,
  onSettings,
}: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={onSettings}
        activeOpacity={0.7}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <Image
            source={Images.bg}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.logoWrapper}>
            <Image
              source={Images.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            {t('welcome.title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('welcome.subtitle')}
          </Text>
          <Text style={styles.description}>
            {t('welcome.description')}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              label={t('welcome.login')}
              onPress={onLogin}
              variant="primary"
            />
            <Button
              label={t('welcome.register')}
              onPress={onRegister}
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    height: sh(380),
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    alignItems: 'center',
    paddingHorizontal: sw(24),
    paddingTop: sh(25),
  },
  logoWrapper: {
    backgroundColor: colors.card,
  },
  logo: {
    width: sw(100),
    height: sw(100),
    borderRadius: sw(50),
  },
  title: {
    fontSize: fs(28),
    color: colors.text,
    fontFamily: colors.fontMedium,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fs(16),
    color: colors.textSecondary,
    fontFamily: colors.fontRegular,
    textAlign: 'center',
  },
  description: {
    marginTop: sh(10),
    fontSize: fs(10),
    color: colors.textSecondary,
    fontFamily: colors.fontRegular,
    textAlign: 'center',
    paddingHorizontal: sw(16),
    opacity: 0.5,
  },
  buttonContainer: {
    width: '100%',
    marginTop: sh(52),
    gap: sh(12),
    paddingBottom: insets.bottom + 24,
  },
  settingsBtn: {
    position: 'absolute',
    right: sw(16),
    top: insets.top + 12,
    zIndex: 10,
    width: sw(40),
    height: sw(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: fs(22),
  },
});

export default WelcomeScreen;
