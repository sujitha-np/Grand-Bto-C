import React, { useState, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';
import { Product } from '../../services/api/product';
import { BASE_URL } from '../../constants/api';
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
  useCart,
} from '../../hooks/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { Images } from '../../assets/images';

interface ProductsSectionProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  onAddPress?: (product: Product) => void;
  onShowCart?: () => void;
}

function ProductsSection({
  products,
  onProductPress,
  onAddPress,
  onShowCart,
}: ProductsSectionProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const today = new Date().toISOString().split('T')[0];

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

  // Handle different possible response structures
  const wishlistItems = React.useMemo(() => {
    if (!wishlistData) return [];

    // Check if data is an array directly
    if (Array.isArray(wishlistData.data)) {
      return wishlistData.data;
    }

    // Check if data.items exists (based on API response structure)
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

  const handleWishlistToggle = async (productId: number) => {
    if (!customerId) {
      console.log('No customerId, cannot toggle wishlist');
      return;
    }

    const isInWishlist = wishlistProductIds.has(productId);
    console.log(
      `Toggling wishlist for product ${productId}, currently in wishlist: ${isInWishlist}`,
    );

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
      console.log('Wishlist toggle completed');
    } catch (error) {
      // Error toast is handled by the mutation hooks
      console.log('Wishlist toggle error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {products.map(product => {
          const imageUrl = `${BASE_URL}${product.image}`;
          const isInWishlist = wishlistProductIds.has(product.id);
          const isOutOrInactive =
            product.status === 0 || product.product_status === 0;
          const disabled = isOutOrInactive;

          const getDisabledLabel = () => {
            return t('common.unavailable');
          };

          return (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productCard,
                disabled && styles.productCardDisabled,
              ]}
              activeOpacity={disabled ? 0.95 : 0.8}
              disabled={isOutOrInactive}
              onPress={() => {
                if (isOutOrInactive) {
                  return;
                }
                onProductPress?.(product);
              }}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: imageUrl }}
                  style={[
                    styles.productImage,
                    disabled && styles.productImageDisabled,
                  ]}
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
                  onPress={() => handleWishlistToggle(product.id)}
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
                  style={[
                    styles.productName,
                    disabled && styles.productNameDisabled,
                  ]}
                  numberOfLines={1}
                >
                  {isArabic
                    ? product.name_ar || product.name_en
                    : product.name_en || product.name_ar}
                </Text>
                <Text style={styles.productCategory}>
                  {isArabic
                    ? product.department?.name_ar || product.department?.name_en || ''
                    : product.department?.name_en || product.department?.name_ar || 'Category'}
                </Text>
                {(product.preparation_time_formatted ||
                  product.preparation_time_minutes) && (
                  <View style={styles.preparationTimeRow}>
                    <Text style={styles.timerIcon}>⏱</Text>
                    <Text style={styles.preparationTimeText}>
                      {product.preparation_time_formatted ||
                        `${product.preparation_time_minutes} mins`}
                    </Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <View style={styles.priceWrapper}>
                    {(() => {
                      const hasOffer =
                        product.offer != null &&
                        product.offer.offer_price != null &&
                        product.offer.offer_price !== '';
                      if (hasOffer) {
                        const offerPrice = product.offer!.offer_price;
                        const originalPrice = product.price;
                        const isDiscounted =
                          parseFloat(offerPrice) < parseFloat(originalPrice);
                        if (isDiscounted) {
                          return (
                            <>
                              <Text
                                style={[
                                  styles.productPrice,
                                  disabled && styles.productPriceDisabled,
                                ]}
                              >
                                {parseFloat(offerPrice)
                                  .toFixed(2)
                                  .replace(/\.00$/, '')}{' '}
                                QAR
                              </Text>
                              <Text style={styles.originalPrice}>
                                {parseFloat(originalPrice)
                                  .toFixed(2)
                                  .replace(/\.00$/, '')}{' '}
                                QAR
                              </Text>
                            </>
                          );
                        }
                      }

                      const displayPrice = hasOffer
                        ? product.offer!.offer_price
                        : product.price;
                      return (
                        <Text
                          style={[
                            styles.productPrice,
                            disabled && styles.productPriceDisabled,
                          ]}
                        >
                          {parseFloat(displayPrice)
                            .toFixed(2)
                            .replace(/\.00$/, '')}{' '}
                          QAR
                        </Text>
                      );
                    })()}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      disabled && styles.addButtonDisabled,
                      isInCart(product.id) && styles.viewCartButton,
                    ]}
                    disabled={disabled}
                    onPress={() => {
                      if (isOutOrInactive) {
                        return;
                      }
                      if (isInCart(product.id)) {
                        onShowCart?.();
                      } else if (onAddPress) {
                        onAddPress(product);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.addButtonText,
                        disabled && styles.addButtonTextDisabled,
                        isInCart(product.id) && styles.viewCartButtonText,
                      ]}
                    >
                      {isInCart(product.id) ? t('home.viewInCart') : '+'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: sw(20),
      paddingTop: sh(20),
      paddingBottom: sh(20),
    },
    closedBanner: {
      backgroundColor: '#FFF4E5',
      borderRadius: sw(16),
      paddingHorizontal: sw(16),
      paddingVertical: sh(14),
      marginBottom: sh(20),
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
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: sw(12),
    },
    productCard: {
      width: '48%',
      marginBottom: sh(24),
    },
    productCardDisabled: {
      opacity: 0.65,
    },
    imageWrapper: {
      width: '100%',
      height: sw(155),
      borderRadius: sw(24),
      overflow: 'hidden',
      marginBottom: sh(12),
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    productImageDisabled: {
      opacity: 0.85,
    },
    closedImageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.32)',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: sh(10),
    },
    closedOverlayTag: {
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      paddingHorizontal: sw(10),
      paddingVertical: sh(4),
      borderRadius: sw(12),
    },
    closedOverlayTagText: {
      color: '#FFFFFF',
      fontSize: fs(10),
      fontFamily: colors.fontSemiBold,
    },
    heartIconBtn: {
      position: 'absolute',
      right: sw(12),
      top: sh(12),
    },
    heartIcon: {
      width: sw(20),
      height: sw(20),
      tintColor: colors.white,
    },
    heartIconFilled: {
      tintColor: colors.primary,
    },
    productInfo: {
      paddingHorizontal: sw(6),
    },
    productName: {
      fontSize: fs(15),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
    },
    productNameDisabled: {
      color: colors.textSecondary || '#888888',
    },
    productCategory: {
      fontSize: fs(12),
      color: colors.textMuted,
      marginBottom: sh(4),
      fontFamily: colors.fontRegular,
    },
    preparationTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sh(6),
    },
    timerIcon: {
      fontSize: fs(12),
      color: colors.primary,
      marginRight: sw(4),
    },
    preparationTimeText: {
      fontSize: fs(11),
      color: colors.textSecondary,
      fontFamily: colors.fontMedium,
    },
    productPrice: {
      fontSize: fs(15),
      color: colors.success,
      fontFamily: colors.fontInterSemiBold,
    },
    productPriceDisabled: {
      color: colors.textSecondary || '#888888',
    },
    originalPrice: {
      fontSize: fs(12),
      color: colors.textMuted,
      textDecorationLine: 'line-through',
      fontFamily: colors.fontRegular,
    },
    priceWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: sw(6),
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addButton: {
      backgroundColor: colors.primary,
      width: sw(24),
      height: sw(24),
      borderRadius: sw(12),
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonDisabled: {
      backgroundColor: '#CCCCCC',
    },
    addButtonText: {
      color: colors.white,
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
      marginTop: -sh(2),
    },
    addButtonTextDisabled: {
      color: '#8E8E93',
    },
    viewCartButton: {
      width: 'auto',
      height: 'auto',
      paddingHorizontal: sw(8),
      paddingVertical: sh(4),
      borderRadius: sw(8),
    },
    viewCartButtonText: {
      fontSize: fs(10),
      marginTop: 0,
      fontFamily: colors.fontBold,
    },
  });

export default ProductsSection;
