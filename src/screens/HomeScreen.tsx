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
} from '../hooks/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrebookFoodSection from '../components/home/PrebookFoodSection';
import PromoBannersSection from '../components/home/PromoBannersSection';
import CategoriesSection from '../components/home/CategoriesSection';
import ProductsSection from '../components/home/ProductsSection';

interface HomeScreenProps {
  onSearch?: () => void;
  onShowCart?: () => void;
}

function HomeScreen({ onSearch, onShowCart }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | undefined
  >(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const { mutateAsync: addToCart } = useAddToCart();

  const {
    data: departmentsData,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useDepartments();
  const { data: allProductsData, refetch: refetchProducts } = useProducts();
  const { data: deptProductsData, refetch: refetchDeptProducts } =
    useProductsByDepartment(selectedDepartmentId);

  const departments = departmentsData?.data || [];
  const products = selectedDepartmentId
    ? deptProductsData?.products || deptProductsData?.data || []
    : allProductsData?.products || allProductsData?.data || [];

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const handleFoodItemPress = (index: number) => {
    console.log('Food item pressed:', index);
  };

  const handlePromoPress = (index: number) => {
    console.log('Promo pressed:', index);
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDepartments(),
      refetchProducts(),
      selectedDepartmentId ? refetchDeptProducts() : Promise.resolve(),
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
            <View style={styles.locationChip}>
              <View style={styles.locationIconCircle}>
                <Image
                  source={Images.location}
                  style={styles.locationIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.locationText}>Home</Text>
              <Image
                source={Images.arrowRight}
                style={styles.arrowIcon}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                <Image
                  source={Images.heart}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onShowCart}>
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
              onChangeText={setSearchText}
            />
          </View>
        </ImageBackground>

        {/* Prebook Favourite Food */}
        <PrebookFoodSection onItemPress={handleFoodItemPress} />

        {/* Promo Banners */}
        <PromoBannersSection onPromoPress={handlePromoPress} />

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
          onAddPress={async (product) => {
            const customerId = await AsyncStorage.getItem('customerId');
            if (customerId) {
              const today = new Date().toISOString().split('T')[0];
              await addToCart({
                customerId,
                productId: product.id.toString(),
                quantity: '1',
                preorderDate: today,
              });
              if (onShowCart) onShowCart();
            }
          }}
        />
      </ScrollView>
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
      paddingBottom: sh(40),
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
      backgroundColor: '#FFFFFF',
      paddingHorizontal: sw(12),
      paddingVertical: sh(8),
      borderRadius: sw(20),
      gap: sw(8),
    },
    locationIconCircle: {
      width: sw(24),
      height: sw(24),
      borderRadius: sw(12),
      backgroundColor: '#FF7B00',
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationIcon: {
      width: sw(12),
      height: sw(12),
      tintColor: '#FFFFFF',
    },
    locationText: {
      fontSize: fs(12),
      color: '#3B2B20',
      fontFamily: colors.fontSemiBold,
    },
    arrowIcon: {
      width: sw(12),
      height: sw(12),
      tintColor: '#3B2B20',
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
      backgroundColor: '#FFFFFF',
    },
    headerIcon: {
      width: sw(20),
      height: sw(20),
    },
    headerTitle: {
      fontSize: fs(31),
      lineHeight: fs(36),
      color: '#3B2B20',
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
      backgroundColor: '#FFFFFF',
    },
    searchIconImage: { width: sw(18), height: sw(18), marginRight: sw(8) },
    searchInput: {
      flex: 1,
      fontSize: fs(14),
      padding: 0,
      color: '#1E1E1E',
      fontFamily: colors.fontRegular,
    },
  });

export default HomeScreen;
