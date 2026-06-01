import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useSpecialRequest,
} from '../hooks/queries';
import Header from '../components/common/Header';
import CartItemCard from '../components/cart/CartItemCard';
import SpecialRequestSection from '../components/cart/SpecialRequestSection';
import OrderSummary from '../components/cart/OrderSummary';

interface CartScreenProps {
  onBack: () => void;
  onSelectDate?: (total: number, cartId: string) => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onBack, onSelectDate }) => {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [customerIdLoaded, setCustomerIdLoaded] = useState(false);
  const [preorderDate, setPreorderDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');

  useEffect(() => {
    const fetchCustomer = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) {
        setCustomerId(id);
      }
      setCustomerIdLoaded(true);
    };
    fetchCustomer();
  }, []);

  const {
    data: cartResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useCart(customerId, preorderDate);

  const isCartLoading = !customerIdLoaded || isLoading;
  const { mutate: updateQuantity } = useUpdateCartQuantity();
  const { mutate: removeFromCart } = useRemoveFromCart();
  const { mutate: saveSpecialRequest } = useSpecialRequest();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (cartResponse !== undefined) {
      console.log(
        '[CartScreen] Raw cart response:',
        JSON.stringify(cartResponse, null, 2),
      );
    }
    if (isError) {
      console.log('[CartScreen] Cart fetch error:', error);
    }
  }, [cartResponse, isError, error]);

  const cartData = (cartResponse?.data as any)?.cart;
  const items = cartData?.items || [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleIncrease = (item: any) => {
    if (!customerId || !cartData?.cart_id) return;
    const newQuantity = parseInt(item.quantity) + 1;
    updateQuantity({
      customerId,
      cartId: String(cartData.cart_id),
      productId: item.product_id,
      quantity: String(newQuantity),
      preorderDate,
    });
  };

  const handleDecrease = (item: any) => {
    if (!customerId || !cartData?.cart_id) return;
    const currentQuantity = parseInt(item.quantity);
    if (currentQuantity <= 1) return; // Prevent going below 1, deletion handled separately
    const newQuantity = currentQuantity - 1;
    updateQuantity({
      customerId,
      cartId: String(cartData.cart_id),
      productId: item.product_id,
      quantity: String(newQuantity),
      preorderDate,
    });
  };

  const handleDelete = (item: any) => {
    if (!customerId || !cartData?.cart_id) {
      console.log('Cannot delete: missing customerId or cart_id', {
        customerId,
        cartId: cartData?.cart_id,
      });
      return;
    }

    console.log('Deleting item:', {
      customerId,
      cartId: String(cartData.cart_id),
      productId: item.product_id,
    });

    removeFromCart({
      customerId,
      cartId: String(cartData.cart_id),
      productId: item.product_id,
      preorderDate,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Header */}
      <Header
        title="Cart"
        onBack={onBack}
        containerStyle={{
          backgroundColor: colors.white,
          paddingBottom: sh(16),
          paddingTop: insets.top + sh(12),
        }}
      />

      {isCartLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
            {'Failed to load cart.\n' +
              ((error as any)?.message || 'Unknown error')}
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Cart Items List */}
          <View style={styles.itemsList}>
            {items.length === 0 ? (
              <Text
                style={{
                  textAlign: 'center',
                  marginTop: 20,
                  color: colors.textMuted,
                }}
              >
                Your cart is empty.
              </Text>
            ) : (
              items.map((item: any, index: number) => (
                <CartItemCard
                  key={index}
                  item={item}
                  colors={colors}
                  onIncrease={() => handleIncrease(item)}
                  onDecrease={() => handleDecrease(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))
            )}
          </View>

          {items.length > 0 && (
            <View style={styles.paddedContent}>
              <SpecialRequestSection
                colors={colors}
                onSave={text => {
                  if (customerId && cartData?.cart_id) {
                    saveSpecialRequest({
                      cartId: String(cartData.cart_id),
                      customerId,
                      specialRequest: text,
                    });
                  }
                }}
              />
            </View>
          )}

          {items.length > 0 && (
            <OrderSummary
              colors={colors}
              subtotal={cartData?.subtotal || 0}
              delivery={0}
              total={cartData?.total_amount || 0}
            />
          )}

          <View style={{ height: sh(100) }} />
        </ScrollView>
      )}

      {/* Fixed Footer Buttons */}
      {items.length > 0 && !isCartLoading && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.white,
              paddingBottom: insets.bottom + sh(16),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.border }]}
            onPress={onBack}
          >
            <Text
              style={[
                styles.outlineBtnText,
                { color: colors.text, fontFamily: colors.fontSemiBold },
              ]}
            >
              Add items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filledBtn, { backgroundColor: colors.primary }]}
            onPress={() =>
              onSelectDate?.(
                cartData?.total_amount || 0,
                String(cartData?.cart_id || ''),
              )
            }
          >
            <Text
              style={[
                styles.filledBtnText,
                { color: colors.white, fontFamily: colors.fontSemiBold },
              ]}
            >
              Select date
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: sw(20),
    marginBottom: sh(16),
    gap: sw(12),
  },
  toggleButton: {
    paddingVertical: sh(12),
    paddingHorizontal: sw(32),
    borderRadius: sw(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    // Primary background passed inline
  },
  inactiveToggle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  toggleText: {
    fontSize: fs(14),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  itemsList: {
    paddingHorizontal: sw(20),
  },
  paddedContent: {
    paddingHorizontal: sw(20),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: sw(20),
    paddingTop: sh(16),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: sw(16),
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: sw(25),
    paddingVertical: sh(12),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: {
    fontSize: fs(14),
  },
  filledBtn: {
    flex: 1,
    borderRadius: sw(25),
    paddingVertical: sh(12),
    alignItems: 'center',
  },
  filledBtnText: {
    fontSize: fs(14),
  },
});

export default CartScreen;
