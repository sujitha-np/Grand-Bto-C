import React, { useEffect, useState } from 'react';
import {
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
import CartScreen from './src/screens/CartScreen';
import { useTheme } from './src/hooks/useTheme';
import { fs, sw, sh } from './src/utils/responsive';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      text1Style={{ fontSize: 16 }}
      text2Style={{ fontSize: 14 }}
      text2NumberOfLines={0}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      text1Style={{ fontSize: 16 }}
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
        onLogout={() => {
          setCustomerId(null);
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

function MainApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useTheme();

  if (subScreen === 'accountInfo') {
    return <AccountInfoScreen onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'cart') {
    return <CartScreen onBack={() => setSubScreen(null)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomeScreen onShowCart={() => setSubScreen('cart')} />
        )}
        {activeTab === 'orders' && <OrdersScreen />}
        {activeTab === 'account' && (
          <AccountScreen
            onLogout={onLogout}
            onAccountInfo={() => setSubScreen('accountInfo')}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: 'white',
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
