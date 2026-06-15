import React, { useRef, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { Button, Header } from '../components/common';
import { authService } from '../services/api/auth';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OTPScreenProps {
  onBack: () => void;
  onContinue: () => void;
  customerId?: number | null;
}

function OTPScreen({ onBack, onContinue, customerId }: OTPScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');

    if (cleanText.length > 1) {
      const pasteData = cleanText.length >= 6 ? cleanText.slice(-6) : cleanText;
      const newOtp = [...otp];
      let lastIndex = index;

      // Usually paste overrides from the current focused box onwards
      for (let i = 0; i < pasteData.length && index + i < 6; i++) {
        newOtp[index + i] = pasteData[i];
        lastIndex = index + i;
      }

      setOtp(newOtp);
      if (lastIndex < 5) {
        inputRefs.current[lastIndex + 1]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    const digit = cleanText.slice(-1);
    const newOtp = [...otp];

    if (!digit && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }

    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the complete 6-digit OTP',
      });
      return;
    }

    if (!customerId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Customer ID not found. Please try logging in again.',
      });
      return;
    }

    setLoading(true);
    try {
      const resp = await authService.verifyOtp(customerId, code);
      console.log('OTP Verification Response:', resp);
      await AsyncStorage.setItem('customerId', String(customerId));

      // Try to save token from response (might be at resp.token, resp.data.token, etc.)
      const token =
        resp?.token ||
        resp?.data?.token ||
        resp?.access_token ||
        resp?.data?.access_token;
      console.log('Token found:', token ? 'YES' : 'NO');
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        console.log('Token saved to AsyncStorage');
      } else {
        console.warn('No token found in OTP response', resp);
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP Verified successfully!',
      });
      onContinue();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'OTP verification failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />

      <Header title={t('otp.title')} onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardHeight > 0 && { paddingBottom: keyboardHeight + sh(40) }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>{t('otp.enterCode')}</Text>

        <Text style={styles.label}>{t('otp.otp')}</Text>

        <View style={styles.otpWrapper}>
          {otp.map((digit, index) => (
            <React.Fragment key={index}>
              {index > 0 && <View style={styles.divider} />}
              <TextInput
                ref={ref => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={digit}
                onChangeText={text => handleChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="numeric"
                textContentType="oneTimeCode"
                maxLength={6}
                textAlign="center"
                placeholder="0"
                placeholderTextColor={colors.textPlaceholder}
                selectionColor={colors.primary}
              />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Continue button at bottom */}
      <View style={styles.btnContainer}>
        <Button
          label={t('otp.continue')}
          onPress={handleVerify}
          loading={loading}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
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
      paddingBottom: sh(100),
    },
    pageTitle: {
      fontSize: fs(32),
      lineHeight: fs(40),
      marginBottom: sh(24),
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    label: {
      fontSize: fs(14),
      marginBottom: sw(8),
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    otpWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      borderRadius: sw(50),
      borderWidth: 1.5,
      paddingHorizontal: sw(16),
      paddingVertical: sw(12),
      marginBottom: sh(24),
      borderColor: colors.borderSubtle,
      backgroundColor: colors.card,
    },
    otpInput: {
      width: sw(36),
      height: sw(40),
      fontSize: fs(16),
      fontFamily: 'Manrope-Bold',
      color: colors.text,
      padding: 0,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      height: sw(20),
    },
    btnContainer: {
      paddingHorizontal: sw(20),
      paddingTop: sh(8),
      paddingBottom: sh(24),
    },
  });

export default OTPScreen;
