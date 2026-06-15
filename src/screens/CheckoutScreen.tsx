import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart, useCheckout, useApplyPromocode, useCheckoutDetails } from '../hooks/queries';
import Header from '../components/common/Header';
import CouponSection from '../components/cart/CouponSection';
import { SavedAddress } from '../services/api/address';
import { orderService } from '../services/api/order';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

interface CheckoutScreenProps {
  onBack: () => void;
  selectedAddress: SavedAddress;
  cartId: string;
  preorderDate: string;
  onViewAllPromos: () => void;
  preFilledPromoCode?: string;
  onOrderPlaced?: () => void;
  onGoToHome?: () => void;
  onGoToOrders?: (preorderDate?: string) => void;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onBack,
  selectedAddress,
  cartId,
  preorderDate,
  onViewAllPromos,
  preFilledPromoCode,
  onOrderPlaced,
  onGoToHome,
  onGoToOrders,
}) => {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [discountedTotal, setDiscountedTotal] = useState<number | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');

  // Online payment helper states
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [createdOrderUniqueId, setCreatedOrderUniqueId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [webViewKey, setWebViewKey] = useState<number>(0);
  const appState = useRef(AppState.currentState);

  const { data: cartResponse, isLoading: loadingCart } = useCart(
    customerId,
    preorderDate,
  );

  const deliveryDate = preorderDate ? preorderDate.split(' ')[0] : '';
  const deliveryTime = (preorderDate && preorderDate.split(' ').length > 1)
    ? preorderDate.split(' ')[1].substring(0, 5)
    : '';

  const { data: checkoutDetailsResponse, isLoading: loadingCheckout } = useCheckoutDetails(
    customerId,
    cartId,
    deliveryDate,
    deliveryTime,
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

  // Listen to AppState changes to auto-verify payment status when returning to app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returned to foreground
        if (createdOrderId) {
          handleVerifyPayment(createdOrderId, true);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [createdOrderId]);

  const cartData = (cartResponse?.data as any)?.cart;
  const checkoutData = checkoutDetailsResponse?.data;

  const items = checkoutData?.cart_items || cartData?.items || [];
  const subtotal = checkoutData?.subtotal ?? cartData?.subtotal ?? 0;
  const totalAmount = checkoutData?.total_amount ?? cartData?.total_amount ?? 0;
  const specialRequest = checkoutData?.special_request || '';

  const handleVerifyPayment = async (orderId: number, isSilent = false) => {
    if (!customerId) return;
    if (!isSilent) {
      setIsVerifyingPayment(true);
    }
    try {
      const response = await orderService.getOrderHistory(customerId);
      console.log('Verify Payment - Order History Response:', JSON.stringify(response, null, 2));
      const orders = response.data?.orders || [];
      const order = orders.find(o => o.id === orderId);
      console.log('Verify Payment - Target Order:', JSON.stringify(order, null, 2));
      if (order) {
        // Check if status is paid (payment_status === 2 or text has paid/success, or tracking status is not pending/cancelled)
        const isPaid =
          order.payment_status === 2 ||
          order.payment_status_text?.toLowerCase() === 'paid' ||
          order.payment_status_text?.toLowerCase() === 'success' ||
          (order.tracking_status_text &&
            order.tracking_status_text.toLowerCase() !== 'pending' &&
            order.tracking_status_text.toLowerCase() !== 'cancelled');

        console.log('Verify Payment - Calculated isPaid status:', isPaid);

        if (isPaid) {
          console.log('>>> [PAYMENT VERIFICATION RESULT]: SUCCESS for Order ID', orderId);
          Toast.show({
            type: 'success',
            text1: 'Order Placed',
            text2: 'Your order has been placed successfully!',
          });
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          setCreatedOrderId(null);
          setCreatedOrderUniqueId(null);
          setSuccessOrderId(order.unique_id);
        } else {
          console.log('>>> [PAYMENT VERIFICATION RESULT]: PENDING/FAILED for Order ID', orderId);
          if (!isSilent) {
            Toast.show({
              type: 'info',
              text1: 'Payment Pending',
              text2: 'We could not verify your payment. Please try again if you completed the payment.',
            });
          }
        }
      } else {
        console.log('>>> [PAYMENT VERIFICATION RESULT]: ORDER NOT FOUND for Order ID', orderId);
        if (!isSilent) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Order details not found.',
          });
        }
      }
    } catch (err: any) {
      console.log('>>> [PAYMENT VERIFICATION RESULT]: ERROR verifying Order ID', orderId, err);
      console.error('Error verifying payment status:', err);
      if (!isSilent) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.message || 'Failed to verify payment status.',
        });
      }
    } finally {
      if (!isSilent) {
        setIsVerifyingPayment(false);
      }
    }
  };

  const handlePlaceOrder = () => {
    if (!customerId) return;

    placeOrder(
      {
        customer_id: customerId,
        cart_id: cartId,
        address_id: String(selectedAddress.id),
        use_wallet: 0,
        payment_type: paymentMethod === 'cash' ? 1 : 2,
        promo_code: appliedPromoCode || undefined,
      },
      {
        onSuccess: response => {
          console.log('Place Order API Response:', JSON.stringify(response, null, 2));
          if (response.requires_payment && response.data?.payment_url) {
            setCreatedOrderId(response.data.order_id || null);
            setCreatedOrderUniqueId(response.data.unique_id || (response.data as any).temp_order_id || null);
            setPaymentUrl(response.data.payment_url);
          } else {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            
            // Show toast from the API response
            Toast.show({
              type: 'success',
              text1: t('checkout.orderPlaced', 'Order Placed'),
              text2: response.message || 'Your order has been placed successfully!',
            });

            // Redirect directly to the order screen
            if (onGoToOrders) {
              onGoToOrders(preorderDate);
            }
          }
        },
        onError: error => {
          console.log('Place Order API Error:', error);
        },
      },
    );
  };

  if (paymentUrl) {
    if (paymentError) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: sw(32) }]}>
          {/* Error Icon */}
          <View style={[styles.successIconContainer, { backgroundColor: '#FF3B3015' }]}>
            <Text style={[styles.successCheckmark, { color: '#FF3B30' }]}>✗</Text>
          </View>

          <Text style={[styles.successTitle, { color: colors.text }]}>
            Payment Failed
          </Text>

          <Text style={[styles.successDescription, { color: colors.textMuted, textAlign: 'center', marginTop: sh(8) }]}>
            {paymentError}
          </Text>

          {createdOrderUniqueId ? (
            <View style={[styles.orderIdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.orderIdLabel, { color: colors.textMuted }]}>Order ID</Text>
              <Text style={[styles.orderIdValue, { color: colors.text }]}>#{createdOrderUniqueId}</Text>
            </View>
          ) : createdOrderId ? (
            <View style={[styles.orderIdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.orderIdLabel, { color: colors.textMuted }]}>Order ID</Text>
              <Text style={[styles.orderIdValue, { color: colors.text }]}>#{createdOrderId}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              console.log('>>> [RETRY PAYMENT] Restarting WebView payment flow for URL:', paymentUrl);
              setWebViewKey(prev => prev + 1);
              setPaymentError(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>Retry Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.successButtonSecondary, { borderColor: colors.primary }]}
            onPress={() => {
              console.log('>>> [CANCEL PAYMENT FLOW] Returning to checkout form.');
              setPaymentError(null);
              setPaymentUrl('');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.successButtonSecondaryText, { color: colors.primary }]}>
              Back to Checkout
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const injectedScript = `
      (function() {
        // Ensure viewport metadata is set for mobile screens to scale correctly
        try {
          var meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          document.getElementsByTagName('head')[0].appendChild(meta);
        } catch(e) {}

        try {
          const bodyContent = document.body.innerText;
          window.ReactNativeWebView.postMessage(bodyContent);
        } catch(e) {}
        true;
      })();
    `;

    const handlePaymentSuccess = (orderId: number | null, uniqueId: string | null = null) => {
      console.log('>>> [PAYMENT HANDLER SUCCESS] orderId:', orderId, 'uniqueId:', uniqueId);
      setPaymentUrl('');
      setPaymentError(null);
      Toast.show({
        type: 'success',
        text1: 'Order Placed',
        text2: 'Your order has been placed successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const displayId = uniqueId || (orderId && orderId === createdOrderId ? createdOrderUniqueId : null) || (orderId ? String(orderId) : null) || createdOrderUniqueId || 'success';
      console.log('>>> [PAYMENT HANDLER SUCCESS] displayId resolved to:', displayId);
      
      setCreatedOrderId(null);
      setCreatedOrderUniqueId(null);
      setSuccessOrderId(displayId);
    };

    const handlePaymentFailure = (message?: string) => {
      const errMsg = message || 'The payment process was unsuccessful or canceled.';
      console.log('>>> [PAYMENT HANDLER FAILURE] Error message:', errMsg);
      setPaymentError(errMsg);
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: errMsg,
      });
    };

    const onMessageHandler = (event: any) => {
      try {
        const rawData = event.nativeEvent.data;
        console.log('>>> [WEBVIEW MESSAGE] Raw data received:', rawData);
        const d = JSON.parse(rawData);
        console.log('>>> [WEBVIEW MESSAGE] Parsed JSON data:', d);
        if (d.success === true) {
          const orderIdNum = d.order_id || createdOrderId;
          const uniqueId = d.unique_id || null;
          handlePaymentSuccess(orderIdNum, uniqueId);
        } else if (d.success === false) {
          handlePaymentFailure(d.message || d.error);
        }
      } catch (error) {
        console.log('>>> [WEBVIEW MESSAGE] Parse error (Non-JSON message ignored):', error);
      }
    };

    const handleNavigationStateChange = (navState: any) => {
      const { url } = navState;
      console.log('>>> [WEBVIEW NAVIGATION] URL:', url);

      const isFailure =
        url.includes('fail') ||
        url.includes('cancel') ||
        url.includes('error') ||
        url.includes('decline') ||
        url.includes('success=false') ||
        url.includes('status=failed');

      const isSuccess =
        (url.includes('/success') || url.includes('success=true') || url.includes('/callback')) &&
        !isFailure;

      console.log('>>> [WEBVIEW NAVIGATION STATE] isSuccess:', isSuccess, 'isFailure:', isFailure);

      // Extract all query parameters for developer logging
      const queryParams: Record<string, string> = {};
      try {
        const queryPart = url.split('?')[1];
        if (queryPart) {
          const pairs = queryPart.split('&');
          pairs.forEach((pair: string) => {
            const [key, val] = pair.split('=');
            if (key) {
              queryParams[decodeURIComponent(key)] = val ? decodeURIComponent(val) : '';
            }
          });
        }
      } catch (err) {}

      console.log('>>> [DEVELOPER PAYMENT LOG] callback data:', JSON.stringify({
        url: url,
        extractedParams: queryParams,
        isSuccess: isSuccess,
        isFailure: isFailure,
        tempOrderId: createdOrderUniqueId
      }, null, 2));

      if (isSuccess) {
        const match =
          url.match(/[?&]unique_id=([^&#]*)/) ||
          url.match(/[?&]trackingId=([^&#]*)/) ||
          url.match(/[?&]order_id=([^&#]*)/);
        const orderIdString = match ? match[1] : '';
        const orderIdNum = orderIdString ? parseInt(orderIdString, 10) : createdOrderId;
        
        let uniqueId: string | null = null;
        const uniqueIdMatch = url.match(/[?&]unique_id=([^&#]*)/);
        if (uniqueIdMatch) {
          uniqueId = uniqueIdMatch[1];
        }

        const parsedOrderId = (orderIdNum !== null && !isNaN(orderIdNum)) ? orderIdNum : null;
        handlePaymentSuccess(parsedOrderId, uniqueId);
      } else if (isFailure) {
        // Extract failure reason if present in URL query params
        const reasonMatch = url.match(/[?&](?:message|error|reason)=([^&#]*)/);
        const reason = reasonMatch ? decodeURIComponent(reasonMatch[1]) : undefined;
        handlePaymentFailure(reason);
      }
    };

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={t('checkout.title')}
          onBack={() => setPaymentUrl('')}
          containerStyle={{
            backgroundColor: colors.background,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <WebView
          key={webViewKey}
          style={{ flex: 1 }}
          source={{ uri: paymentUrl }}
          onLoadStart={() => setPaymentLoading(true)}
          onLoadEnd={() => setPaymentLoading(false)}
          injectedJavaScript={injectedScript}
          onMessage={onMessageHandler}
          onNavigationStateChange={handleNavigationStateChange}
          scalesPageToFit={true}
        />
        {paymentLoading && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    );
  }

  if (successOrderId !== null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: sw(32) }]}>
        {/* Success Icon */}
        <View style={[styles.successIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.successCheckmark, { color: colors.primary }]}>✓</Text>
        </View>

        <Text style={[styles.successTitle, { color: colors.text }]}>
          Order Placed Successfully!
        </Text>

        <Text style={[styles.successDescription, { color: colors.textMuted }]}>
          Your order has been received and is being processed.
        </Text>

        {successOrderId && successOrderId !== 'success' && !successOrderId.startsWith('TEMP_') && (
          <View style={[styles.orderIdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.orderIdLabel, { color: colors.textMuted }]}>Order ID</Text>
            <Text style={[styles.orderIdValue, { color: colors.text }]}>#{successOrderId}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.successButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            onGoToOrders ? onGoToOrders(preorderDate) : (onOrderPlaced ? onOrderPlaced() : onBack());
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.successButtonText}>View Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.successButtonSecondary, { borderColor: colors.primary }]}
          onPress={() => {
            onGoToHome ? onGoToHome() : onBack();
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.successButtonSecondaryText, { color: colors.primary }]}>
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingCart || loadingCheckout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={t('checkout.title')}
          onBack={onBack}
          containerStyle={{
            backgroundColor: colors.background,
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
          backgroundColor: colors.background,
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
        <View style={[styles.section, { backgroundColor: colors.card }]}>
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
        <View style={[styles.section, { backgroundColor: colors.card }]}>
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
                      setAppliedPromoCode(code);
                    },
                  },
                );
              }
            }}
          />
        </View>

        {/* Order Summary Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
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

        {/* Special Request Section */}
        {!!specialRequest && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Special Request
            </Text>
            <View style={styles.addressContainer}>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {specialRequest}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Method Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
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
            backgroundColor: colors.card,
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
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(32),
  },
  waitingTitle: {
    fontSize: fs(22),
    fontWeight: '700',
    marginBottom: sh(12),
    textAlign: 'center',
  },
  waitingDescription: {
    fontSize: fs(14),
    textAlign: 'center',
    lineHeight: fs(22),
    marginBottom: sh(32),
  },
  verifyingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    marginBottom: sh(20),
  },
  verifyingText: {
    fontSize: fs(14),
    fontWeight: '500',
  },
  waitingButton: {
    width: '100%',
    height: sh(52),
    borderRadius: sw(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waitingButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
  },
  waitingButtonSecondary: {
    width: '100%',
    height: sh(52),
    borderRadius: sw(26),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(24),
  },
  waitingButtonSecondaryText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  cancelWaitingButton: {
    paddingVertical: sh(8),
  },
  cancelWaitingButtonText: {
    fontSize: fs(15),
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  successIconContainer: {
    width: sw(96),
    height: sw(96),
    borderRadius: sw(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(28),
  },
  successCheckmark: {
    fontSize: fs(44),
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: fs(24),
    fontWeight: '700',
    marginBottom: sh(12),
    textAlign: 'center',
  },
  successDescription: {
    fontSize: fs(15),
    textAlign: 'center',
    lineHeight: fs(22),
    marginBottom: sh(32),
  },
  orderIdContainer: {
    width: '100%',
    paddingVertical: sh(16),
    paddingHorizontal: sw(24),
    borderRadius: sw(12),
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sh(40),
  },
  orderIdLabel: {
    fontSize: fs(14),
    fontWeight: '500',
  },
  orderIdValue: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  successButton: {
    width: '100%',
    height: sh(52),
    borderRadius: sw(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '600',
  },
  successButtonSecondary: {
    width: '100%',
    height: sh(52),
    borderRadius: sw(26),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sh(24),
  },
  successButtonSecondaryText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
});

export default CheckoutScreen;
