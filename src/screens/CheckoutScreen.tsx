import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart, useCheckout, useApplyPromocode } from '../hooks/queries';
import Header from '../components/common/Header';
import CouponSection from '../components/cart/CouponSection';
import { SavedAddress } from '../services/api/address';

interface CheckoutScreenProps {
  onBack: () => void;
  selectedAddress: SavedAddress;
  cartId: string;
  preorderDate: string;
  onViewAllPromos: () => void;
  preFilledPromoCode?: string;
  onOrderPlaced?: () => void;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onBack,
  selectedAddress,
  cartId,
  preorderDate,
  onViewAllPromos,
  preFilledPromoCode,
  onOrderPlaced,
}) => {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [discountedTotal, setDiscountedTotal] = useState<number | null>(null);

  const { data: cartResponse, isLoading: loadingCart } = useCart(
    customerId,
    preorderDate,
  );
  const { mutate: placeOrder, isPending: placingOrder } = useCheckout();
  const { mutate: applyPromocode, isPending: applyingPromo } =
    useApplyPromocode();

  useEffect(() => {
    const fetchCustomer = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) {
        setCustomerId(id);
      }
    };
    fetchCustomer();
  }, []);

  const cartData = (cartResponse?.data as any)?.cart;
  const items = cartData?.items || [];
  const subtotal = cartData?.subtotal || 0;
  const totalAmount = cartData?.total_amount || 0;

  const handlePlaceOrder = () => {
    if (!customerId) return;

    placeOrder(
      {
        customer_id: customerId,
        cart_id: cartId,
        address_id: String(selectedAddress.id),
        use_wallet: 0,
        payment_type: paymentMethod === 'cash' ? 1 : 2,
      },
      {
        onSuccess: response => {
          // If payment is required and URL is provided, open it
          if (response.requires_payment && response.data?.payment_url) {
            Linking.openURL(response.data.payment_url).catch(err =>
              console.error('Failed to open payment URL:', err),
            );
          } else {
            // COD — navigate to orders screen
            onOrderPlaced ? onOrderPlaced() : onBack();
          }
        },
      },
    );
  };

  if (loadingCart) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={t('checkout.title')}
          onBack={onBack}
          containerStyle={{
            backgroundColor: colors.white,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('checkout.title')}
        onBack={onBack}
        containerStyle={{
          backgroundColor: colors.white,
          paddingBottom: sh(16),
          paddingTop: insets.top + sh(12),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + sh(100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address Section */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('checkout.deliveryAddress')}
          </Text>
          <View style={styles.addressContainer}>
            <Text style={[styles.addressName, { color: colors.text }]}>
              {selectedAddress.name}
            </Text>
            <Text style={[styles.addressText, { color: colors.textMuted }]}>
              {[
                selectedAddress.apartment,
                selectedAddress.building,
                selectedAddress.street,
                selectedAddress.zone,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
            {selectedAddress.additional_directions && (
              <Text style={[styles.addressText, { color: colors.textMuted }]}>
                {selectedAddress.additional_directions}
              </Text>
            )}
            <Text style={[styles.addressPhone, { color: colors.textMuted }]}>
              {selectedAddress.phone_no || selectedAddress.phone}
            </Text>
          </View>
        </View>

        {/* Promo Code Section */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <CouponSection
            colors={colors}
            applying={applyingPromo}
            onViewAll={onViewAllPromos}
            preFilledCode={preFilledPromoCode}
            onApply={code => {
              if (customerId) {
                applyPromocode(
                  { grandTotal: totalAmount, customerId, promoCode: code },
                  {
                    onSuccess: res => {
                      setPromoDiscount(res.discount ?? 0);
                      setDiscountedTotal(
                        res.grand_total_after_discount ?? null,
                      );
                    },
                  },
                );
              }
            }}
          />
        </View>

        {/* Order Summary Section */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('checkout.orderSummary')}
          </Text>
          {items.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <Text
                style={[styles.orderItemName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.product_name}
              </Text>
              <Text style={[styles.orderItemQty, { color: colors.textMuted }]}>
                x{item.quantity}
              </Text>
              <Text style={[styles.orderItemPrice, { color: colors.text }]}>
                QAR {item.total.toFixed(2)}
              </Text>
            </View>
          ))}
          <View
            style={[styles.divider, { backgroundColor: colors.borderSubtle }]}
          />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              {t('checkout.subtotal')}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              QAR {subtotal.toFixed(2)}
            </Text>
          </View>
          {promoDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: colors.success || '#2E7D32' },
                ]}
              >
                Promo Discount
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: colors.success || '#2E7D32' },
                ]}
              >
                - QAR {promoDiscount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabelBold, { color: colors.text }]}>
              {t('checkout.total')}
            </Text>
            <Text style={[styles.summaryValueBold, { color: colors.primary }]}>
              QAR {(discountedTotal ?? totalAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('checkout.paymentMethod')}
          </Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              { borderColor: colors.border },
              paymentMethod === 'cash' && {
                borderColor: colors.primary,
                backgroundColor: colors.primaryLight || '#FFF8F2',
              },
            ]}
            onPress={() => setPaymentMethod('cash')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioOuter,
                { borderColor: colors.border },
                paymentMethod === 'cash' && { borderColor: colors.primary },
              ]}
            >
              {paymentMethod === 'cash' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.paymentText, { color: colors.text }]}>
              {t('checkout.cashOnDelivery')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              { borderColor: colors.border },
              paymentMethod === 'online' && {
                borderColor: colors.primary,
                backgroundColor: colors.primaryLight || '#FFF8F2',
              },
            ]}
            onPress={() => setPaymentMethod('online')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radioOuter,
                { borderColor: colors.border },
                paymentMethod === 'online' && { borderColor: colors.primary },
              ]}
            >
              {paymentMethod === 'online' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.paymentText, { color: colors.text }]}>
              {t('checkout.payOnline')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View
        style={[
          styles.placeOrderContainer,
          {
            paddingBottom: insets.bottom + sh(20),
            backgroundColor: colors.white,
            borderTopColor: colors.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            { backgroundColor: colors.primary },
            placingOrder && { opacity: 0.6 },
          ]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          activeOpacity={0.8}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              {t('checkout.placeOrder')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: sw(20),
  },
  section: {
    borderRadius: sw(16),
    padding: sw(20),
    marginBottom: sh(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: fs(18),
    fontWeight: '600',
    marginBottom: sh(16),
  },
  addressContainer: {
    gap: sh(8),
  },
  addressName: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  addressText: {
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  addressPhone: {
    fontSize: fs(14),
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sh(12),
  },
  orderItemName: {
    flex: 1,
    fontSize: fs(14),
    fontWeight: '500',
  },
  orderItemQty: {
    fontSize: fs(14),
    marginHorizontal: sw(12),
  },
  orderItemPrice: {
    fontSize: fs(14),
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: sh(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sh(8),
  },
  summaryLabel: {
    fontSize: fs(14),
  },
  summaryValue: {
    fontSize: fs(14),
  },
  summaryLabelBold: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  summaryValueBold: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sw(16),
    borderRadius: sw(12),
    borderWidth: 1.5,
    marginBottom: sh(12),
  },
  radioOuter: {
    width: sw(22),
    height: sw(22),
    borderRadius: sw(11),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sw(12),
  },
  radioInner: {
    width: sw(12),
    height: sw(12),
    borderRadius: sw(6),
  },
  checkboxOuter: {
    width: sw(22),
    height: sw(22),
    borderRadius: sw(4),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sw(12),
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: fs(14),
    fontWeight: '700',
  },
  paymentText: {
    fontSize: fs(15),
    fontWeight: '500',
  },
  placeOrderContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: sw(20),
    borderTopWidth: 1,
  },
  placeOrderButton: {
    height: sh(52),
    borderRadius: sw(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
  },
});

export default CheckoutScreen;
