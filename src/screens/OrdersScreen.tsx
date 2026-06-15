import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOrders } from '../hooks/queries';
import { Order, OrderItem } from '../services/api/order';
import { BASE_URL } from '../constants/api';
import { Images } from '../assets/images';
import { CustomDatePicker } from '../components/common';

interface OrdersScreenProps {
  initialDate?: string;
  onClearInitialDate?: () => void;
}

function OrdersScreen({ initialDate, onClearInitialDate }: OrdersScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string>(
    (initialDate ? initialDate.split(' ')[0].split('T')[0] : '') ||
      new Date().toISOString().split('T')[0],
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (initialDate) {
      const parsedDate = initialDate.split(' ')[0].split('T')[0];
      setSelectedDate(parsedDate);
      if (onClearInitialDate) {
        onClearInitialDate();
      }
    }
  }, [initialDate, onClearInitialDate]);

  useEffect(() => {
    const fetchCustomer = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) {
        setCustomerId(id);
      }
    };
    fetchCustomer();
  }, []);

  const {
    data: ordersResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useOrders(customerId, selectedDate);
  const orders = ordersResponse?.data?.orders || [];

  const getOrderDateDisplay = () => {
    if (orders.length > 0 && orders[0].formatted_date) {
      try {
        const datePart = orders[0].formatted_date.split(',')[0].trim();
        const parts = datePart.split(/\s+/);
        if (parts.length >= 2) {
          const day = parseInt(parts[0], 10);
          const month = parts[1];
          if (month && !isNaN(day)) {
            return `${month} ${day}`;
          }
        }
      } catch (e) {
        console.error('Error parsing formatted_date:', e);
      }
    }
    if (orders.length > 0 && orders[0].created_at) {
      const parsedDate = new Date(orders[0].created_at);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    }
    return new Date(selectedDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'accepted':
        return '#4A90E2';
      case 'processed':
        return '#FF8C42';
      case 'ready':
        return '#7ED321';
      case 'cancelled':
        return '#FF3B30';
      default:
        return colors.textMuted;
    }
  };

  const handleDateChange = (dateString: string) => {
    setSelectedDate(dateString);
    setShowCalendar(false);
  };

  const renderOrderItem = (item: OrderItem, isLast: boolean) => (
    <View
      key={item.id}
      style={[
        styles.orderItemRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      {item.product?.image && (
        <Image
          source={{ uri: `${BASE_URL}${item.product.image}` }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.itemDetails}>
        <Text
          style={[
            styles.itemName,
            { color: colors.text, fontFamily: colors.fontSemiBold },
          ]}
          numberOfLines={1}
        >
          {item.item_name}
        </Text>
        <Text
          style={[
            styles.itemDepartment,
            { color: colors.textMuted, fontFamily: colors.fontRegular },
          ]}
        >
          {item.product?.department?.name_en || ''}
        </Text>
        <Text
          style={[
            styles.itemQuantity,
            { color: colors.textMuted, fontFamily: colors.fontRegular },
          ]}
        >
          Qty: {item.item_quantity}
        </Text>
      </View>
      <Text
        style={[
          styles.itemPrice,
          { color: colors.text, fontFamily: colors.fontSemiBold },
        ]}
      >
        {parseFloat(item.item_grand_total).toFixed(2)} QAR
      </Text>
    </View>
  );

  const renderOrderCard = (order: Order) => {
    const statusColor = getStatusColor(order.tracking_status_text);
    const isExpanded = expandedOrderId === order.id;
    const itemsToShow = isExpanded ? order.items : [order.items[0]];

    return (
      <View
        key={order.id}
        style={[styles.orderCard, { backgroundColor: colors.card }]}
      >
        <TouchableOpacity
          onPress={() => setExpandedOrderId(isExpanded ? null : order.id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <Text
                style={[
                  styles.orderNumber,
                  { color: colors.text, fontFamily: colors.fontSemiBold },
                ]}
              >
                Order #{order.unique_id}
              </Text>
              <Text
                style={[
                  styles.orderDate,
                  { color: colors.textMuted, fontFamily: colors.fontRegular },
                ]}
              >
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: statusColor,
                  backgroundColor: statusColor + '15',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColor, fontFamily: colors.fontMedium },
                ]}
              >
                {order.tracking_status_text}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.orderItemsContainer}>
          {itemsToShow.map((item, index) =>
            renderOrderItem(item, index === itemsToShow.length - 1),
          )}
        </View>

        {order.items.length > 1 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setExpandedOrderId(isExpanded ? null : order.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.expandButtonText,
                { color: colors.primary, fontFamily: colors.fontMedium },
              ]}
            >
              {isExpanded
                ? 'Show Less'
                : `+ ${order.items.length - 1} more items`}
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.orderTotal, { borderTopColor: colors.border }]}>
          <Text
            style={[
              styles.totalLabel,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
            Total Amount
          </Text>
          <Text
            style={[
              styles.totalPrice,
              { color: colors.primary, fontFamily: colors.fontBold },
            ]}
          >
            {parseFloat(order.grand_total).toFixed(2)} QAR
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + sh(12),
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('home.ordersTab')}
        </Text>
        <TouchableOpacity
          style={[styles.calendarButton, { backgroundColor: colors.card }]}
          onPress={() => setShowCalendar(true)}
          activeOpacity={0.7}
        >
          <Image
            source={Images.calendar}
            style={[styles.calendarIcon, { tintColor: colors.text }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <CustomDatePicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelect={handleDateChange}
        mode="any"
        selectedDate={selectedDate}
      />

      {isLoading || isRefetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No orders found for this date
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + sh(20), flexGrow: 1 },
          ]}
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
          {orders.map(renderOrderCard)}

          {/* Order Date Info */}
          <View style={styles.dateInfoContainer}>
            <View style={styles.dateInfo}>
              <Text style={[styles.dateLabel, { color: colors.text }]}>
                Ordered on:{' '}
                {getOrderDateDisplay()}
              </Text>
            </View>
            <View style={styles.dateInfo}>
              <Text style={[styles.dateLabel, { color: colors.text }]}>
                Delivery:{' '}
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sw(20),
    paddingBottom: sh(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: fs(24),
    fontWeight: '600',
  },
  calendarButton: {
    padding: sw(8),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(8),
  },
  calendarIcon: {
    width: sw(24),
    height: sw(24),
    tintColor: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    width: sw(320),
    borderRadius: sw(16),
    padding: sw(20),
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: fs(20),
    marginBottom: sh(16),
    textAlign: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: sh(20),
  },
  dateOption: {
    width: '23%',
    paddingVertical: sh(12),
    borderRadius: sw(8),
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: sh(8),
  },
  dateText: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  closeButton: {
    paddingVertical: sh(12),
    borderRadius: sw(8),
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sw(40),
  },
  emptyText: {
    fontSize: fs(16),
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: sw(20),
  },
  orderCard: {
    borderRadius: sw(16),
    marginBottom: sh(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: sw(16),
    paddingBottom: sh(12),
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: fs(16),
    marginBottom: sh(4),
  },
  orderDate: {
    fontSize: fs(12),
  },
  orderItemsContainer: {
    paddingHorizontal: sw(16),
  },
  orderItemRow: {
    flexDirection: 'row',
    paddingVertical: sh(12),
  },
  itemImage: {
    width: sw(60),
    height: sw(60),
    borderRadius: sw(8),
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    flex: 1,
    marginLeft: sw(12),
    justifyContent: 'center',
  },
  itemName: {
    fontSize: fs(14),
    marginBottom: sh(2),
  },
  itemDepartment: {
    fontSize: fs(11),
    marginBottom: sh(2),
  },
  itemQuantity: {
    fontSize: fs(11),
  },
  itemPrice: {
    fontSize: fs(14),
    alignSelf: 'center',
  },
  expandButton: {
    paddingVertical: sh(12),
    paddingHorizontal: sw(16),
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: fs(13),
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: sw(16),
    borderTopWidth: 1,
    marginTop: sh(4),
  },
  totalLabel: {
    fontSize: fs(14),
  },
  totalPrice: {
    fontSize: fs(18),
  },
  statusBadge: {
    paddingHorizontal: sw(12),
    paddingVertical: sh(6),
    borderRadius: sw(16),
    borderWidth: 0.5,
  },
  statusText: {
    fontSize: fs(12),
  },
  dateInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: sh(20),
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fs(14),
    fontWeight: '500',
  },
});

export default OrdersScreen;
