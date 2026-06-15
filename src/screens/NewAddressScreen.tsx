import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Images } from '../assets/images';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import Header from '../components/common/Header';
import { useTheme } from '../hooks/useTheme';
import { fs, sh, sw } from '../utils/responsive';
import { useSaveAddress, useUpdateAddress } from '../hooks/queries';
import { SavedAddress } from '../services/api/address';

interface NewAddressScreenProps {
  onBack: () => void;
  onSave?: (addressData: any) => void;
  editAddress?: SavedAddress;
  onAddNew?: () => void;
}

type AddressType = 'house' | 'apartment' | 'office';

function NewAddressScreen({
  onBack,
  onSave,
  editAddress,
  onAddNew,
}: NewAddressScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const { mutate: saveAddress, isPending: isSaving } = useSaveAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();

  const isPending = isSaving || isUpdating;
  const isEditMode = !!editAddress;

  // Yup validation schema with translations
  const addressValidationSchema = useMemo(
    () =>
      yup.object().shape({
        label: yup.string().required(t('newAddress.required')),
        name: yup.string().required(t('newAddress.required')),
        buildingName: yup.string().required(t('newAddress.required')),
        street: yup.string().required(t('newAddress.required')),
        phoneNumber: yup.string().required(t('newAddress.required')),
        additionalDirections: yup.string().required(t('newAddress.required')),
        aptNumber: yup.string().notRequired(),
        floor: yup.string().notRequired(),
      }),
    [t],
  );

  const [customerId, setCustomerId] = useState<string>();
  const [selectedType, setSelectedType] = useState<AddressType>('office');
  const [label, setLabel] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [aptNumber, setAptNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [street, setStreet] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [additionalDirections, setAdditionalDirections] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Load customer ID
  useEffect(() => {
    const loadCustomerId = async () => {
      const storedCustomerId = await AsyncStorage.getItem('customerId');
      if (storedCustomerId) {
        setCustomerId(storedCustomerId);
      }
    };
    loadCustomerId();
  }, []);

  // Populate form when editing, clear when adding new
  useEffect(() => {
    if (editAddress) {
      console.log('=== Populating form with edit address ===', editAddress);
      setSelectedType((editAddress.address_type as AddressType) || 'office');
      setLabel(editAddress.label || '');
      setBuildingName(editAddress.building || '');
      setAptNumber(editAddress.apartment || '');
      setFloor(editAddress.floor || '');
      setStreet(editAddress.street || '');
      setPhoneNumber(editAddress.phone_no || editAddress.phone || '');
      setName(editAddress.name || '');
      setAdditionalDirections(editAddress.additional_directions || '');
    } else {
      // Clear form when switching to add new mode
      console.log('=== Clearing form for new address ===');
      setSelectedType('office');
      setLabel('');
      setBuildingName('');
      setAptNumber('');
      setFloor('');
      setStreet('');
      setPhoneNumber('');
      setName('');
      setAdditionalDirections('');
      setErrors({});
    }
  }, [editAddress]);

  const handleSave = async () => {
    console.log('=== handleSave called ===');

    // Clear previous errors
    setErrors({});

    // Check if customer ID exists
    if (!customerId) {
      console.error('Customer ID not found');
      return;
    }

    // Prepare form data for validation
    const formData = {
      label: label.trim(),
      name: name.trim(),
      buildingName: buildingName.trim(),
      street: street.trim(),
      phoneNumber: phoneNumber.trim(),
      additionalDirections: additionalDirections.trim(),
      aptNumber: aptNumber.trim(),
      floor: floor.trim(),
    };

    console.log('Form data to validate:', formData);

    try {
      // Validate with Yup
      await addressValidationSchema.validate(formData, { abortEarly: false });

      console.log('Validation passed, calling API...');
      console.log('Is Edit Mode:', isEditMode);
      console.log('Edit Address ID:', editAddress?.id);

      const addressPayload = {
        customerId,
        name: formData.name,
        phoneNo: formData.phoneNumber,
        building: formData.buildingName,
        street: formData.street,
        addressType: selectedType,
        label: formData.label,
        additionalDirections: formData.additionalDirections,
        apartment: formData.aptNumber || undefined,
        floor: formData.floor || undefined,
        coordinates: editAddress?.coordinates || '0,0',
      };

      // If validation passes, call the appropriate API (update or create)
      if (isEditMode && editAddress) {
        console.log('=== Calling UPDATE API ===');
        console.log('Update payload:', {
          ...addressPayload,
          addressId: editAddress.id.toString(),
        });

        updateAddress(
          {
            ...addressPayload,
            addressId: editAddress.id.toString(),
          },
          {
            onSuccess: data => {
              console.log('=== Update API Response ===', data);
              if (data.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: data.message || 'Address updated successfully!',
                });
                onBack();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: data.message || 'Failed to update address.',
                });
              }
            },
            onError: (error: any) => {
              console.error('=== Update API Error ===', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2:
                  error.message || 'An error occurred while updating address.',
              });
            },
          },
        );
      } else {
        console.log('=== Calling CREATE API ===');
        console.log('Create payload:', addressPayload);

        saveAddress(addressPayload, {
          onSuccess: data => {
            console.log('=== Create API Response ===', data);
            if (data.success) {
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: data.message || 'Address saved successfully!',
              });
              onBack();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: data.message || 'Failed to save address.',
              });
            }
          },
          onError: (error: any) => {
            console.error('=== Create API Error ===', error);
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: error.message || 'An error occurred while saving address.',
            });
          },
        });
      }
    } catch (validationError: any) {
      console.log('=== Validation failed ===');
      console.log('Validation error:', validationError);

      // Handle Yup validation errors
      if (validationError.inner) {
        const newErrors: Record<string, string> = {};
        validationError.inner.forEach((error: any) => {
          console.log('Field error:', error.path, '-', error.message);
          if (error.path) {
            newErrors[error.path] = error.message;
          }
        });
        console.log('Setting errors:', newErrors);
        setErrors(newErrors);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.headerRow}>
        <Header
          title={isEditMode ? t('newAddress.editTitle') : t('newAddress.title')}
          onBack={onBack}
          containerStyle={styles.headerContainer}
        />
        {isEditMode && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addButton}
            onPress={onAddNew}
          >
            <Text style={styles.addButtonText}>Add+</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          keyboardHeight > 0 && { paddingBottom: keyboardHeight + sh(40) }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Address Type Toggles */}
        <View style={styles.typeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.typeToggle,
              selectedType === 'house' && [
                styles.typeToggleActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setSelectedType('house')}
            activeOpacity={0.8}
          >
            <Image
              source={
                selectedType === 'house' ? Images.houseActive : Images.house
              }
              style={styles.typeToggleIcon}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.typeToggleText,
                {
                  color: selectedType === 'house' ? colors.white : colors.text,
                  fontFamily:
                    selectedType === 'house'
                      ? colors.fontSemiBold
                      : colors.fontRegular,
                },
              ]}
            >
              {t('newAddress.house')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeToggle,
              selectedType === 'apartment' && [
                styles.typeToggleActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setSelectedType('apartment')}
            activeOpacity={0.8}
          >
            <Image
              source={
                selectedType === 'apartment'
                  ? Images.appartmentActive
                  : Images.appartment
              }
              style={styles.typeToggleIcon}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.typeToggleText,
                {
                  color:
                    selectedType === 'apartment' ? colors.white : colors.text,
                  fontFamily:
                    selectedType === 'apartment'
                      ? colors.fontSemiBold
                      : colors.fontRegular,
                },
              ]}
            >
              {t('newAddress.apartment')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeToggle,
              selectedType === 'office' && [
                styles.typeToggleActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setSelectedType('office')}
            activeOpacity={0.8}
          >
            <Image
              source={
                selectedType === 'office' ? Images.officeActive : Images.office
              }
              style={styles.typeToggleIcon}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.typeToggleText,
                {
                  color: selectedType === 'office' ? colors.white : colors.text,
                  fontFamily:
                    selectedType === 'office'
                      ? colors.fontSemiBold
                      : colors.fontRegular,
                },
              ]}
            >
              {t('newAddress.office')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Label */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('newAddress.label')}</Text>
          <TextInput
            style={[styles.textInput, errors.label && styles.textInputError]}
            placeholder={t('newAddress.labelPlaceholder')}
            placeholderTextColor={colors.placeholderGray}
            value={label}
            onChangeText={text => {
              setLabel(text);
              if (errors.label) {
                setErrors(prev => ({ ...prev, label: '' }));
              }
            }}
          />
          {errors.label ? (
            <Text style={styles.errorText}>{errors.label}</Text>
          ) : null}
        </View>

        {/* Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('newAddress.name')}</Text>
          <TextInput
            style={[styles.textInput, errors.name && styles.textInputError]}
            placeholder={t('newAddress.namePlaceholder')}
            placeholderTextColor={colors.placeholderGray}
            value={name}
            onChangeText={text => {
              setName(text);
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: '' }));
              }
            }}
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        {/* Building Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('newAddress.buildingName')}</Text>
          <TextInput
            style={[
              styles.textInput,
              errors.buildingName && styles.textInputError,
            ]}
            placeholder={t('newAddress.buildingNamePlaceholder')}
            placeholderTextColor={colors.placeholderGray}
            value={buildingName}
            onChangeText={text => {
              setBuildingName(text);
              if (errors.buildingName) {
                setErrors(prev => ({ ...prev, buildingName: '' }));
              }
            }}
          />
          {errors.buildingName ? (
            <Text style={styles.errorText}>{errors.buildingName}</Text>
          ) : null}
        </View>

        {/* Apt. number and Floor - Side by Side */}
        <View style={styles.rowFieldsContainer}>
          <View style={[styles.fieldContainer, styles.halfField]}>
            <Text style={styles.fieldLabel}>{t('newAddress.aptNumber')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('newAddress.aptNumberPlaceholder')}
              placeholderTextColor={colors.placeholderGray}
              value={aptNumber}
              onChangeText={setAptNumber}
            />
          </View>

          <View style={[styles.fieldContainer, styles.halfField]}>
            <Text style={styles.fieldLabel}>{t('newAddress.floor')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('newAddress.floorPlaceholder')}
              placeholderTextColor={colors.placeholderGray}
              value={floor}
              onChangeText={setFloor}
            />
          </View>
        </View>

        {/* Street */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('newAddress.street')}</Text>
          <TextInput
            style={[styles.textInput, errors.street && styles.textInputError]}
            placeholder={t('newAddress.streetPlaceholder')}
            placeholderTextColor={colors.placeholderGray}
            value={street}
            onChangeText={text => {
              setStreet(text);
              if (errors.street) {
                setErrors(prev => ({ ...prev, street: '' }));
              }
            }}
          />
          {errors.street ? (
            <Text style={styles.errorText}>{errors.street}</Text>
          ) : null}
        </View>

        {/* Phone Number */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('newAddress.phoneNumber')}</Text>
          <TextInput
            style={[
              styles.textInput,
              errors.phoneNumber && styles.textInputError,
            ]}
            placeholder={t('newAddress.phoneNumberPlaceholder')}
            placeholderTextColor={colors.placeholderGray}
            value={phoneNumber}
            onChangeText={text => {
              setPhoneNumber(text);
              if (errors.phoneNumber) {
                setErrors(prev => ({ ...prev, phoneNumber: '' }));
              }
            }}
            keyboardType="phone-pad"
            maxLength={8}
          />
          {errors.phoneNumber ? (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          ) : null}
        </View>

        {/* Additional Directions */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {t('newAddress.additionalDirections')}
          </Text>
          <TextInput
            style={[
              styles.textInput,
              errors.additionalDirections && styles.textInputError,
            ]}
            placeholder={t('newAddress.additionalDirectionsPlaceholder')}
            placeholderTextColor={colors.placeholderGray}
            value={additionalDirections}
            onChangeText={text => {
              setAdditionalDirections(text);
              if (errors.additionalDirections) {
                setErrors(prev => ({ ...prev, additionalDirections: '' }));
              }
            }}
          />
          {errors.additionalDirections ? (
            <Text style={styles.errorText}>{errors.additionalDirections}</Text>
          ) : null}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            isPending && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? t('newAddress.submit') : t('newAddress.save')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top + sh(8),
    },
    headerRow: {
      position: 'relative',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
    },
    headerContainer: {
      backgroundColor: colors.background,
      paddingRight: sw(100),
    },
    addButton: {
      position: 'absolute',
      right: sw(20),
      top: sh(10),
      minWidth: sw(80),
      paddingHorizontal: sw(20),
      height: sh(44),
      borderRadius: sw(22),
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    addButtonText: {
      color: colors.text,
      fontSize: fs(14),
      fontFamily: colors.fontMedium,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: sw(20),
      paddingTop: sh(20),
      paddingBottom: insets.bottom + sh(32),
    },
    typeToggleContainer: {
      flexDirection: 'row',
      gap: sw(12),
      marginBottom: sh(32),
    },
    typeToggle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sh(10),
      paddingHorizontal: sw(12),
      borderRadius: sw(25),
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.card,
      gap: sw(6),
    },
    typeToggleActive: {
      borderColor: 'transparent',
    },
    typeToggleIcon: {
      width: sw(20),
      height: sw(20),
    },
    typeToggleText: {
      fontSize: fs(14),
    },
    fieldContainer: {
      marginBottom: sh(16),
    },
    fieldLabel: {
      fontSize: fs(14),
      color: colors.text,
      fontFamily: colors.fontMedium,
      marginBottom: sh(6),
    },
    textInput: {
      height: sh(48),
      borderRadius: sw(24),
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: sw(20),
      fontSize: fs(12),
      color: colors.text,
      fontFamily: colors.fontRegular,
    },
    rowFieldsContainer: {
      flexDirection: 'row',
      gap: sw(12),
    },
    halfField: {
      flex: 1,
    },
    saveButton: {
      height: sh(48),
      borderRadius: sw(24),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: sh(24),
    },
    saveButtonText: {
      color: colors.white,
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    textInputError: {
      borderColor: '#FF3B30',
      borderWidth: 1.5,
    },
    errorText: {
      color: '#FF3B30',
      fontSize: fs(12),
      fontFamily: colors.fontRegular,
      marginTop: sh(4),
      marginLeft: sw(4),
    },
  });

export default NewAddressScreen;
