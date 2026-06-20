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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { useOfferedProducts, useAddToCart } from '../hooks/queries';
import { fs, sw, sh } from '../utils/responsive';
import { BASE_URL } from '../constants/api';
import { Product } from '../services/api/product';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface OfferedProductsScreenProps {
  offerId: number;
  offerName: string;
  onBack: () => void;
  onShowProductDetail: (product: Product) => void;
}

function OfferedProductsScreen({
  offerId,
  offerName,
  onBack,
  onShowProductDetail,
}: OfferedProductsScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const { mutateAsync: addToCart } = useAddToCart();

  const { data, isLoading, error } = useOfferedProducts(offerId);

  const offeredProducts = data?.data || [];

  useEffect(() => {
    const getCustomerId = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) setCustomerId(id);
    };
    getCustomerId();
  }, []);

  const handleProductPress = (product: Product, offerPrice: string) => {
    onShowProductDetail({
      ...product,
      offer_price: offerPrice,
      offer: {
        ...(product.offer || {}),
        offer_price: offerPrice,
      },
    } as any);
  };

  const handleAddToCart = async (product: Product, offerPrice: string) => {
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
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${product.name_en} - ${parseFloat(offerPrice).toFixed(2)} QAR`,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add to cart',
        text2: err?.message || 'Unknown error',
      });
    }
  };

  const renderProduct = ({ item }: any) => {
    const product = item.product;
    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.8}
        onPress={() => handleProductPress(product, item.offer_price)}
      >
        <Image
          source={{ uri: `${BASE_URL}${product.image}` }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name_en}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.offerPrice}>{parseFloat(item.offer_price).toFixed(2)} QAR</Text>
            {parseFloat(item.offer_price) < parseFloat(product.price) && (
              <Text style={styles.originalPrice}>{parseFloat(product.price).toFixed(2)} QAR</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={() => handleAddToCart(product, item.offer_price)}
          >
            <Text style={styles.addButtonText}>{t('home.orderNow')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load products</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{offerName}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={offeredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No products available</Text>
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
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sw(20),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sw(20),
      paddingVertical: sh(15),
      marginTop: sh(10),
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: sw(40),
      height: sw(40),
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: fs(32),
      color: colors.text,
      fontFamily: colors.fontBold,
    },
    headerTitle: {
      fontSize: fs(18),
      color: colors.text,
      fontFamily: colors.fontBold,
    },
    placeholder: {
      width: sw(40),
    },
    listContent: {
      padding: sw(10),
      paddingBottom: sh(20),
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    productCard: {
      width: (sw(375) - sw(30)) / 2,
      backgroundColor: colors.card,
      borderRadius: sw(12),
      marginBottom: sh(15),
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    productImage: {
      width: '100%',
      height: sw(120),
      backgroundColor: '#f5f5f5',
    },
    productInfo: {
      padding: sw(12),
    },
    productName: {
      fontSize: fs(14),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
      marginBottom: sh(8),
      minHeight: sh(36),
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sh(10),
      gap: sw(8),
    },
    offerPrice: {
      fontSize: fs(16),
      color: colors.primary,
      fontFamily: colors.fontBold,
    },
    originalPrice: {
      fontSize: fs(14),
      color: colors.textSecondary,
      fontFamily: colors.fontMedium,
      textDecorationLine: 'line-through',
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingVertical: sh(8),
      paddingHorizontal: sw(12),
      borderRadius: sw(8),
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: fs(12),
      color: '#FFFFFF',
      fontFamily: colors.fontSemiBold,
    },
    errorText: {
      fontSize: fs(16),
      color: colors.error,
      fontFamily: colors.fontMedium,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: fs(16),
      color: colors.textSecondary,
      fontFamily: colors.fontMedium,
      textAlign: 'center',
    },
  });

export default OfferedProductsScreen;
