import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  I18nManager,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './src/i18n';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import AccountScreen from './src/screens/AccountScreen';
import AccountInfoScreen from './src/screens/AccountInfoScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import LoyaltyPointsScreen from './src/screens/LoyaltyPointsScreen';
import CartScreen from './src/screens/CartScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SavedAddressScreen from './src/screens/SavedAddressScreen';
import NewAddressScreen from './src/screens/NewAddressScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import OfferedProductsScreen from './src/screens/OfferedProductsScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import CouponScreen from './src/screens/CouponScreen';
import PromoCodesScreen from './src/screens/PromoCodesScreen';
import { SavedAddress } from './src/services/api/address';
import { Product } from './src/services/api/product';
import { cartService } from './src/services/api/cart';
import { useTheme } from './src/hooks/useTheme';
import { useAddToCart, useProducts } from './src/hooks/queries';
import { fs, sw, sh } from './src/utils/responsive';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents } from './src/services/api/authEvents';

// Wrap global fetch to intercept 401 Unauthorized responses
const originalFetch = (globalThis as any).fetch;
(globalThis as any).fetch = async (input: any, init?: any) => {
  try {
    const response = await originalFetch(input, init);
    if (response && response.status === 401) {
      console.log('Global Fetch Interceptor - 401 Unauthorized detected!');
      authEvents.emitUnauthorized();
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#FF7B00' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: '600' }}
      text1NumberOfLines={0}
      text2Style={{ fontSize: 14 }}
      text2NumberOfLines={0}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FF0000' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: '600' }}
      text1NumberOfLines={0}
      text2Style={{ fontSize: 14 }}
      text2NumberOfLines={0}
    />
  ),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

type Screen =
  | 'splash'
  | 'welcome'
  | 'settings'
  | 'register'
  | 'login'
  | 'otp'
  | 'home';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SafeAreaProvider>
          <AppContent />
          <Toast config={toastConfig} />
        </SafeAreaProvider>
      </Provider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [customerId, setCustomerId] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = authEvents.subscribe(() => {
      setCustomerId(null);
      setScreen('welcome');
      queryClient.clear();
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please log in again.',
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const currentLanguage = store.getState().language.current;
    const isRTL = currentLanguage === 'ar';
    I18nManager.forceRTL(isRTL);

    const checkAuthStatus = async () => {
      try {
        const storedId = await AsyncStorage.getItem('customerId');
        if (storedId) {
          setCustomerId(Number(storedId));
          setScreen('home');
        }
      } catch (e) {
        // ignore storage errors
      }
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      if (screen === 'settings' || screen === 'register' || screen === 'login') {
        setScreen('welcome');
        return true;
      }
      if (screen === 'otp') {
        setScreen('login');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, [screen]);

  if (screen === 'splash') {
    return <SplashScreen onGetStarted={() => setScreen('welcome')} />;
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('welcome')} />;
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        onBack={() => setScreen('welcome')}
        onNext={() => setScreen('login')}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onBack={() => setScreen('welcome')}
        onLogin={(id: number) => {
          setCustomerId(id);
          setScreen('otp');
        }}
      />
    );
  }

  if (screen === 'otp') {
    return (
      <OTPScreen
        customerId={customerId}
        onBack={() => setScreen('login')}
        onContinue={() => setScreen('home')}
      />
    );
  }

  if (screen === 'home') {
    return (
      <MainApp
        customerId={customerId}
        onLogout={() => {
          AsyncStorage.removeItem('customerId');
          AsyncStorage.removeItem('userToken');
          setCustomerId(null);
          queryClient.clear();
          setScreen('welcome');
        }}
      />
    );
  }

  return (
    <WelcomeScreen
      onLogin={() => setScreen('login')}
      onRegister={() => setScreen('register')}
      onSettings={() => setScreen('settings')}
    />
  );
}

type Tab = 'home' | 'orders' | 'account';

function MainApp({ onLogout, customerId }: { onLogout: () => void; customerId: number | null }) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>('');
  const [ordersSelectedDate, setOrdersSelectedDate] = useState<string | undefined>(undefined);
  const [editAddress, setEditAddress] = useState<SavedAddress | undefined>();
  const [selectedAddress, setSelectedAddress] = useState<
    SavedAddress | undefined
  >();
  const [cartIdForCheckout, setCartIdForCheckout] = useState<string>('');
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<{
    offerId: number;
    offerName: string;
  } | null>(null);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();
  const { mutateAsync: addToCart } = useAddToCart();
  const { data: allProductsData } = useProducts();

  useEffect(() => {
    const handleBackPress = () => {
      if (
        subScreen === 'accountInfo' ||
        subScreen === 'settings' ||
        subScreen === 'feedback' ||
        subScreen === 'orderHistory' ||
        subScreen === 'loyaltyPoints' ||
        subScreen === 'wishlist' ||
        subScreen === 'cart'
      ) {
        setSubScreen(null);
        return true;
      }
      if (subScreen === 'offeredProducts') {
        setSelectedOffer(null);
        setSubScreen(null);
        return true;
      }
      if (subScreen === 'coupons') {
        setSubScreen(null);
        return true;
      }
      if (subScreen === 'promoCodes') {
        setSubScreen('checkout');
        return true;
      }
      if (subScreen === 'productDetail') {
        setSelectedProduct(null);
        setSubScreen(null);
        return true;
      }
      if (subScreen === 'calendar') {
        setSubScreen('cart');
        return true;
      }
      if (subScreen === 'savedAddress') {
        setSubScreen('calendar');
        return true;
      }
      if (subScreen === 'newAddress') {
        setEditAddress(undefined);
        setSubScreen('savedAddress');
        return true;
      }
      if (subScreen === 'checkout') {
        setSubScreen('savedAddress');
        return true;
      }

      if (subScreen === null && activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, [subScreen, selectedAddress, activeTab]);

  if (subScreen === 'accountInfo') {
    return <AccountInfoScreen onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'settings') {
    return <SettingsScreen onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'feedback') {
    return <FeedbackScreen onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'orderHistory') {
    return <OrderHistoryScreen onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'loyaltyPoints') {
    console.log('Rendering LoyaltyPointsScreen');
    return <LoyaltyPointsScreen onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'offeredProducts' && selectedOffer) {
    return (
      <OfferedProductsScreen
        offerId={selectedOffer.offerId}
        offerName={selectedOffer.offerName}
        onBack={() => {
          setSelectedOffer(null);
          setSubScreen(null);
        }}
        onShowProductDetail={product => {
          setSelectedProduct(product);
          setSubScreen('productDetail');
        }}
      />
    );
  }

  if (subScreen === 'wishlist') {
    return (
      <WishlistScreen
        onBack={() => setSubScreen(null)}
        onShowProductDetail={productId => {
          const products =
            allProductsData?.products || allProductsData?.data || [];
          const matchedProduct = products.find((p: any) => p.id === productId);
          if (matchedProduct) {
            setSelectedProduct(matchedProduct);
            setSubScreen('productDetail');
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Product details not found',
            });
          }
        }}
      />
    );
  }

  if (subScreen === 'coupons') {
    return <CouponScreen onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'promoCodes') {
    return (
      <PromoCodesScreen
        onBack={() => setSubScreen('checkout')}
        onSelectPromo={code => {
          setSelectedPromoCode(code);
          setSubScreen('checkout');
        }}
      />
    );
  }

  if (subScreen === 'productDetail' && selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct as any}
        onBack={() => {
          setSelectedProduct(null);
          setSubScreen(null);
        }}
        onAddToCart={async (productId: number, quantity: number) => {
          if (customerId) {
            const today = new Date().toISOString().split('T')[0];
            try {
              await addToCart({
                customerId: String(customerId),
                productId: productId.toString(),
                quantity: quantity.toString(),
                preorderDate: today,
              });
              Toast.show({
                type: 'success',
                text1: 'Added to Cart',
                text2: `${quantity}x ${selectedProduct.name_en}`,
              });
              setSelectedProduct(null);
              setSubScreen('cart');
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Failed to add to cart',
                text2: err?.message || 'Unknown error',
              });
            }
          }
        }}
      />
    );
  }

  if (subScreen === 'calendar') {
    return (
      <CalendarScreen
        onBack={() => setSubScreen('cart')}
        totalAmount={cartTotal}
        cartId={cartIdForCheckout}
        customerId={customerId ? String(customerId) : undefined}
        onCheckout={selectedDate => {
          setSelectedDeliveryDate(selectedDate);
          setSubScreen('savedAddress');
        }}
      />
    );
  }

  if (subScreen === 'savedAddress') {
    return (
      <SavedAddressScreen
        onBack={() => setSubScreen('calendar')}
        totalAmount={cartTotal}
        selectedDate={selectedDeliveryDate}
        onAddNew={() => {
          setEditAddress(undefined);
          setSubScreen('newAddress');
        }}
        onEditAddress={address => {
          setEditAddress(address);
          setSubScreen('newAddress');
        }}
        onProceedToCheckout={address => {
          setSelectedAddress(address);
          setSubScreen('checkout');
        }}
      />
    );
  }

  if (subScreen === 'newAddress') {
    return (
      <NewAddressScreen
        onBack={() => {
          setEditAddress(undefined);
          setSubScreen('savedAddress');
        }}
        editAddress={editAddress}
        onAddNew={() => {
          setEditAddress(undefined);
        }}
        onSave={addressData => {
          console.log('Address saved:', addressData);
          setEditAddress(undefined);
          setSubScreen('savedAddress');
        }}
      />
    );
  }

  if (subScreen === 'checkout') {
    if (!selectedAddress) {
      setSubScreen('savedAddress');
      return null;
    }

    return (
      <CheckoutScreen
        onBack={() => setSubScreen('savedAddress')}
        selectedAddress={selectedAddress}
        cartId={cartIdForCheckout}
        preorderDate={selectedDeliveryDate}
        onViewAllPromos={() => setSubScreen('promoCodes')}
        preFilledPromoCode={selectedPromoCode}
        onGoToHome={() => {
          setSubScreen(null);
          setActiveTab('home');
        }}
        onGoToOrders={(preorderDate) => {
          if (preorderDate) {
            setOrdersSelectedDate(preorderDate);
          }
          setSubScreen(null);
          setActiveTab('orders');
        }}
      />
    );
  }

  if (subScreen === 'cart') {
    return (
      <CartScreen
        onBack={() => setSubScreen(null)}
        onSelectDate={(total, cartId) => {
          setCartTotal(total);
          setCartIdForCheckout(cartId);
          setSubScreen('calendar');
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomeScreen
            onShowCart={() => setSubScreen('cart')}
            onShowProductDetail={product => {
              setSelectedProduct(product);
              setSubScreen('productDetail');
            }}
            onShowOfferedProducts={(offerId, offerName) => {
              setSelectedOffer({ offerId, offerName });
              setSubScreen('offeredProducts');
            }}
            onShowWishlist={() => setSubScreen('wishlist')}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersScreen
            initialDate={ordersSelectedDate}
            onClearInitialDate={() => setOrdersSelectedDate(undefined)}
          />
        )}
        {activeTab === 'account' && (
          <AccountScreen
            onLogout={onLogout}
            onAccountInfo={() => setSubScreen('accountInfo')}
            onSettings={() => setSubScreen('settings')}
            onFeedback={() => setSubScreen('feedback')}
            onOrderHistory={() => setSubScreen('orderHistory')}
            onLoyaltyPoints={() => {
              console.log('onLoyaltyPoints called in App.tsx');
              setSubScreen('loyaltyPoints');
            }}
            onCoupons={() => setSubScreen('coupons')}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom,
            borderTopColor: colors.borderSubtle,
          },
        ]}
      >
        <TabItem
          label={t('home.homeTab')}
          icon={require('./src/assets/images/home.png')}
          activeIcon={require('./src/assets/images/home_active.png')}
          isActive={activeTab === 'home'}
          onPress={() => setActiveTab('home')}
          colors={colors}
        />
        <TabItem
          label={t('home.ordersTab')}
          icon={require('./src/assets/images/order.png')}
          activeIcon={require('./src/assets/images/order_active.png')}
          isActive={activeTab === 'orders'}
          onPress={() => setActiveTab('orders')}
          colors={colors}
        />
        <TabItem
          label={t('home.accountTab')}
          icon={require('./src/assets/images/account.png')}
          activeIcon={require('./src/assets/images/account_active.png')}
          isActive={activeTab === 'account'}
          onPress={() => setActiveTab('account')}
          colors={colors}
        />
      </View>
    </View>
  );
}

function TabItem({
  label,
  icon,
  activeIcon,
  isActive,
  onPress,
  colors,
}: {
  label: string;
  icon: ImageSourcePropType;
  activeIcon: ImageSourcePropType;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={isActive ? activeIcon : icon}
        style={[
          styles.tabIconImage,
          !isActive && { tintColor: colors.textMuted },
        ]}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? colors.primary : colors.text,
            fontFamily: colors.fontSemiBold,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: sh(10),
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(12),
    paddingVertical: sh(4),
  },
  tabIconImage: {
    width: sw(40),
    height: sw(40),
    marginBottom: sh(2),
  },
  tabLabel: {
    fontSize: fs(11),
  },
});

export default App;
