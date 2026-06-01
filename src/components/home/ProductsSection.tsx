import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
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
} from '../../hooks/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Images } from '../../assets/images';

interface ProductsSectionProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  onAddPress?: (product: Product) => void;
}

function ProductsSection({
  products,
  onProductPress,
  onAddPress,
}: ProductsSectionProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [customerId, setCustomerId] = useState<string | undefined>();

  const { data: wishlistData } = useWishlist(customerId);
  const { mutateAsync: addToWishlist } = useAddToWishlist();
  const { mutateAsync: removeFromWishlist } = useRemoveFromWishlist();

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

  // Debug logging
  React.useEffect(() => {
    console.log('Wishlist items:', wishlistItems);
    console.log('Wishlist product IDs:', Array.from(wishlistProductIds));
  }, [wishlistItems, wishlistProductIds]);

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
          console.log(
            `Product ${product.id} (${product.name_en}): isInWishlist = ${isInWishlist}`,
          );
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              activeOpacity={0.8}
              onPress={() => onProductPress?.(product)}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.heartIconBtn}
                  onPress={() => handleWishlistToggle(product.id)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={Images.heart}
                    style={[
                      styles.heartIcon,
                      isInWishlist && styles.heartIconFilled,
                    ]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name_en}
                </Text>
                <Text style={styles.productCategory}>
                  {product.department?.name_en || 'Category'}
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
                  <Text style={styles.productPrice}>
                    {parseFloat(product.net_price)
                      .toFixed(2)
                      .replace(/\.00$/, '')}{' '}
                    QAR
                  </Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      if (onAddPress) onAddPress(product);
                    }}
                  >
                    <Text style={styles.addButtonText}>+</Text>
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
    addButtonText: {
      color: colors.white,
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
      marginTop: -sh(2),
    },
  });

export default ProductsSection;
