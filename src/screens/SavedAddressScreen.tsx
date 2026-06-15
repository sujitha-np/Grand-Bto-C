import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Header from '../components/common/Header';
import { useSavedAddresses, useSetDefaultAddress } from '../hooks/queries';
import { useTheme } from '../hooks/useTheme';
import { SavedAddress } from '../services/api/address';
import { fs, sh, sw } from '../utils/responsive';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('SavedAddressScreen ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface SavedAddressScreenProps {
  onBack: () => void;
  totalAmount: number;
  selectedDate?: string;
  onAddNew?: () => void;
  onEditAddress?: (address: SavedAddress) => void;
  onProceedToCheckout?: (address: SavedAddress) => void;
}

const formatAddressTitle = (address: SavedAddress) => {
  const rawTitle = address.address_type || address.label || 'Address';
  return rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
};

const formatAddressLine = (address: SavedAddress) => {
  if (address.formatted_address) {
    return address.formatted_address;
  }

  return [
    address.zone,
    address.street,
    address.building,
    address.apartment,
    address.floor,
    address.flat,
    address.additional_directions,
  ]
    .filter(Boolean)
    .join(', ');
};

function SavedAddressScreen({
  onBack,
  totalAmount,
  selectedDate,
  onAddNew,
  onEditAddress,
  onProceedToCheckout,
}: SavedAddressScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [customerId, setCustomerId] = useState<string>();
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(
    null,
  );
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  useEffect(() => {
    const loadCustomerId = async () => {
      try {
        const storedCustomerId = await AsyncStorage.getItem('customerId');
        if (storedCustomerId) {
          setCustomerId(storedCustomerId);
        }
      } catch (error) {
        console.error('Error loading customerId:', error);
        setHasError(true);
        setErrorMessage('Failed to load customer data');
      }
    };

    loadCustomerId();
  }, []);

  const {
    data: addressResponse,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useSavedAddresses(customerId);

  const setDefaultMutation = useSetDefaultAddress();

  const addresses = addressResponse?.data ?? [];

  const handleSetDefault = (address: SavedAddress) => {
    if (!customerId) return;
    setDefaultMutation.mutate({
      addressId: address.id.toString(),
      customerId: customerId,
    });
  };

  // Log for debugging
  console.log('SavedAddressScreen - customerId:', customerId);
  console.log('SavedAddressScreen - addresses:', addresses);
  console.log('SavedAddressScreen - error:', error);

  if (!customerId) {
    return (
      <View style={styles.container}>
        <Header
          title={t('address.title')}
          onBack={onBack}
          containerStyle={styles.headerContainer}
        />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Loading customer data...</Text>
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.container}>
        <Header
          title={t('address.title')}
          onBack={onBack}
          containerStyle={styles.headerContainer}
        />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <View style={styles.container}>
          <Header
            title={t('address.title')}
            onBack={onBack}
            containerStyle={styles.headerContainer}
          />
          <View style={styles.centerState}>
            <Text style={styles.errorText}>Something went wrong</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onBack}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Header
            title={t('address.title')}
            onBack={onBack}
            containerStyle={styles.headerContainer}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addButton}
            onPress={onAddNew}
          >
            <Text style={styles.addButtonText}>{t('address.add')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && !isRefetching ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null}

          {isError ? (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>
                {error instanceof Error
                  ? error.message
                  : 'Failed to load addresses'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>{t('address.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isLoading && !isError && addresses.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>{t('address.empty')}</Text>
            </View>
          ) : null}

          {!isLoading && !isError
            ? addresses.map(address => {
                const phoneNumber = address.phone_no || address.phone || '-';
                const isSelected = selectedAddress?.id === address.id;
                const isDefault = address.is_default === 1;
                return (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      isSelected && styles.addressCardSelected,
                    ]}
                    onPress={() => setSelectedAddress(address)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addressTitleRow}>
                      <View style={styles.titleWithBadge}>
                        <Text style={styles.addressTitle}>
                          {formatAddressTitle(address)}
                        </Text>
                        {isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>
                              {t('address.default')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.actionButtons}>
                        {!isDefault && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleSetDefault(address)}
                            style={styles.setDefaultButton}
                            disabled={setDefaultMutation.isPending}
                          >
                            <Text style={styles.setDefaultButtonText}>
                              {t('address.setDefault')}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => onEditAddress?.(address)}
                          style={styles.editButton}
                        >
                          <Text style={styles.editIcon}>✎</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.addressName}>
                      {address.name || address.label || '-'}
                    </Text>
                    <Text style={styles.addressLine}>
                      {formatAddressLine(address)}
                    </Text>
                    <Text style={styles.addressPhone}>
                      {t('address.phone')}: {phoneNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })
            : null}
        </ScrollView>

        {/* Proceed Button */}
        {selectedAddress && (
          <View style={styles.proceedContainer}>
            <TouchableOpacity
              style={[
                styles.proceedButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => onProceedToCheckout?.(selectedAddress)}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedButtonText}>
                {t('savedAddress.proceed')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ErrorBoundary>
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
    },
    headerContainer: {
      backgroundColor: colors.background,
      paddingRight: sw(120),
    },
    addButton: {
      position: 'absolute',
      right: sw(20),
      top: sh(10),
      minWidth: sw(100),
      paddingHorizontal: sw(24),
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
      paddingTop: sh(16),
      paddingBottom: insets.bottom + sh(32),
      gap: sh(16),
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaLabel: {
      color: colors.textMuted,
      fontSize: fs(13),
      fontFamily: colors.fontRegular,
    },
    metaValue: {
      color: colors.text,
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
    },
    centerState: {
      minHeight: sh(120),
      alignItems: 'center',
      justifyContent: 'center',
      gap: sh(12),
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: fs(14),
      fontFamily: colors.fontRegular,
      textAlign: 'center',
    },
    errorText: {
      color: colors.text,
      fontSize: fs(14),
      fontFamily: colors.fontRegular,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: sw(18),
      paddingVertical: sh(10),
      borderRadius: sw(20),
      backgroundColor: colors.primary,
    },
    retryButtonText: {
      color: colors.white,
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
    },
    addressCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: sw(24),
      paddingHorizontal: sw(20),
      paddingVertical: sh(18),
      backgroundColor: colors.card,
    },
    addressTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: sh(10),
      gap: sw(8),
    },
    titleWithBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: sw(8),
    },
    defaultBadge: {
      paddingHorizontal: sw(12),
      paddingVertical: sh(5),
      borderRadius: sw(16),
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    defaultBadgeText: {
      color: colors.white,
      fontSize: fs(11),
      fontFamily: colors.fontSemiBold,
      letterSpacing: 0.3,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sw(8),
    },
    setDefaultButton: {
      paddingHorizontal: sw(12),
      paddingVertical: sh(6),
      borderRadius: sw(16),
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.background,
    },
    setDefaultButtonText: {
      color: colors.primary,
      fontSize: fs(11),
      fontFamily: colors.fontSemiBold,
    },
    addressTitle: {
      color: colors.text,
      fontSize: fs(17),
      fontFamily: colors.fontSemiBold,
      flexShrink: 1,
    },
    editButton: {
      width: sw(32),
      height: sw(32),
      borderRadius: sw(16),
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    editIcon: {
      color: colors.primary,
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
    },
    addressChevron: {
      color: colors.text,
      fontSize: fs(18),
      fontFamily: colors.fontMedium,
      lineHeight: fs(18),
    },
    addressName: {
      color: colors.text,
      fontSize: fs(15),
      fontFamily: colors.fontMedium,
      marginBottom: sh(6),
    },
    addressLine: {
      color: colors.textMuted,
      fontSize: fs(13),
      fontFamily: colors.fontRegular,
      marginBottom: sh(2),
    },
    addressPhone: {
      color: colors.textMuted,
      fontSize: fs(13),
      fontFamily: colors.fontRegular,
    },
    addressCardSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.primaryLight || '#FFF8F2',
    },
    proceedContainer: {
      padding: sw(20),
      paddingBottom: insets.bottom + sh(20),
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    proceedButton: {
      height: sh(52),
      borderRadius: sw(26),
      alignItems: 'center',
      justifyContent: 'center',
    },
    proceedButtonText: {
      color: colors.white,
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
    },
  });

export default SavedAddressScreen;
