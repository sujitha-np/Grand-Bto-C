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
} from '../hooks/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import PromoBannersSection from '../components/home/PromoBannersSection';
import CategoriesSection from '../components/home/CategoriesSection';
import ProductsSection from '../components/home/ProductsSection';
import CategoriesCarousel from '../components/home/CategoriesCarousel';

interface HomeScreenProps {
  onSearch?: () => void;
  onShowCart?: () => void;
  onShowProductDetail?: (product: Product) => void;
  onShowOfferedProducts?: (offerId: number, offerName: string) => void;
  onShowWishlist?: () => void;
}

function HomeScreen({
  onSearch,
  onShowCart,
  onShowProductDetail,
  onShowOfferedProducts,
  onShowWishlist,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | undefined
  >(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const { mutateAsync: addToCart } = useAddToCart();

  // Fetch default address
  const { data: defaultAddressData } = useDefaultAddress(customerId);
  const defaultAddress = defaultAddressData?.data;
  const locationLabel = defaultAddress?.address_type
    ? defaultAddress.address_type.charAt(0).toUpperCase() +
      defaultAddress.address_type.slice(1)
    : 'Home';

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

  const departments = departmentsData?.data || [];
  const categories = categoriesData?.data || [];
  const offers = offersData?.data || [];

  console.log('HomeScreen - isLoadingOffers:', isLoadingOffers);
  console.log('HomeScreen - offersData:', offersData);
  console.log('HomeScreen - offers:', offers);
  console.log('HomeScreen - offers length:', offers.length);

  // Determine which products to show based on search state
  const products =
    searchText.trim() !== ''
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
    if (onShowOfferedProducts && offer.id && offer.name_en) {
      onShowOfferedProducts(offer.id, offer.name_en);
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
      selectedDepartmentId ? refetchDeptProducts() : Promise.resolve(),
      searchText.trim() !== '' ? refetchSearchProducts() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />

      <ScrollView
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
                onPress={onShowCart}
              >
                <Image
                  source={Images.bag}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.headerTitle}>{t('home.mealTitle')}</Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Image
              source={Images.search}
              style={styles.searchIconImage}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={colors.textPlaceholder}
              value={searchText}
              onChangeText={text => {
                setSearchText(text);
                // Clear department selection when searching
                if (text.trim() !== '' && selectedDepartmentId) {
                  setSelectedDepartmentId(undefined);
                }
              }}
            />
          </View>
        </ImageBackground>

        {/* Categories Carousel */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>{t('home.preBook')}</Text>
          <CategoriesCarousel categories={categories} />
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
        <ProductsSection
          products={products}
          onProductPress={handleProductPress}
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
                if (onShowCart) onShowCart();
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
