import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { Button, Header } from '../components/common';
import InputField from '../components/common/InputField';
import { authService } from '../services/api/auth';
import { Images } from '../assets/images';
import Toast from 'react-native-toast-message';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (customerId: number) => void;
}

function LoginScreen({ onBack, onLogin }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const handleLogin = async () => {
    const loginId = email.trim() || phone.trim();
    if (!loginId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: t(
          'login.emailOrPhoneRequired',
          'Please enter email or phone number',
        ),
      });
      return;
    }
    if (!password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: t('login.passwordRequired', 'Please enter password'),
      });
      return;
    }

    setLoading(true);
    try {
      const data = await authService.sendOtp(loginId, password);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP sent successfully!',
      });
      onLogin(data?.customer_id);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Login failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />

      <Header title={t('login.title')} onBack={onBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.pageTitle}>{t('login.enterDetails')}</Text>

          <InputField
            label={t('login.email')}
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={Images.mail}
            containerStyle={styles.fieldWrapper}
            inputContainerStyle={styles.fieldContainer}
          />

          {/* Or divider */}
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t('login.or')}</Text>
            <View style={styles.orLine} />
          </View>

          <InputField
            maxLength={8}
            label={t('login.phone')}
            placeholder={t('login.phonePlaceholder')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={Images.call}
            containerStyle={styles.fieldWrapper}
            inputContainerStyle={styles.fieldContainer}
          />

          <InputField
            label={t('login.password')}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon={Images.password}
            rightIcon={Images.eye}
            onRightIconPress={() => setShowPassword(v => !v)}
            containerStyle={styles.fieldWrapper}
            inputContainerStyle={styles.fieldContainer}
          />

          {/* Continue button */}
          <View style={styles.btnContainer}>
            <Button
              label={t('login.continue')}
              onPress={handleLogin}
              loading={loading}
              variant="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: sw(20),
      paddingTop: sh(4),
      paddingBottom: sh(16),
    },
    pageTitle: {
      fontSize: fs(32),
      lineHeight: fs(40),
      marginBottom: sh(24),
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    orContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sh(14),
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderSubtle,
    },
    orText: {
      fontSize: fs(14),
      marginHorizontal: sw(12),
      color: colors.textMuted,
      fontFamily: colors.fontRegular,
    },
    btnContainer: {
      paddingTop: sh(8),
    },
    fieldWrapper: {
      marginBottom: sh(14),
    },
    fieldContainer: {
      backgroundColor: colors.card,
      borderColor: colors.borderSubtle,
    },
  });

export default LoginScreen;
