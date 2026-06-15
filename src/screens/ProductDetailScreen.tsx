import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { BASE_URL } from '../constants/api';
import { ProductDetail } from '../services/api/product';
import { Images } from '../assets/images';
import { useAddons } from '../hooks/queries';
import { Addon } from '../services/api/addons';

interface ProductDetailScreenProps {
  product: ProductDetail;
  onBack: () => void;
  onAddToCart: (productId: number, quantity: number) => void;
}

function ProductDetailScreen({
  product,
  onBack,
  onAddToCart,
}: ProductDetailScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const { data: addonsData, isLoading: addonsLoading } = useAddons();
  const addons = addonsData?.data || [];

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    console.log('Addons Data:', addonsData);
    console.log('Addons Array:', addons);
    console.log('Addons Loading:', addonsLoading);
  }, [addonsData, addons, addonsLoading]);

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  const imageUrl = `${BASE_URL}${product.image}`;

  // Get ingredients count
  const ingredientsArray = product.ingredients
    ? product.ingredients.split(',')
    : [];
  const ingredientsCount = ingredientsArray.length;

  const calculateTotalPrice = () => {
    const hasOffer = product.offer != null && product.offer.offer_price != null && product.offer.offer_price !== '';
    const offerPrice = hasOffer ? product.offer!.offer_price : (product.offer_price || '');
    const activeUnitPrice = (offerPrice !== '') ? parseFloat(offerPrice) : parseFloat(product.net_price || product.price || '0');

    const basePrice = activeUnitPrice * quantity;
    const addonsPrice = addons
      .filter(addon => selectedAddons.includes(addon.id))
      .reduce((sum, addon) => sum + parseFloat(addon.offer_price), 0);
    return basePrice + addonsPrice;
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
  };

  const renderIngredientTag = (ingredient: string, index: number) => (
    <View key={index} style={styles.ingredientTag}>
      <Text style={styles.ingredientText}>{ingredient.trim()}</Text>
    </View>
  );

  const handleAddonToggle = (addonId: number) => {
    setSelectedAddons(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      }
      if (prev.length < 4) {
        return [...prev, addonId];
      }
      return prev;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Image with Header */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.card }]}
              onPress={onBack}
            >
              <Image
                source={Images.backArrow1}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.card }]}
            >
              <Image
                source={Images.share}
                style={styles.shareIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          {/* Department Label */}
          <Text
            style={[
              styles.departmentLabel,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
          {product.department?.name_en || product.department_info?.name_en}
        </Text>

        {/* Product Name */}
        <Text
          style={[
            styles.productName,
            { color: colors.text, fontFamily: colors.fontBold },
          ]}
        >
          {product.name_en}
        </Text>

        {/* Description */}
        {product.description_en ? (
          <Text
            style={[
              styles.description,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
            {product.description_en}
          </Text>
        ) : (
          <Text
            style={[
              styles.description,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </Text>
        )}

        {/* Preparation Time */}
        {product.preparation_time_formatted && (
          <View style={styles.timeContainer}>
            <Text style={[styles.timeIcon, { color: colors.primary }]}>⏱</Text>
            <Text
              style={[
                styles.timeText,
                { color: colors.primary, fontFamily: colors.fontMedium },
              ]}
            >
              {product.preparation_time_formatted}
            </Text>
          </View>
        )}

        {/* Ingredients */}
        {product.ingredients && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: colors.fontSemiBold },
              ]}
            >
              Ingredients
            </Text>
            <Text
              style={[
                styles.itemsCount,
                { color: colors.textMuted, fontFamily: colors.fontRegular },
              ]}
            >
              {ingredientsCount} Items
            </Text>
            <View style={styles.ingredientsContainer}>
              {ingredientsArray.map((ingredient, index) =>
                renderIngredientTag(ingredient, index),
              )}
            </View>
          </View>
        )}

        {/* Add Ons Section */}
        <View style={styles.section}>
          <View style={styles.addOnsHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: colors.fontSemiBold },
              ]}
            >
              Add Ons
            </Text>
            <View
              style={[
                styles.optionalBadge,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.optionalLabel,
                  { color: colors.textMuted, fontFamily: colors.fontRegular },
                ]}
              >
                Optional
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.addonSubtext,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
            {addons.length} Items • Select up to 4 items
          </Text>

          {addonsLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: sh(10) }}
            />
          ) : addons.length > 0 ? (
            addons.map((addon: Addon) => (
              <TouchableOpacity
                key={addon.id}
                style={styles.addonItem}
                onPress={() => handleAddonToggle(addon.id)}
                activeOpacity={0.7}
              >
                <View style={styles.addonContent}>
                  <Text
                    style={[
                      styles.addonName,
                      { color: colors.text, fontFamily: colors.fontMedium },
                    ]}
                  >
                    {addon.name_en}
                  </Text>
                  <Text
                    style={[
                      styles.addonPrice,
                      {
                        color: colors.primary,
                        fontFamily: colors.fontSemiBold,
                      },
                    ]}
                  >
                    +{addon.offer_price} QAR
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: selectedAddons.includes(addon.id)
                        ? colors.primary
                        : colors.border,
                    },
                    selectedAddons.includes(addon.id) && {
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  {selectedAddons.includes(addon.id) && (
                    <View
                      style={[
                        styles.radioButtonInner,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text
              style={[
                styles.infoText,
                {
                  color: colors.textMuted,
                  fontFamily: colors.fontRegular,
                  marginTop: sh(10),
                },
              ]}
            >
              No add-ons available
            </Text>
          )}
        </View>


        </View>
      </ScrollView>

      {/* Fixed Bottom: Quantity Selector and Add Button */}
      <View
        style={[
          styles.fixedBottomContainer,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.actionContainer}>
          <View
            style={[styles.quantityContainer, { borderColor: colors.border }]}
          >
            <TouchableOpacity
              style={styles.quantityButtonInline}
              onPress={handleQuantityDecrease}
              disabled={quantity === 1}
            >
              <Text
                style={[
                  styles.quantityButtonText,
                  {
                    color: quantity === 1 ? colors.textMuted : colors.text,
                    fontFamily: colors.fontSemiBold,
                  },
                ]}
              >
                -
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.quantityText,
                { color: colors.text, fontFamily: colors.fontSemiBold },
              ]}
            >
              {quantity}
            </Text>
            <TouchableOpacity
              style={styles.quantityButtonInline}
              onPress={handleQuantityIncrease}
            >
              <Text
                style={[
                  styles.quantityButtonText,
                  { color: colors.text, fontFamily: colors.fontSemiBold },
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>
              Add item • {calculateTotalPrice().toFixed(2)} QAR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    imageContainer: {
      width: '100%',
      height: sh(300),
      position: 'relative',
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      top: insets.top + sh(12),
      left: sw(20),
      right: sw(20),
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    backButton: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(20),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    backIcon: {
      width: sw(20),
      height: sw(20),
    },
    shareButton: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(20),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: colors.card,
    },
    shareIcon: {
      width: sw(20),
      height: sw(20),
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: sh(20),
    },
    contentWrapper: {
      paddingHorizontal: sw(20),
      paddingTop: sh(20),
      marginTop: sh(-20),
      backgroundColor: colors.background,
      borderTopLeftRadius: sw(24),
      borderTopRightRadius: sw(24),
    },
    departmentLabel: {
      fontSize: fs(14),
      marginBottom: sh(4),
      color: '#9CA3AF',
    },
    productName: {
      fontSize: fs(24),
      marginBottom: sh(16),
      lineHeight: fs(32),
      color: '#1F2937',
    },
    description: {
      fontSize: fs(14),
      lineHeight: fs(22),
      marginBottom: sh(20),
      color: '#9CA3AF',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sh(24),
    },
    timeIcon: {
      fontSize: fs(18),
      marginRight: sw(6),
    },
    timeText: {
      fontSize: fs(16),
      fontWeight: '500',
    },
    section: {
      marginBottom: sh(20),
    },
    addOnsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sh(8),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: fs(18),
      marginBottom: 0,
    },
    itemsCount: {
      fontSize: fs(13),
      marginTop: sh(4),
      marginBottom: sh(12),
    },
    optionalBadge: {
      paddingHorizontal: sw(12),
      paddingVertical: sh(4),
      borderRadius: sw(12),
      borderWidth: 1,
    },
    optionalLabel: {
      fontSize: fs(12),
    },
    addonSubtext: {
      fontSize: fs(13),
      marginTop: sh(0),
    },
    addonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: sh(16),
      paddingHorizontal: sw(16),
      marginTop: sh(12),
    },
    addonContent: {
      flex: 1,
    },
    addonName: {
      fontSize: fs(15),
      marginBottom: sh(4),
    },
    addonPrice: {
      fontSize: fs(14),
    },
    radioButton: {
      width: sw(24),
      height: sw(24),
      borderRadius: sw(12),
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: sw(12),
    },
    radioButtonInner: {
      width: sw(12),
      height: sw(12),
      borderRadius: sw(6),
    },
    ingredientsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sw(8),
      marginTop: sh(8),
    },
    ingredientTag: {
      paddingHorizontal: sw(14),
      paddingVertical: sh(10),
      borderRadius: sw(20),
      borderWidth: 1,
      borderColor: '#E5E5E5',
      backgroundColor: 'transparent',
    },
    ingredientText: {
      fontSize: fs(14),
      color: '#6B7280',
    },
    actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sw(12),
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sw(16),
      paddingVertical: sh(12),
      borderRadius: sw(24),
      borderWidth: 1,
      gap: sw(20),
    },
    quantityButtonInline: {
      width: sw(24),
      height: sw(24),
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityButton: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(8),
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityButtonText: {
      fontSize: fs(22),
    },
    quantityText: {
      fontSize: fs(20),
      minWidth: sw(30),
      textAlign: 'center',
    },
    addButton: {
      flex: 1,
      height: sw(56),
      borderRadius: sw(16),
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: fs(16),
      color: '#FFFFFF',
      fontWeight: '600',
    },
    infoText: {
      fontSize: fs(13),
      lineHeight: fs(20),
      marginBottom: sh(4),
    },

    fixedBottomContainer: {
      paddingTop: sh(16),
      paddingHorizontal: sw(20),
      borderTopWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 5,
    },
  });

export default ProductDetailScreen;
