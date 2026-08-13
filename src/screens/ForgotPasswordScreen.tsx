import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Keyboard,
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

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
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

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const handleSubmit = async () => {
    setError(undefined);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError(t('forgotPasswordScreen.required', 'Email is required'));
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError(t('forgotPasswordScreen.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(emailTrimmed);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: t('login.forgotPasswordSuccess', 'Password reset link sent to your email!'),
      });
      onBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to request password reset',
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

      <Header title={t('forgotPasswordScreen.title')} onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardHeight > 0 && { paddingBottom: keyboardHeight + sh(40) }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>{t('forgotPasswordScreen.enterEmail')}</Text>

        <InputField
          label={t('forgotPasswordScreen.email')}
          placeholder={t('forgotPasswordScreen.emailPlaceholder')}
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (error) setError(undefined);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={Images.mail}
          containerStyle={styles.fieldWrapper}
          inputContainerStyle={styles.fieldContainer}
          error={error}
        />

        {/* Submit button */}
        <View style={styles.btnContainer}>
          <Button
            label={t('forgotPasswordScreen.submit')}
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
          />
        </View>
      </ScrollView>
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
      paddingTop: sh(10),
      paddingBottom: sh(40),
    },
    pageTitle: {
      fontSize: fs(24),
      lineHeight: fs(32),
      marginBottom: sh(24),
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    btnContainer: {
      paddingTop: sh(16),
    },
    fieldWrapper: {
      marginBottom: sh(14),
    },
    fieldContainer: {
      backgroundColor: colors.card,
      borderColor: colors.borderSubtle,
    },
  });

export default ForgotPasswordScreen;
