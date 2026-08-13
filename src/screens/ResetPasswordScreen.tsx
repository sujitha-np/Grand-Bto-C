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
import { customerService } from '../services/api/customer';
import { Images } from '../assets/images';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ResetPasswordScreenProps {
  onBack: () => void;
}

function ResetPasswordScreen({ onBack }: ResetPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();

  const [customerId, setCustomerId] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

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

  const handleResetPassword = async () => {
    // Clear previous errors
    setErrors({});
    let hasError = false;
    const newErrors: typeof errors = {};

    if (!password) {
      newErrors.password = t('resetPassword.required', 'This field is required');
      hasError = true;
    } else if (password.length < 8) {
      newErrors.password = t('resetPassword.lengthError', 'Password must be at least 8 characters long');
      hasError = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('resetPassword.required', 'This field is required');
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('resetPassword.mismatch', 'Passwords do not match');
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    if (!customerId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User session not found. Please log in again.',
      });
      return;
    }

    setLoading(true);
    try {
      await customerService.resetPassword(customerId, password, confirmPassword);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: t('resetPassword.success', 'Password reset successfully!'),
      });
      onBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || t('resetPassword.error', 'Failed to reset password. Please try again.'),
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

      <Header title={t('resetPassword.title')} onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardHeight > 0 && { paddingBottom: keyboardHeight + sh(40) }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>{t('resetPassword.title')}</Text>

        <InputField
          label={t('resetPassword.newPassword')}
          placeholder={t('resetPassword.newPasswordPlaceholder')}
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (errors.password) {
              setErrors(prev => ({ ...prev, password: undefined }));
            }
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          leftIcon={Images.password}
          rightIcon={Images.eye}
          onRightIconPress={() => setShowPassword(v => !v)}
          containerStyle={styles.fieldWrapper}
          inputContainerStyle={styles.fieldContainer}
          error={errors.password}
        />

        <InputField
          label={t('resetPassword.confirmPassword')}
          placeholder={t('resetPassword.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChangeText={(val) => {
            setConfirmPassword(val);
            if (errors.confirmPassword) {
              setErrors(prev => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          leftIcon={Images.password}
          rightIcon={Images.eye}
          onRightIconPress={() => setShowConfirmPassword(v => !v)}
          containerStyle={styles.fieldWrapper}
          inputContainerStyle={styles.fieldContainer}
          error={errors.confirmPassword}
        />

        {/* Reset button */}
        <View style={styles.btnContainer}>
          <Button
            label={t('resetPassword.submit')}
            onPress={handleResetPassword}
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
      fontSize: fs(28),
      lineHeight: fs(36),
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

export default ResetPasswordScreen;
