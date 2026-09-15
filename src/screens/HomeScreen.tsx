import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { Images } from '../assets/images';
import { Department } from '../services/api/department';
import { Category } from '../services/api/category';
import { Product } from '../services/api/product';
import {
  useDepartments,
  useProducts,
  useProductsByDepartment,
  useAddToCart,
  useDefaultAddress,
  useSearchProducts,
  useCategories,
  useOffers,
  useNotifications,
  useCart,
} from '../hooks/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { getReadNotificationIds, markNotificationsAsRead } from '../utils/notifications';
import PromoBannersSection from '../components/home/PromoBannersSection';
import CategoriesSection from '../components/home/CategoriesSection';
import ProductsSection from '../components/home/ProductsSection';
import CategoriesCarousel from '../components/home/CategoriesCarousel';

interface HomeScreenProps {
  customerId?: string | number;
  onSearch?: () => void;
  onShowCart?: () => void;
  onShowProductDetail?: (product: Product) => void;
  onShowOfferedProducts?: (offerId: number, offerName: string) => void;
  onShowCategoryProducts?: (categoryId: number, categoryName: string) => void;
  onShowWishlist?: () => void;
  onShowNotification?: () => void;
}

function HomeScreen({
  customerId: propCustomerId,
  onSearch,
  onShowCart,
  onShowProductDetail,
  onShowOfferedProducts,
  onShowCategoryProducts,
  onShowWishlist,
  onShowNotification,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const colors = useTheme();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | undefined
  >(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>(
    propCustomerId ? String(propCustomerId) : undefined,
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([]);
  const { mutateAsync: addToCart } = useAddToCart();

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [productsSectionY, setProductsSectionY] = useState(0);

  // Fetch default address
  const { data: defaultAddressData } = useDefaultAddress(customerId);
  const defaultAddress = defaultAddressData?.data;
  const locationLabel = defaultAddress?.address_type
    ? defaultAddress.address_type.charAt(0).toUpperCase() +
      defaultAddress.address_type.slice(1)
    : 'Home';

  useEffect(() => {
    if (propCustomerId) {
      setCustomerId(String(propCustomerId));
    } else if (!customerId) {
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
    }
  }, [propCustomerId, customerId]);

  const {
    data: departmentsData,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useDepartments();
  const { data: categoriesData, refetch: refetchCategories } = useCategories();
  const {
    data: offersData,
    refetch: refetchOffers,
    isLoading: isLoadingOffers,
  } = useOffers();
  const { data: allProductsData, refetch: refetchProducts } = useProducts();
  const { data: deptProductsData, refetch: refetchDeptProducts } =
    useProductsByDepartment(selectedDepartmentId);
  const { data: searchProductsData, refetch: refetchSearchProducts } =
    useSearchProducts(searchText);
  const {
    data: notificationsData,
    refetch: refetchNotifications,
  } = useNotifications(customerId);

  const today = new Date().toISOString().split('T')[0];
  const { data: cartResponse, refetch: refetchCart } = useCart(
    customerId,
    today,
  );

  const cartProductCount = React.useMemo(() => {
    if (!cartResponse) return 0;
    const directCount =
      (cartResponse?.data as any)?.total_product_count ??
      (cartResponse?.data as any)?.cart?.total_product_count ??
      (cartResponse as any)?.total_product_count;
    if (directCount !== undefined && directCount !== null && directCount !== '') {
      return Number(directCount);
    }
    const cartItems = (cartResponse?.data as any)?.cart?.items;
    if (Array.isArray(cartItems)) {
      return cartItems.reduce(
        (acc: number, item: any) => acc + (parseInt(item.quantity, 10) || 1),
        0,
      );
    }
    return 0;
  }, [cartResponse]);

  const departments = departmentsData?.data || [];
  const categories = categoriesData?.data || [];
  const offers = offersData?.data || [];
  const allNotifications = notificationsData?.data?.notifications || [];

  useEffect(() => {
    const loadReadIds = async () => {
      const ids = await getReadNotificationIds();
      setReadNotificationIds(ids);
    };
    loadReadIds();
  }, [notificationsData]);

  const unreadNotificationCount =
    allNotifications.length > 0
      ? allNotifications.filter(
          n => !n.is_read && !readNotificationIds.map(Number).includes(Number(n.id)),
        ).length
      : notificationsData?.data?.unread_count || 0;

  // Determine which products to show based on search state
  const products =
    searchText.trim().length >= 2
      ? searchProductsData?.data || []
      : selectedDepartmentId
      ? deptProductsData?.products || deptProductsData?.data || []
      : allProductsData?.products || allProductsData?.data || [];

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const handlePromoPress = (offer: any, index: number) => {
    console.log('Promo pressed:', offer, index);
    const offerName = isArabic
      ? offer.name_ar || offer.name_en
      : offer.name_en || offer.name_ar;
    if (onShowOfferedProducts && offer.id && offerName) {
      onShowOfferedProducts(offer.id, offerName);
    }
  };

  const handleCategoryBannerPress = (category: Category) => {
    console.log('Category banner pressed:', category);
    const categoryName = isArabic
      ? category.name_ar || category.name_en
      : category.name_en || category.name_ar;
    if (onShowCategoryProducts && category.id && categoryName) {
      onShowCategoryProducts(category.id, categoryName);
    }
  };

  const handleCategoryPress = (index: number) => {
    const dept = departments[index];
    if (dept) {
      if (selectedDepartmentId === dept.id) {
        // Deselect if already selected
        setSelectedDepartmentId(undefined);
      } else {
        setSelectedDepartmentId(dept.id);
      }
    }
  };

  const handleNotificationPress = async () => {
    if (allNotifications.length > 0) {
      const ids = allNotifications.map(n => n.id);
      const updated = await markNotificationsAsRead(ids);
      setReadNotificationIds(updated);
    }

    if (customerId) {
      queryClient.setQueryData(['notifications', customerId], (prev: any) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            unread_count: 0,
            notifications: (prev.data.notifications || []).map((n: any) => ({
              ...n,
              is_read: true,
            })),
          },
        };
      });
    }

    onShowNotification?.();
  };

  const handleProductPress = (product: Product) => {
    console.log('Product pressed:', product);
    if (onShowProductDetail) {
      onShowProductDetail(product);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDepartments(),
      refetchCategories(),
      refetchOffers(),
      refetchProducts(),
      refetchNotifications(),
      refetchCart(),
      selectedDepartmentId ? refetchDeptProducts() : Promise.resolve(),
      searchText.trim().length >= 2 ? refetchSearchProducts() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8A00']}
            tintColor="#FF8A00"
          />
        }
      >
        {/* Orange Header Area */}
        <ImageBackground
          source={Images.homescreenBg}
          style={styles.headerArea}
          imageStyle={{
            borderBottomLeftRadius: sw(24),
            borderBottomRightRadius: sw(24),
          }}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.locationChip}
              activeOpacity={0.7}
              onPress={() => setShowAddressModal(true)}
            >
              <View style={styles.locationIconCircle}>
                <Image
                  source={Images.location}
                  style={styles.locationIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.locationText}>{locationLabel}</Text>
              <Image
                source={Images.arrowRight}
                style={styles.arrowIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={onShowWishlist}
              >
                <Image
                  source={Images.heart}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={handleNotificationPress}
              >
                <Image
                  source={Images.notification}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
                {unreadNotificationCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 99
                        ? '99+'
                        : unreadNotificationCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={onShowCart}
              >
                <Image
                  source={Images.bag}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
                {cartProductCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {cartProductCount > 99 ? '99+' : cartProductCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.headerTitle}>{t('home.mealTitle')}</Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <TouchableOpacity
              onPress={() => {
                if (searchText.trim().length >= 2 && productsSectionY > 0) {
                  scrollViewRef.current?.scrollTo({
                    y: productsSectionY,
                    animated: true,
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <Image
                source={Images.search}
                style={styles.searchIconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={colors.textPlaceholder}
              value={searchText}
              returnKeyType="search"
              onChangeText={text => {
                setSearchText(text);
                // Clear department selection when searching
                if (text.trim() !== '' && selectedDepartmentId) {
                  setSelectedDepartmentId(undefined);
                }
              }}
              onSubmitEditing={() => {
                if (searchText.trim().length >= 2 && productsSectionY > 0) {
                  scrollViewRef.current?.scrollTo({
                    y: productsSectionY,
                    animated: true,
                  });
                }
              }}
            />
          </View>
        </ImageBackground>

        {/* Categories Carousel */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>{t('home.preBook')}</Text>
          <CategoriesCarousel
            categories={categories}
            onCategoryPress={handleCategoryBannerPress}
          />
        </View>

        {/* Promo Banners */}
        <PromoBannersSection offers={offers} onPromoPress={handlePromoPress} />

        {/* Categories Section */}
        <CategoriesSection
          departments={departments}
          onCategoryPress={handleCategoryPress}
          selectedDepartmentId={selectedDepartmentId}
        />

        {/* Products Section */}
        <View
          onLayout={event => {
            const { y } = event.nativeEvent.layout;
            setProductsSectionY(y);
          }}
        >
          <ProductsSection
            products={products}
            onProductPress={handleProductPress}
            onShowCart={onShowCart}
            onAddPress={async product => {
              const customerId = await AsyncStorage.getItem('customerId');
              const token = await AsyncStorage.getItem('userToken');
              console.log('Customer ID:', customerId);
              console.log('Token:', token);
              if (customerId) {
                const today = new Date().toISOString().split('T')[0];
                try {
                  await addToCart({
                    customerId,
                    productId: product.id.toString(),
                    quantity: '1',
                    preorderDate: today,
                  });
                } catch (err: any) {
                  Toast.show({
                    type: 'error',
                    text1: 'Add to cart failed',
                    text2: err?.message || 'Unknown error',
                    visibilityTime: 5000,
                  });
                }
              }
            }}
          />
        </View>
      </ScrollView>

      {/* Address Details Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddressModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalLocationRow}>
                <Image
                  source={Images.location}
                  style={styles.modalLocationIcon}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>
                  {defaultAddress?.address_type
                    ? defaultAddress.address_type.charAt(0).toUpperCase() +
                      defaultAddress.address_type.slice(1)
                    : 'Location'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {defaultAddress && (
              <View style={styles.addressDetails}>
                {defaultAddress.name && (
                  <Text style={styles.addressName}>{defaultAddress.name}</Text>
                )}
                {defaultAddress.formatted_address && (
                  <Text style={styles.addressLine}>
                    {defaultAddress.formatted_address}
                  </Text>
                )}
                {defaultAddress.phone_no && (
                  <Text style={styles.addressPhone}>
                    Phone: {defaultAddress.phone_no}
                  </Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: insets.bottom + sh(20),
    },
    headerArea: {
      paddingHorizontal: sw(20),
      paddingTop: insets.top + sh(10),
      paddingBottom: sh(20),
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sh(20),
    },
    locationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFDDB3',
      paddingLeft: sw(6),
      paddingRight: sw(16),
      paddingVertical: sh(4),
      borderRadius: sw(28),
      gap: sw(8),
    },
    locationIconCircle: {
      width: sw(43),
      height: sw(43),
      borderRadius: sw(100),
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationIcon: {
      width: sw(40),
      height: sw(40),
    },
    locationText: {
      fontSize: fs(14),
      color: colors.darkBrown,
      fontFamily: colors.fontMedium,
    },
    arrowIcon: {
      width: sw(12),
      height: sw(12),
      tintColor: colors.darkBrown,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: sw(10),
    },
    iconBtn: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(20),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -sw(2),
      right: -sw(2),
      backgroundColor: '#FF3B30',
      minWidth: sw(18),
      height: sw(18),
      borderRadius: sw(9),
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sw(4),
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      zIndex: 1,
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: fs(9),
      fontFamily: colors.fontBold,
      lineHeight: fs(11),
      textAlign: 'center',
    },
    headerIcon: {
      width: sw(20),
      height: sw(20),
    },
    headerTitle: {
      fontSize: fs(31),
      lineHeight: fs(36),
      color: colors.darkBrown,
      marginBottom: sh(10),
      fontFamily: colors.fontBold,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: sw(50),
      paddingHorizontal: sw(16),
      paddingVertical: sh(12),
      marginTop: sh(24),
      backgroundColor: colors.inputBackground || colors.card,
    },
    searchIconImage: { width: sw(18), height: sw(18), marginRight: sw(8) },
    searchInput: {
      flex: 1,
      fontSize: fs(14),
      padding: 0,
      color: colors.text,
      fontFamily: colors.fontRegular,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-start',
      paddingTop: insets.top + sh(60),
      paddingHorizontal: sw(20),
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: sw(16),
      padding: sw(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sh(16),
    },
    modalLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sw(8),
    },
    modalLocationIcon: {
      width: sw(20),
      height: sw(20),
      tintColor: '#FF7B00',
    },
    modalTitle: {
      fontSize: fs(18),
      fontFamily: colors.fontSemiBold,
      color: colors.darkBrown,
    },
    closeButton: {
      fontSize: fs(24),
      color: '#666',
      fontFamily: colors.fontRegular,
    },
    addressDetails: {
      gap: sh(8),
    },
    addressName: {
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
      color: colors.darkBrown,
    },
    addressLine: {
      fontSize: fs(14),
      fontFamily: colors.fontRegular,
      color: '#666',
      lineHeight: fs(20),
    },
    addressPhone: {
      fontSize: fs(14),
      fontFamily: colors.fontMedium,
      color: '#666',
    },
    categoriesSection: {
      paddingHorizontal: sw(20),
      paddingTop: sh(12),
      paddingBottom: sh(8),
    },
    sectionTitle: {
      fontSize: fs(20),
      marginBottom: sh(16),
      color: colors.text,
      fontFamily: colors.fontBold,
      letterSpacing: 0.5,
    },
  });

export default HomeScreen;
