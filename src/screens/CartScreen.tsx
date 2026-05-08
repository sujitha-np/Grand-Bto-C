import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../hooks/queries';
import { BASE_URL } from '../constants/api';

interface CartScreenProps {
  onBack: () => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const colors = useTheme();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [preorderDate, setPreorderDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');

  useEffect(() => {
    const fetchCustomer = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) {
        setCustomerId(id);
      }
    };
    fetchCustomer();
  }, []);

  const { data: cartResponse, isLoading } = useCart(customerId, preorderDate);
  const cartData = cartResponse?.data?.carts?.[0]; // Assuming we just use the first cart
  const items = cartData?.items || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={{ color: colors.text, fontSize: fs(24) }}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Cart</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Order Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            orderType === 'delivery' ? { backgroundColor: colors.primary } : { backgroundColor: 'transparent' },
          ]}
          onPress={() => setOrderType('delivery')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: orderType === 'delivery' ? colors.white : colors.textMuted },
            ]}
          >
            Delivery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            orderType === 'pickup' ? { backgroundColor: colors.primary } : { backgroundColor: 'transparent' },
          ]}
          onPress={() => setOrderType('pickup')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: orderType === 'pickup' ? colors.white : colors.textMuted },
            ]}
          >
            Pickup
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cart Items List */}
          <View style={styles.itemsList}>
            {items.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textMuted }}>
                Your cart is empty.
              </Text>
            ) : (
              items.map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <Image
                    source={{ uri: `${BASE_URL}${item.image}` }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                          {item.product_name}
                        </Text>
                        <Text style={[styles.itemCategory, { color: colors.textMuted }]}>
                          {item.department?.name_en}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.deleteBtn}>
                        <Text style={{ fontSize: fs(18) }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.itemFooterRow}>
                      <View style={styles.quantityControl}>
                        <TouchableOpacity style={styles.qtyBtn}>
                          <Text style={{ color: colors.primary, fontSize: fs(18) }}>-</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: fs(16), marginHorizontal: sw(12) }}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn}>
                          <Text style={{ color: colors.primary, fontSize: fs(18) }}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.itemTotal, { color: colors.text }]}>
                        {parseFloat(item.price) * parseInt(item.quantity)} QAR
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {items.length > 0 && (
            <>
              {/* Special Request */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>💬 Any special request</Text>
                <TouchableOpacity style={styles.addBtn}>
                  <Text style={styles.addBtnText}>Add+</Text>
                </TouchableOpacity>
              </View>

              {/* Coupon */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>🎫 Coupon</Text>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.outlineActionBtn}>
                    <Text style={styles.outlineActionBtnText}>Add items</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filledActionBtn}>
                    <Text style={styles.filledActionBtnText}>Select date</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Order Summary */}
              <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>🧾 Order summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{cartData?.subtotal || 0} QAR</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={styles.summaryValue}>0 QAR</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Coupon</Text>
                  <Text style={styles.summaryValue}>0 QAR</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: sh(10) }]}>
                  <Text style={[styles.summaryLabel, { fontFamily: colors.fontBold, color: colors.text }]}>
                    Total amount
                  </Text>
                  <Text style={[styles.summaryValue, { fontFamily: colors.fontBold, color: colors.text }]}>
                    {cartData?.total_amount || 0} QAR
                  </Text>
                </View>
              </View>
            </>
          )}
          <View style={{ height: sh(100) }} />
        </ScrollView>
      )}

      {/* Checkout Button */}
      {items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
          <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingVertical: sh(12),
  },
  backButton: {
    padding: sw(8),
    marginLeft: -sw(8),
  },
  title: {
    fontSize: fs(20),
    fontWeight: 'bold',
  },
  placeholder: {
    width: sw(40),
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: sw(20),
    marginHorizontal: sw(20),
    marginTop: sh(10),
    padding: sw(4),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: sh(8),
    borderRadius: sw(16),
    alignItems: 'center',
  },
  toggleText: {
    fontSize: fs(14),
    fontWeight: '600',
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
    paddingTop: sh(20),
  },
  cartItem: {
    flexDirection: 'row',
    paddingHorizontal: sw(20),
    marginBottom: sh(24),
  },
  itemImage: {
    width: sw(80),
    height: sw(80),
    borderRadius: sw(16),
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    flex: 1,
    marginLeft: sw(16),
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: fs(16),
    fontWeight: '600',
    marginBottom: sh(4),
  },
  itemCategory: {
    fontSize: fs(12),
  },
  deleteBtn: {
    padding: sw(4),
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sh(8),
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E6',
    borderRadius: sw(20),
    paddingHorizontal: sw(12),
    paddingVertical: sh(4),
  },
  qtyBtn: {
    paddingHorizontal: sw(8),
  },
  itemTotal: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: sw(20),
    marginTop: sh(24),
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    marginBottom: sh(16),
    color: '#333',
  },
  addBtn: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: sw(20),
    paddingHorizontal: sw(20),
    paddingVertical: sh(8),
    alignSelf: 'flex-start',
  },
  addBtnText: {
    fontSize: fs(14),
    color: '#666',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: sw(12),
  },
  outlineActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: sw(25),
    paddingVertical: sh(12),
    alignItems: 'center',
  },
  outlineActionBtnText: {
    fontSize: fs(16),
    color: '#333',
    fontWeight: '500',
  },
  filledActionBtn: {
    flex: 1,
    backgroundColor: '#FF7B00',
    borderRadius: sw(25),
    paddingVertical: sh(12),
    alignItems: 'center',
  },
  filledActionBtnText: {
    fontSize: fs(16),
    color: '#FFF',
    fontWeight: '500',
  },
  summaryContainer: {
    paddingHorizontal: sw(20),
    marginTop: sh(32),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sh(12),
  },
  summaryLabel: {
    fontSize: fs(14),
    color: '#666',
  },
  summaryValue: {
    fontSize: fs(14),
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: sw(20),
    paddingTop: sh(16),
    borderTopWidth: 1,
  },
  checkoutBtn: {
    borderRadius: sw(30),
    paddingVertical: sh(16),
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: fs(18),
    fontWeight: 'bold',
  },
});

export default CartScreen;
