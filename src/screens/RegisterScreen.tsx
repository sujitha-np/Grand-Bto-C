import React, { useState } from 'react';
import {
  Image,
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
import { Button, Header, CustomDatePicker } from '../components/common';
import InputField from '../components/common/InputField';
import { authService } from '../services/api/auth';
import { Images } from '../assets/images';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RegisterScreenProps {
  onBack: () => void;
  onNext: () => void;
}

const GENDER_OPTIONS = ['male', 'female', 'other'];

function RegisterScreen({ onBack, onNext }: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [dobOpen, setDobOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const handleRegister = async () => {
    const tError = (key: string, defaultText: string) => {
      const text = t(key);
      return text === key ? defaultText : text;
    };

    let newErrors: { [key: string]: string } = {};

    if (!name)
      newErrors.name = tError('register.nameRequired', 'Name is required');
    if (!phone)
      newErrors.phone = tError('register.phoneRequired', 'Phone is required');
    if (!dob)
      newErrors.dob = tError(
        'register.dobRequired',
        'Date of birth is required',
      );

    if (!email || email.trim() === '') {
      newErrors.email = tError('register.emailRequired', 'Email is required');
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.][a-zA-Z]{2,}$/.test(email.trim())
    ) {
      newErrors.email = tError('register.emailInvalid', 'Email is invalid');
    }

    if (!password) {
      newErrors.password = tError(
        'register.passwordRequired',
        'Password is required',
      );
    } else if (password.length < 6) {
      newErrors.password = tError(
        'register.passwordLength',
        'Password must be at least 6 characters',
      );
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name_en: name,
        mobile: phone,
        email,
        gender,
        dob,
        password,
      });

      // Store user data locally
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify({
          name,
          phone,
          email,
          gender,
          dob,
        }),
      );

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Registered successfully!',
      });
      onNext();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.message ||
          'An error occurred during registration. Please try again.',
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

      <Header title={t('register.title')} onBack={onBack} />

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
          <Text style={styles.pageTitle}>{t('register.enterDetails')}</Text>

          <InputField
            label={t('register.name')}
            placeholder={t('register.namePlaceholder')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            leftIcon={Images.name}
            containerStyle={styles.fieldWrapper}
            inputContainerStyle={styles.fieldContainer}
            error={errors.name}
          />

          <InputField
            maxLength={8}
            label={t('register.phone')}
            placeholder={t('register.phonePlaceholder')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={Images.call}
            containerStyle={styles.fieldWrapper}
            inputContainerStyle={styles.fieldContainer}
            error={errors.phone}
          />

          {/* Gender — custom dropdown picker */}
          <View style={[styles.genderWrapper, styles.fieldWrapper]}>
            <Text style={styles.genderLabel}>{t('register.gender')}</Text>
            <TouchableOpacity
              style={styles.genderRow}
              onPress={() => setGenderOpen(o => !o)}
              activeOpacity={0.8}
            >
              <Image
                source={Images.gender}
                style={styles.genderIconImg}
                resizeMode="contain"
              />
              <Text style={styles.genderText}>{t(`register.${gender}`)}</Text>
              <Text style={styles.chevron}>{'v'}</Text>
            </TouchableOpacity>
            {genderOpen && (
              <View style={styles.dropdown}>
                {GENDER_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setGender(opt);
                      setGenderOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        opt === gender && styles.dropdownTextActive,
                      ]}
                    >
                      {t(`register.${opt}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setDobOpen(true);
            }}
          >
            <View pointerEvents="none">
              <InputField
                label={t('register.dob')}
                placeholder={t('register.dobPlaceholder')}
                value={dob}
                editable={false}
                onChangeText={setDob}
                leftIcon={Images.calendar}
                containerStyle={styles.fieldWrapper}
                inputContainerStyle={styles.fieldContainer}
                error={errors.dob}
              />
            </View>
          </TouchableOpacity>

          <InputField
            label={t('register.email')}
            placeholder={t('register.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={Images.mail}
            containerStyle={styles.fieldWrapper}
            inputContainerStyle={styles.fieldContainer}
            error={errors.email}
          />

          <InputField
            label={t('register.password')}
            placeholder={t('register.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon={Images.password}
            rightIcon={Images.eye}
            onRightIconPress={() => setShowPassword(v => !v)}
            containerStyle={styles.fieldWrapper}
            inputContainerStyle={styles.fieldContainer}
            error={errors.password}
          />

          {/* Next button */}
          <View style={styles.btnContainer}>
            <Button
              label={t('register.next')}
              onPress={handleRegister}
              loading={loading}
              variant="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomDatePicker
        visible={dobOpen}
        onClose={() => setDobOpen(false)}
        onSelect={date => {
          setDob(date);
          setDobOpen(false);
        }}
      />
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
      paddingBottom: sh(40),
    },
    pageTitle: {
      fontSize: fs(32),
      lineHeight: fs(40),
      marginBottom: sh(24),
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    genderWrapper: {
      width: '100%',
    },
    genderLabel: {
      fontSize: fs(14),
      marginBottom: sw(8),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
    },
    genderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: sw(50),
      paddingHorizontal: sw(18),
      paddingVertical: sw(14),
      borderWidth: 1.5,
      gap: sw(10),
      backgroundColor: colors.card,
      borderColor: colors.borderSubtle,
    },
    genderText: {
      flex: 1,
      fontSize: fs(14),
      color: colors.text,
      fontFamily: colors.fontRegular,
    },
    genderIconImg: {
      width: sw(20),
      height: sw(20),
      marginRight: sw(10),
      tintColor: colors.textMuted,
    },
    chevron: {
      fontSize: fs(13),
      color: colors.textMuted,
      fontFamily: colors.fontBold,
    },
    dropdown: {
      borderRadius: sw(14),
      borderWidth: 1,
      marginTop: sh(6),
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderColor: colors.borderSubtle,
    },
    dropdownItem: {
      paddingHorizontal: sw(20),
      paddingVertical: sh(13),
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    dropdownText: {
      fontSize: fs(14),
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    dropdownTextActive: {
      color: '#FF7B00',
      fontFamily: colors.fontBold,
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

export default RegisterScreen;
