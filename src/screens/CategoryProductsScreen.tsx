import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import {
  useCategoryProducts,
  useAddToCart,
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
  useCart,
} from '../hooks/queries';
import { fs, sw, sh } from '../utils/responsive';
import { BASE_URL } from '../constants/api';
import { Product } from '../services/api/product';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Header from '../components/common/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images } from '../assets/images';

interface CategoryProductsScreenProps {
  categoryId: number;
  categoryName: string;
  onBack: () => void;
  onShowProductDetail: (product: Product) => void;
  onShowCart?: () => void;
}

function CategoryProductsScreen({
  categoryId,
  categoryName,
  onBack,
  onShowProductDetail,
  onShowCart,
}: CategoryProductsScreenProps) {
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const { mutateAsync: addToCart } = useAddToCart();
  const { data, isLoading, error, refetch } = useCategoryProducts(categoryId);
  const { data: wishlistData } = useWishlist(customerId);
  const { mutateAsync: addToWishlist } = useAddToWishlist();
  const { mutateAsync: removeFromWishlist } = useRemoveFromWishlist();
  const { data: cartResponse } = useCart(customerId, today);

  const cartItems: any[] = React.useMemo(() => {
    const cartData = (cartResponse?.data as any)?.cart;
    if (cartData?.items && Array.isArray(cartData.items)) {
      return cartData.items;
    }
    if (Array.isArray(cartResponse?.data)) {
      return cartResponse.data;
    }
    return [];
  }, [cartResponse]);

  const cartProductIds = React.useMemo(
    () => new Set(cartItems.map((item: any) => String(item.product_id))),
    [cartItems],
  );

  const isInCart = (productId: number | string) =>
    cartProductIds.has(String(productId));

  const wishlistItems = React.useMemo(() => {
    if (!wishlistData) return [];
    if (Array.isArray(wishlistData.data)) {
      return wishlistData.data;
    }
    if (wishlistData.data?.items && Array.isArray(wishlistData.data.items)) {
      return wishlistData.data.items;
    }
    return [];
  }, [wishlistData]);

  const wishlistProductIds = React.useMemo(
    () => new Set(wishlistItems.map((item: any) => item.product_id)),
    [wishlistItems],
  );

  useEffect(() => {
    const getCustomerId = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) setCustomerId(id);
    };
    getCustomerId();
  }, []);

  const categoryProducts = data?.data || [];
  const categoryInfo = data?.category;

  const isArabic = i18n.language?.startsWith('ar');
  const title = isArabic
    ? categoryInfo?.name_ar || categoryName
    : categoryInfo?.name_en || categoryName;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleWishlistToggle = async (productId: number) => {
    if (!customerId) {
      Toast.show({
        type: 'error',
        text1: 'Please login first',
        text2: 'You need to be logged in to manage your wishlist',
      });
      return;
    }

    const isInWishlist = wishlistProductIds.has(productId);
    try {
      if (isInWishlist) {
        await removeFromWishlist({
          customerId,
          productId: productId.toString(),
        });
      } else {
        await addToWishlist({
          customerId,
          productId: productId.toString(),
        });
      }
    } catch (err: any) {
      console.log('Wishlist error:', err);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (
      product.status === 0 ||
      product.product_status === 0
    ) {
      return;
    }

    if (!customerId) {
      Toast.show({
        type: 'error',
        text1: 'Please login first',
        text2: 'You need to be logged in to add items to cart',
      });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await addToCart({
        customerId,
        productId: product.id.toString(),
        quantity: '1',
        preorderDate: today,
      });
      const prodName = isArabic
        ? product.name_ar || product.name_en
        : product.name_en || product.name_ar;
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${prodName}`,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add to cart',
        text2: err?.message || 'Unknown error',
      });
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = `${BASE_URL}${item.image}`;
    const isInWishlist = wishlistProductIds.has(item.id);
    const isOutOrInactive =
      item.status === 0 || item.product_status === 0;
    const disabled = isOutOrInactive;

    const hasOffer =
      item.offer != null &&
      item.offer.offer_price != null &&
      item.offer.offer_price !== '';
    const offerPrice = hasOffer ? item.offer!.offer_price : null;
    const isDiscounted =
      offerPrice && parseFloat(offerPrice) < parseFloat(item.price);

    const getDisabledLabel = () => {
      return t('common.unavailable');
    };

    return (
      <TouchableOpacity
        style={[styles.productCard, disabled && styles.productCardDisabled]}
        activeOpacity={disabled ? 0.95 : 0.8}
        disabled={isOutOrInactive}
        onPress={() => {
          if (isOutOrInactive) {
            return;
          }
          onShowProductDetail(item);
        }}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.productImage, disabled && styles.productImageDisabled]}
            resizeMode="cover"
          />
          {disabled && (
            <View style={styles.closedImageOverlay}>
              <View style={styles.closedOverlayTag}>
                <Text style={styles.closedOverlayTagText}>
                  {getDisabledLabel()}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.heartIconBtn}
            onPress={() => handleWishlistToggle(item.id)}
            activeOpacity={0.7}
          >
            <Image
              source={isInWishlist ? Images.heartFilled : Images.heart}
              style={[
                styles.heartIcon,
                isInWishlist && styles.heartIconFilled,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text
            style={[styles.productName, disabled && styles.productNameDisabled]}
            numberOfLines={1}
          >
            {isArabic ? item.name_ar || item.name_en : item.name_en || item.name_ar}
          </Text>

          <Text style={styles.productCategory}>
            {isArabic
              ? item.department?.name_ar || item.department?.name_en || ''
              : item.department?.name_en || item.department?.name_ar || 'Category'}
          </Text>

          {(item.preparation_time_formatted ||
            item.preparation_time_minutes) && (
            <View style={styles.preparationTimeRow}>
              <Text style={styles.timerIcon}>⏱</Text>
              <Text style={styles.preparationTimeText}>
                {item.preparation_time_formatted ||
                  `${item.preparation_time_minutes} mins`}
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <View style={styles.priceWrapper}>
              {isDiscounted ? (
                <>
                  <Text
                    style={[
                      styles.productPrice,
                      disabled && styles.productPriceDisabled,
                    ]}
                  >
                    {parseFloat(offerPrice!).toFixed(2)} QAR
                  </Text>
                  <Text style={styles.originalPrice}>
                    {parseFloat(item.price).toFixed(2)} QAR
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.productPrice,
                    disabled && styles.productPriceDisabled,
                  ]}
                >
                  {parseFloat(item.price).toFixed(2)} QAR
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                disabled && styles.addButtonDisabled,
              ]}
              disabled={disabled}
              activeOpacity={disabled ? 1 : 0.8}
              onPress={() => {
                if (isOutOrInactive) {
                  return;
                }
                if (isInCart(item.id)) {
                  onShowCart?.();
                } else {
                  handleAddToCart(item);
                }
              }}
            >
              <Text style={styles.addButtonText}>
                {isInCart(item.id) ? t('home.viewInCart') : t('home.orderNow')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={title}
          onBack={onBack}
          containerStyle={{
            backgroundColor: colors.background,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={title}
          onBack={onBack}
          containerStyle={{
            backgroundColor: colors.background,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load products</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={title}
        onBack={onBack}
        containerStyle={{
          backgroundColor: colors.background,
          paddingBottom: sh(16),
          paddingTop: insets.top + sh(12),
        }}
      />

      <FlatList
        data={categoryProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No products available in this category</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    closedBanner: {
      backgroundColor: '#FFF4E5',
      borderRadius: sw(16),
      paddingHorizontal: sw(16),
      paddingVertical: sh(14),
      marginBottom: sh(16),
      borderWidth: 1,
      borderColor: '#FFE0B2',
    },
    closedBannerContent: {
      flex: 1,
    },
    closedBadgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: '#E65100',
      paddingHorizontal: sw(10),
      paddingVertical: sh(3),
      borderRadius: sw(12),
      marginBottom: sh(6),
      gap: sw(6),
    },
    closedDot: {
      width: sw(6),
      height: sw(6),
      borderRadius: sw(3),
      backgroundColor: '#FFFFFF',
    },
    closedPillText: {
      color: '#FFFFFF',
      fontSize: fs(11),
      fontFamily: colors.fontBold,
    },
    closedBannerTitle: {
      fontSize: fs(13),
      color: '#5D4037',
      fontFamily: colors.fontMedium,
      lineHeight: fs(18),
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sw(20),
      paddingVertical: sh(40),
    },
    listContent: {
      paddingHorizontal: sw(16),
      paddingTop: sh(10),
      paddingBottom: sh(30),
    },
    columnWrapper: {
      justifyContent: 'space-between',
      gap: sw(12),
    },
    productCard: {
      width: (sw(375) - sw(44)) / 2,
      backgroundColor: colors.card,
      borderRadius: sw(16),
      marginBottom: sh(16),
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderSubtle || '#F0F0F0',
    },
    productCardDisabled: {
      opacity: 0.85,
    },
    imageWrapper: {
      width: '100%',
      height: sw(130),
      backgroundColor: '#f5f5f5',
      position: 'relative',
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    productImageDisabled: {
      opacity: 0.7,
    },
    closedImageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sw(8),
    },
    closedOverlayTag: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: sw(8),
      paddingVertical: sh(4),
      borderRadius: sw(6),
    },
    closedOverlayTagText: {
      color: '#FFFFFF',
      fontSize: fs(10),
      fontFamily: colors.fontSemiBold,
      textAlign: 'center',
    },
    heartIconBtn: {
      position: 'absolute',
      top: sw(8),
      right: sw(8),
      width: sw(30),
      height: sw(30),
      borderRadius: sw(15),
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    heartIcon: {
      width: sw(16),
      height: sw(16),
      tintColor: '#888888',
    },
    heartIconFilled: {
      tintColor: '#FF3B30',
    },
    productInfo: {
      padding: sw(10),
    },
    productName: {
      fontSize: fs(13),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
      marginBottom: sh(2),
    },
    productNameDisabled: {
      color: colors.textSecondary,
    },
    productCategory: {
      fontSize: fs(11),
      color: colors.textMuted || '#888888',
      fontFamily: colors.fontRegular,
      marginBottom: sh(4),
    },
    preparationTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sw(4),
      marginBottom: sh(6),
    },
    timerIcon: {
      fontSize: fs(10),
    },
    preparationTimeText: {
      fontSize: fs(10),
      color: colors.textMuted || '#888888',
      fontFamily: colors.fontMedium,
    },
    priceRow: {
      marginTop: sh(4),
      gap: sh(6),
    },
    priceWrapper: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: sw(6),
    },
    productPrice: {
      fontSize: fs(14),
      color: colors.primary,
      fontFamily: colors.fontBold,
    },
    productPriceDisabled: {
      color: colors.textSecondary,
    },
    originalPrice: {
      fontSize: fs(11),
      color: colors.textMuted || '#888888',
      fontFamily: colors.fontRegular,
      textDecorationLine: 'line-through',
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingVertical: sh(6),
      paddingHorizontal: sw(10),
      borderRadius: sw(8),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: sh(2),
    },
    addButtonDisabled: {
      backgroundColor: '#CCCCCC',
    },
    addButtonText: {
      fontSize: fs(11),
      color: '#FFFFFF',
      fontFamily: colors.fontBold,
    },
    errorText: {
      fontSize: fs(15),
      color: '#FF3B30',
      fontFamily: colors.fontMedium,
      textAlign: 'center',
      marginBottom: sh(16),
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingVertical: sh(10),
      paddingHorizontal: sw(24),
      borderRadius: sw(8),
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
    },
    emptyText: {
      fontSize: fs(15),
      color: colors.textMuted || '#888888',
      fontFamily: colors.fontMedium,
      textAlign: 'center',
    },
  });

export default CategoryProductsScreen;
