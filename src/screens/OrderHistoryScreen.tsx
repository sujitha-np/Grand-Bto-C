import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOrderHistory, useOrders } from '../hooks/queries';
import { Order } from '../services/api/order';
import { BASE_URL } from '../constants/api';
import { Images } from '../assets/images';
import { CustomDatePicker } from '../components/common';

interface OrderHistoryScreenProps {
  onBack?: () => void;
}

type FilterType = 'all' | 'completed' | 'cancelled';

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined,
  );

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  useEffect(() => {
    const fetchCustomer = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) {
        setCustomerId(id);
      }
    };
    fetchCustomer();
  }, []);

  // Use different hooks based on whether date is selected
  const {
    data: allOrdersResponse,
    isLoading: isLoadingAll,
    refetch: refetchAll,
    isRefetching: isRefetchingAll,
  } = useOrderHistory(customerId);

  const {
    data: dateOrdersResponse,
    isLoading: isLoadingDate,
    refetch: refetchDate,
    isRefetching: isRefetchingDate,
  } = useOrders(customerId, selectedDate);

  // Use date-filtered orders if date is selected, otherwise use all orders
  const ordersResponse = selectedDate ? dateOrdersResponse : allOrdersResponse;
  const isLoading = selectedDate ? isLoadingDate : isLoadingAll;
  const isRefetching = selectedDate ? isRefetchingDate : isRefetchingAll;
  const refetch = selectedDate ? refetchDate : refetchAll;

  const allOrders = ordersResponse?.data?.orders || [];

  // Filter orders based on selected filter
  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return allOrders;

    if (selectedFilter === 'completed') {
      return allOrders.filter(order => {
        const status = order.tracking_status_text.toLowerCase();
        return (
          status === 'completed' || status === 'delivered' || status === 'ready'
        );
      });
    }

    if (selectedFilter === 'cancelled') {
      return allOrders.filter(
        order => order.tracking_status_text.toLowerCase() === 'cancelled',
      );
    }

    return allOrders;
  }, [allOrders, selectedFilter]);

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const grouped: { [key: string]: Order[] } = {};

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.order_date);
      const dateKey = orderDate
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(order);
    });

    return grouped;
  }, [filteredOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Reset filters to show all orders
    setSelectedFilter('all');
    setSelectedDate(undefined);
    try {
      if (refetchAll) {
        await refetchAll();
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'delivered') {
      return colors.success;
    }
    if (statusLower === 'cancelled') {
      return '#FF3B30';
    }
    return '#FFA500';
  };

  const getStatusBgColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'delivered') {
      return '#E8F5E9';
    }
    if (statusLower === 'cancelled') {
      return '#FFEBEE';
    }
    return '#FFF3E0';
  };

  const renderFilterTab = (filter: FilterType, label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterTab,
        selectedFilter === filter && styles.filterTabActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterTabText,
          selectedFilter === filter && styles.filterTabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = (item: any, status: string) => {
    const isCompleted =
      status.toLowerCase() === 'completed' ||
      status.toLowerCase() === 'delivered';
    const isCancelled = status.toLowerCase() === 'cancelled';

    return (
      <View key={item.id} style={styles.orderItem}>
        <Image
          source={{ uri: `${BASE_URL}${item.product.image}` }}
          style={styles.orderItemImage}
        />
        <View style={styles.orderItemDetails}>
          <Text style={styles.orderItemName}>{item.item_name}</Text>
          <Text style={styles.orderItemQuantity}>x{item.item_quantity}</Text>
          {isCompleted && (
            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: getStatusColor('completed'),
                  backgroundColor: getStatusBgColor('completed'),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor('completed') },
                ]}
              >
                {t('orderHistory.completed')}
              </Text>
            </View>
          )}
          {isCancelled && (
            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: getStatusColor('cancelled'),
                  backgroundColor: getStatusBgColor('cancelled'),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor('cancelled') },
                ]}
              >
                {t('orderHistory.cancelled')}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.orderItemPrice,
            isCancelled && styles.orderItemPriceCancelled,
          ]}
        >
          {parseFloat(item.item_grand_total).toFixed(2)}{' '}
          {t('orderHistory.currency')}
        </Text>
      </View>
    );
  };

  const renderOrder = (order: Order) => {
    const total = parseFloat(order.grand_total);

    return (
      <View key={order.id} style={styles.orderCard}>
        {order.items.map(item =>
          renderOrderItem(item, order.tracking_status_text),
        )}

        <View style={styles.orderTotal}>
          <Text style={styles.orderTotalLabel}>{t('orderHistory.total')}</Text>
          <Text style={styles.orderTotalAmount}>
            {total.toFixed(2)} {t('orderHistory.currency')}
          </Text>
        </View>
      </View>
    );
  };

  if ((isLoading || isRefetching) && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orderHistory.title')}</Text>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => setShowCalendar(true)}
          activeOpacity={0.7}
        >
          <Image source={Images.calendar} style={styles.calendarIcon} />
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <CustomDatePicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelect={dateString => {
          setSelectedDate(dateString);
          setShowCalendar(false);
        }}
        mode="any"
        selectedDate={selectedDate}
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterTab('all', t('orderHistory.allOrders'))}
        {renderFilterTab('completed', t('orderHistory.completed'))}
        {renderFilterTab('cancelled', t('orderHistory.cancelled'))}
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {Object.keys(ordersByDate).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {t('orderHistory.noOrders')}
            </Text>
          </View>
        ) : (
          Object.entries(ordersByDate).map(([date, orders]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {orders.map(order => renderOrder(order))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sw(16),
      paddingTop: insets.top + sh(10),
      paddingBottom: sh(16),
      backgroundColor: colors.background,
    },
    backButton: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(20),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    backIcon: {
      fontSize: fs(24),
      fontFamily: colors.fontRegular,
      color: colors.text,
    },
    headerTitle: {
      fontSize: fs(18),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    calendarButton: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(8),
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calendarIcon: {
      width: sw(24),
      height: sw(24),
      tintColor: colors.text,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: sw(20),
      paddingVertical: sh(16),
      gap: sw(12),
    },
    filterTab: {
      paddingHorizontal: sw(20),
      paddingVertical: sh(10),
      borderRadius: sw(20),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterTabText: {
      fontSize: fs(14),
      fontFamily: colors.fontMedium,
      color: colors.text,
    },
    filterTabTextActive: {
      color: colors.white,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: sw(20),
      paddingBottom: sh(40),
    },
    dateGroup: {
      marginBottom: sh(24),
    },
    dateHeader: {
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
      marginBottom: sh(12),
    },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: sw(12),
      padding: sw(16),
      marginBottom: sh(12),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    orderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sh(12),
    },
    orderItemImage: {
      width: sw(60),
      height: sw(60),
      borderRadius: sw(8),
      backgroundColor: colors.surface,
    },
    orderItemDetails: {
      flex: 1,
      marginLeft: sw(12),
    },
    orderItemName: {
      fontSize: fs(14),
      fontFamily: colors.fontMedium,
      color: colors.text,
      marginBottom: sh(4),
    },
    orderItemQuantity: {
      fontSize: fs(12),
      fontFamily: colors.fontRegular,
      color: colors.textMuted,
    },
    statusBadge: {
      paddingHorizontal: sw(12),
      paddingVertical: sh(4),
      borderRadius: sw(12),
      alignSelf: 'flex-start',
      marginTop: sh(4),
    },
    statusText: {
      fontSize: fs(11),
      fontFamily: colors.fontMedium,
    },
    orderItemPrice: {
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
    },
    orderItemPriceCancelled: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    orderTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: sh(12),
      marginTop: sh(8),
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    orderTotalLabel: {
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
    },
    orderTotalAmount: {
      fontSize: fs(16),
      fontFamily: colors.fontBold,
      color: colors.text,
    },
    emptyState: {
      paddingVertical: sh(60),
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: fs(14),
      fontFamily: colors.fontMedium,
      color: colors.textMuted,
    },
  });

export default OrderHistoryScreen;
