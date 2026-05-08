import React, { useState } from 'react';
import {
  Image,
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
import { Images } from '../assets/images';
import InputField from '../components/common/InputField';

interface AccountInfoScreenProps {
  onBack: () => void;
}

function AccountInfoScreen({ onBack }: AccountInfoScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors, insets), [colors, insets]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);

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
        <Text style={styles.headerTitle}>
          {t('accountInfo.title')}
        </Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.editIcon}>✎</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <InputField
          label={t('accountInfo.name')}
          placeholder={t('accountInfo.namePlaceholder')}
          value={name}
          onChangeText={setName}
          editable={isEditing}
          autoCapitalize="words"
          leftIcon={Images.name}
          containerStyle={styles.fieldWrapper}
          inputContainerStyle={styles.fieldContainer}
        />

        {/* Phone Number */}
        <InputField
          label={t('accountInfo.phone')}
          placeholder={t('accountInfo.phonePlaceholder')}
          value={phone}
          onChangeText={setPhone}
          editable={isEditing}
          keyboardType="phone-pad"
          leftIcon={Images.call}
          containerStyle={styles.fieldWrapper}
          inputContainerStyle={styles.fieldContainer}
        />

        {/* Email */}
        <InputField
          label={t('accountInfo.email')}
          placeholder={t('accountInfo.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          editable={isEditing}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={Images.mail}
          containerStyle={styles.fieldWrapper}
          inputContainerStyle={styles.fieldContainer}
        />

        {/* Gender — custom dropdown */}
        <View style={[styles.genderWrapper, styles.fieldWrapper]}>
          <Text style={styles.genderLabel}>
            {t('accountInfo.gender')}
          </Text>
          <TouchableOpacity
            style={styles.genderRow}
            onPress={() => isEditing && setGenderOpen(o => !o)}
            activeOpacity={isEditing ? 0.8 : 1}
          >
            <Image
              source={Images.gender}
              style={styles.genderIconImg}
              resizeMode="contain"
            />
            <Text style={styles.genderText}>
              {t(`register.${gender}`)}
            </Text>
            {isEditing && (
              <Text style={styles.chevron}>{'v'}</Text>
            )}
          </TouchableOpacity>
          {genderOpen && isEditing && (
            <View style={styles.dropdown}>
              {['male', 'female', 'other'].map(opt => (
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

        {/* DOB */}
        <InputField
          label={t('accountInfo.dob')}
          placeholder={t('accountInfo.dobPlaceholder')}
          value={dob}
          onChangeText={setDob}
          editable={isEditing}
          leftIcon={Images.calendar}
          containerStyle={styles.fieldWrapper}
          inputContainerStyle={styles.fieldContainer}
        />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: insets.top,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(20),
    paddingVertical: sh(12),
    backgroundColor: colors.background,
  },
  backBtn: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backIcon: {
    fontSize: fs(16),
    color: colors.text,
    fontFamily: colors.fontBold,
  },
  headerTitle: {
    fontSize: fs(18),
    color: colors.text,
    fontFamily: colors.fontSemiBold,
  },
  editBtn: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editIcon: {
    fontSize: fs(18),
    color: '#3B2B20',
  },
  scrollContent: {
    paddingHorizontal: sw(20),
    paddingTop: sh(16),
    paddingBottom: sh(40),
  },
  fieldWrapper: {
    marginBottom: sh(14),
  },
  fieldContainer: {
    backgroundColor: colors.card,
    borderColor: colors.borderSubtle,
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
    paddingVertical: sh(14),
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
});

export default AccountInfoScreen;
