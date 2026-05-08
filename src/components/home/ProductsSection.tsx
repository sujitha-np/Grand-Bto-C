import React from 'react';
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

import { Images } from '../../assets/images';

interface ProductsSectionProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  onAddPress?: (product: Product) => void;
}

function ProductsSection({ products, onProductPress, onAddPress }: ProductsSectionProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {products.map(product => {
          const imageUrl = `${BASE_URL}${product.image}`;
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
                <TouchableOpacity style={styles.heartIconBtn}>
                  <Image
                    source={Images.heart}
                    style={styles.heartIcon}
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
