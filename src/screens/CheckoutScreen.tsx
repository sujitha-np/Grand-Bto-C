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
import OrderSuccessView from '../components/checkout/OrderSuccessView';
import PaymentFailedView from '../components/checkout/PaymentFailedView';

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
  const [specialRequest, setSpecialRequest] = useState<string>('');

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
  const hasHttpErrorRef = useRef<boolean>(false);
  const paymentCompletedRef = useRef<boolean>(false);
  const currentUrlRef = useRef<string>('');
  const webViewRef = useRef<any>(null);

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

  const cartData = (cartResponse?.data as any)?.cart;
  const checkoutData = checkoutDetailsResponse?.data;

  const items = checkoutData?.cart_items || cartData?.items || [];
  const subtotal = checkoutData?.subtotal ?? cartData?.subtotal ?? 0;
  const totalAmount = checkoutData?.total_amount ?? cartData?.total_amount ?? 0;

  useEffect(() => {
    const fetchCustomer = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) {
        setCustomerId(id);
      }
    };
    fetchCustomer();
  }, []);

  useEffect(() => {
    const loadSpecialRequest = async () => {
      try {
        const persisted = await AsyncStorage.getItem(`special_request_${cartId}`);
        if (persisted !== null) {
          setSpecialRequest(persisted);
        } else if (checkoutData?.special_request) {
          setSpecialRequest(checkoutData.special_request);
        }
      } catch (e) {
        console.error('Failed to load persisted special request in checkout', e);
      }
    };
    loadSpecialRequest();
  }, [cartId, checkoutData?.special_request]);

  // Listen to AppState changes to auto-verify payment status when returning to app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App returned to foreground
        if (createdOrderId || createdOrderUniqueId) {
          handleVerifyPayment(createdOrderId, createdOrderUniqueId, true);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [createdOrderId, createdOrderUniqueId]);


  // Helper: Evaluate isPaid
  const evaluateIsPaid = (order: any): boolean => {
    const condA = order.payment_status === 2;
    const condB = order.payment_status_text?.toLowerCase() === 'paid';
    const condC = order.payment_status_text?.toLowerCase() === 'success';
    return condA || condB || condC;
  };

  const handleVerifyPayment = async (
    orderId: number | null,
    uniqueId: string | null = null,
    isSilent = false
  ): Promise<boolean> => {
    if (!customerId) return false;
    if (!isSilent) {
      setIsVerifyingPayment(true);
    }
    try {
      let isPaid = false;
      let order = null;
      const maxAttempts = 5;
      const delayMs = 3000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await orderService.getOrderHistory(customerId);
        const orders = response.data?.orders || [];

        order = orders.find((o: any) => 
          (orderId !== null && (o.id === orderId || String(o.id) === String(orderId) || o.unique_id === String(orderId))) || 
          (uniqueId !== null && (o.unique_id === uniqueId || String(o.id) === String(uniqueId)))
        );

        if (order) {
          isPaid = evaluateIsPaid(order);
          if (isPaid) {
            break;
          }
        }

        if (attempt < maxAttempts && !isPaid) {
          await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        }
      }

      if (order && isPaid) {
        Toast.show({
          type: 'success',
          text1: 'Order Placed',
          text2: 'Your order has been placed successfully!',
        });
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        
        AsyncStorage.removeItem(`special_request_${cartId}`).catch(err => {
          console.error('Failed to remove special request', err);
        });

        setCreatedOrderId(null);
        setCreatedOrderUniqueId(null);
        setSuccessOrderId(order.unique_id);
        return true;
      } else if (order && !isPaid) {
        if (!isSilent) {
          Toast.show({
            type: 'info',
            text1: 'Payment Pending',
            text2: 'We could not verify your payment. Please try again if you completed the payment.',
          });
        }
      } else {
        if (!isSilent) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Order details not found.',
          });
        }
      }
      return false;
    } catch (err: any) {
      console.error('Error verifying payment status:', err);
      if (!isSilent) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err.message || 'Failed to verify payment status.',
        });
      }
      return false;
    } finally {
      if (!isSilent) {
        setIsVerifyingPayment(false);
      }
    }
  };

  const handlePlaceOrder = () => {
    if (!customerId) return;

    const orderPayload = {
      customer_id: customerId,
      cart_id: cartId,
      address_id: String(selectedAddress.id),
      use_wallet: 0,
      payment_type: paymentMethod === 'cash' ? 1 : 2,
      promo_code: appliedPromoCode || undefined,
    };

    placeOrder(
      orderPayload,
      {
        onSuccess: response => {
          if (response.requires_payment && response.data?.payment_url) {
            setCreatedOrderId(response.data.order_id || null);
            setCreatedOrderUniqueId(response.data.unique_id || (response.data as any).temp_order_id || null);
            setPaymentError(null);
            setPaymentLoading(true);
            hasHttpErrorRef.current = false;
            paymentCompletedRef.current = false;
            setWebViewKey(prev => prev + 1);
            setPaymentUrl(response.data.payment_url);
          } else {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            
            AsyncStorage.removeItem(`special_request_${cartId}`).catch(err => {
              console.error('Failed to remove special request', err);
            });

            Toast.show({
              type: 'success',
              text1: t('checkout.orderPlaced', 'Order Placed'),
              text2: response.message || 'Your order has been placed successfully!',
            });

            const displayId = response.data?.unique_id || (response.data?.order_id ? String(response.data.order_id) : 'success');
            setSuccessOrderId(displayId);
          }
        },
        onError: error => {
          console.error('Failed to place order:', error);
        },
      },
    );
  };

  if (paymentUrl) {
    if (paymentError) {
      return (
        <PaymentFailedView
          paymentError={paymentError}
          createdOrderUniqueId={createdOrderUniqueId}
          createdOrderId={createdOrderId}
          onRetryPayment={() => {
            setPaymentLoading(true);
            hasHttpErrorRef.current = false;
            paymentCompletedRef.current = false;
            setWebViewKey(prev => prev + 1);
            setPaymentError(null);
          }}
          onBackToCheckout={() => {
            setPaymentError(null);
            setPaymentLoading(true);
            hasHttpErrorRef.current = false;
            paymentCompletedRef.current = false;
            setPaymentUrl('');
          }}
        />
      );
    }

    const injectedScript = `
      (function() {
        try {
          var meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          document.getElementsByTagName('head')[0].appendChild(meta);
        } catch(e) {}

        try {
          var bodyContent = document.body.innerText;
          window.ReactNativeWebView.postMessage(bodyContent);
        } catch(e) {}
        true;
      })();
    `;

    const handlePaymentSuccess = (orderId: number | null, uniqueId: string | null = null) => {
      paymentCompletedRef.current = true;
      setPaymentUrl('');
      setPaymentError(null);
      Toast.show({
        type: 'success',
        text1: 'Order Placed',
        text2: 'Your order has been placed successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      AsyncStorage.removeItem(`special_request_${cartId}`).catch(err => {
        console.error('Failed to remove special request', err);
      });

      const displayId = uniqueId || (orderId && orderId === createdOrderId ? createdOrderUniqueId : null) || (orderId ? String(orderId) : null) || createdOrderUniqueId || 'success';
      
      setCreatedOrderId(null);
      setCreatedOrderUniqueId(null);
      setSuccessOrderId(displayId);
    };

    const handlePaymentFailure = (message?: string) => {
      const errMsg = message || 'The payment process was unsuccessful or canceled.';
      paymentCompletedRef.current = true;
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
        let d: any;
        try {
          d = JSON.parse(rawData);
        } catch (error) {
          return;
        }

        if (d && typeof d === 'object') {
          const innerData = d.data;
          if (innerData && typeof innerData === 'object' && ('status' in innerData || 'payment_status' in innerData)) {
            const statusVal = (innerData.status || innerData.payment_status || '').toString().toLowerCase();
            const orderUniqueId = innerData.order_unique_id || innerData.unique_id || createdOrderUniqueId;
            const orderIdNum = innerData.order_id || innerData.id || createdOrderId;

            if (statusVal === 'paid' || statusVal === 'success') {
              handlePaymentSuccess(orderIdNum, orderUniqueId);
            } else {
              handlePaymentFailure(d.message || `Payment status: ${innerData.status || innerData.payment_status}`);
            }
          } else if (d.status === 'success') {
            const orderUniqueId = d.data?.order_id || d.unique_id || null;
            const orderIdNum = d.order_id || d.data?.order_id || createdOrderId;
            handlePaymentSuccess(orderIdNum, orderUniqueId || createdOrderUniqueId);
          } else if (d.status === 'failed') {
            handlePaymentFailure(d.message || 'Payment failed');
          } else if (d.success === true && !d.status) {
            const orderIdNum = d.order_id || createdOrderId;
            const uniqueId = d.unique_id || null;
            handlePaymentSuccess(orderIdNum, uniqueId || createdOrderUniqueId);
          } else if (d.success === false) {
            handlePaymentFailure(d.message || d.error);
          }
        }
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    };

    const handleNavigationStateChange = async (navState: any) => {
      const { url } = navState;
      currentUrlRef.current = url;

      const isFailure =
        url.includes('fail') ||
        url.includes('cancel') ||
        url.includes('error') ||
        url.includes('decline') ||
        url.includes('success=false') ||
        url.includes('status=failed');

      if (isFailure && !navState.loading) {
        const reasonMatch = url.match(/[?&](?:message|error|reason)=([^&#]*)/);
        const reason = reasonMatch ? decodeURIComponent(reasonMatch[1]) : undefined;
        handlePaymentFailure(reason);
      }
    };

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={t('checkout.title')}
          onBack={() => {
            setPaymentError(null);
            setPaymentLoading(true);
            hasHttpErrorRef.current = false;
            paymentCompletedRef.current = false;
            setPaymentUrl('');
          }}
          containerStyle={{
            backgroundColor: colors.background,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <WebView
          ref={webViewRef}
          key={webViewKey}
          style={{ flex: 1 }}
          source={{ uri: paymentUrl }}
          onLoadStart={() => {
            setPaymentLoading(true);
            hasHttpErrorRef.current = false;
          }}
          onLoadEnd={() => {
            setPaymentLoading(false);
            const currentUrl = currentUrlRef.current;
            const isCallback =
              (currentUrl.includes('/success') || currentUrl.includes('success=true') || currentUrl.includes('/callback')) &&
              !currentUrl.includes('fail') && !currentUrl.includes('error') && !currentUrl.includes('cancel');

            if (isCallback && webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                setTimeout(function() {
                  window.ReactNativeWebView.postMessage(document.body.innerText);
                }, 500);
                true;
              `);

              // Fallback if JSON parsing fails or backend is slow
              setTimeout(async () => {
                if (!paymentCompletedRef.current && !hasHttpErrorRef.current) {
                  const verified = await handleVerifyPayment(createdOrderId, createdOrderUniqueId, true);
                  if (verified) {
                    handlePaymentSuccess(createdOrderId, createdOrderUniqueId);
                  } else {
                    hasHttpErrorRef.current = true;
                    handlePaymentFailure('The payment process was unsuccessful or canceled.');
                  }
                }
              }, 4000);
            }
          }}
          injectedJavaScript={injectedScript}
          onMessage={onMessageHandler}
          onNavigationStateChange={handleNavigationStateChange}
          scalesPageToFit={true}
          onError={(syntheticEvent) => {
            hasHttpErrorRef.current = true;
            handlePaymentFailure('The payment process was unsuccessful or canceled.');
          }}
          onHttpError={async (syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            const errorUrl = nativeEvent.url || '';
            const statusCode = nativeEvent.statusCode;

            if (statusCode >= 400) {
              const isCallbackUrl =
                errorUrl.includes('/success') ||
                errorUrl.includes('success=true') ||
                errorUrl.includes('/callback');

              if (isCallbackUrl) {
                hasHttpErrorRef.current = true; // prevent default success flow
                setPaymentLoading(true);
                const verified = await handleVerifyPayment(createdOrderId, createdOrderUniqueId, true);
                if (verified) {
                  handlePaymentSuccess(createdOrderId, createdOrderUniqueId);
                  return;
                }
              }

              hasHttpErrorRef.current = true;
              handlePaymentFailure('The payment process was unsuccessful or canceled.');
            }
          }}
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
      <OrderSuccessView
        successOrderId={successOrderId}
        preorderDate={preorderDate}
        onGoToOrders={onGoToOrders}
        onOrderPlaced={onOrderPlaced}
        onBack={onBack}
        onGoToHome={onGoToHome}
      />
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
});

export default CheckoutScreen;
