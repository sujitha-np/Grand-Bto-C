import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import Header from '../components/common/Header';
import { useCartCheckout, usePreorderLimit } from '../hooks/queries';
import { NonDeliverableProduct } from '../services/api/checkout';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarScreenProps {
  onBack: () => void;
  totalAmount: number;
  onCheckout: (selectedDate: string) => void;
  cartId?: string;
  customerId?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 8; // 8 AM to 10 PM
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h <= 12 ? h : h - 12;
  return { label: `${display}:00 ${suffix}`, value: h };
});

const MINUTES = [
  { label: ':00', value: 0 },
  { label: ':15', value: 15 },
  { label: ':30', value: 30 },
  { label: ':45', value: 45 },
];

const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onBack,
  totalAmount,
  onCheckout,
  cartId,
  customerId: propCustomerId,
}) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { mutate: validateCheckout, isPending: validating } = useCartCheckout();
  const { data: preorderLimitData, isLoading: loadingLimit } = usePreorderLimit();
  const [customerId, setCustomerId] = useState<string | null>(propCustomerId || null);

  useEffect(() => {
    if (propCustomerId) {
      setCustomerId(propCustomerId);
    } else {
      AsyncStorage.getItem('customerId').then(id => {
        if (id) setCustomerId(id);
      });
    }
  }, [propCustomerId]);

  const getQatarDate = (): Date => {
    const now = new Date();
    const localOffsetMinutes = -now.getTimezoneOffset();
    const qatarOffsetMinutes = 180;
    const diffMs = (qatarOffsetMinutes - localOffsetMinutes) * 60000;
    return new Date(now.getTime() + diffMs);
  };

  const today = getQatarDate();

  const maxPreorderDate = useMemo(() => {
    if (preorderLimitData?.max_preorder_date) {
      const parts = preorderLimitData.max_preorder_date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day, 23, 59, 59, 999);
      }
    }
    // Fallback to today + 14 days
    const fallback = getQatarDate();
    fallback.setDate(fallback.getDate() + 14);
    fallback.setHours(23, 59, 59, 999);
    return fallback;
  }, [preorderLimitData]);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [conflictModal, setConflictModal] = useState<{
    visible: boolean;
    nonDeliverableProducts: NonDeliverableProduct[];
    requestedDelivery: string;
    suggestion: string;
  }>({
    visible: false,
    nonDeliverableProducts: [],
    requestedDelivery: '',
    suggestion: '',
  });

  const isSelectedDateToday = useMemo(() => {
    if (!selectedDate) return false;
    const now = getQatarDate();
    return (
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear()
    );
  }, [selectedDate]);

  const availableHours = useMemo(() => {
    if (!isSelectedDateToday) return HOURS;
    const now = getQatarDate();
    const curHour = now.getHours();
    const curMin = now.getMinutes();

    return HOURS.filter(h => {
      if (h.value > curHour) return true;
      if (h.value === curHour) {
        return curMin < 45;
      }
      return false;
    });
  }, [isSelectedDateToday]);

  const availableMinutes = useMemo(() => {
    if (selectedHour === null) return [];
    if (!isSelectedDateToday) return MINUTES;

    const now = getQatarDate();
    const curHour = now.getHours();
    const curMin = now.getMinutes();

    if (selectedHour === curHour) {
      return MINUTES.filter(m => m.value > curMin);
    }

    return MINUTES;
  }, [selectedHour, isSelectedDateToday]);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedHour(null);
    setSelectedMinute(null);
  };

  const handleToday = () => {
    const now = getQatarDate();
    setSelectedDate(now);
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedHour(null);
    setSelectedMinute(null);
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
    setSelectedHour(null);
    setSelectedMinute(null);
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    if (date < todayStart) return true;

    if (maxPreorderDate && date > maxPreorderDate) {
      return true;
    }
    return false;
  };

  const formatShortDate = (date: Date | null) => {
    if (!date) return '—';
    const monthShort = monthNames[date.getMonth()].substring(0, 3);
    return `${monthShort} ${date.getDate()}`;
  };

  const formatSelectedTime = () => {
    if (selectedHour === null || selectedMinute === null) return '—';
    const suffix = selectedHour < 12 ? 'AM' : 'PM';
    const display = selectedHour <= 12 ? selectedHour : selectedHour - 12;
    return `${display}:${String(selectedMinute).padStart(2, '0')} ${suffix}`;
  };

  const renderCalendarDays = () => {
    const rows: React.ReactNode[] = [];
    let cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelectedDate(day);
      const past = isPastDate(day);

      cells.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            selected && [
              styles.selectedDay,
              { backgroundColor: colors.primary },
            ],
          ]}
          onPress={() => !past && handleDateSelect(day)}
          disabled={past}
        >
          <Text
            style={[
              styles.dayText,
              {
                color: selected
                  ? '#FFFFFF'
                  : past
                  ? '#D0D0D0'
                  : colors.darkBrown,
                fontFamily:
                  isToday(day) || selected
                    ? colors.fontSemiBold
                    : colors.fontRegular,
              },
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>,
      );

      if ((firstDayOfMonth + day) % 7 === 0) {
        rows.push(
          <View key={`row-${rows.length}`} style={styles.weekRow}>
            {cells}
          </View>,
        );
        cells = [];
      }
    }

    if (cells.length > 0) {
      while (cells.length < 7) {
        cells.push(
          <View key={`empty-end-${cells.length}`} style={styles.dayCell} />,
        );
      }
      rows.push(
        <View key={`row-${rows.length}`} style={styles.weekRow}>
          {cells}
        </View>,
      );
    }

    return rows;
  };

  const handleCheckout = () => {
    if (selectedDate && selectedHour !== null && selectedMinute !== null) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${selectedDate.getFullYear()}-${pad(
        selectedDate.getMonth() + 1,
      )}-${pad(selectedDate.getDate())} ${pad(selectedHour)}:${pad(
        selectedMinute,
      )}:00`;

      if (!customerId || !cartId) {
        console.log('[CalendarScreen] handleCheckout - missing customerId or cartId:', { customerId, cartId });
        onCheckout(dateStr);
        return;
      }

      const deliveryDate = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
      const deliveryTime = `${pad(selectedHour)}:${pad(selectedMinute)}`;

      validateCheckout(
        {
          customer_id: String(customerId),
          cart_id: cartId,
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
        },
        {
          onSuccess: res => {
            if (
              res &&
              !res.success &&
              res.error_code === 'PREPARATION_TIME_CONFLICT' &&
              res.non_deliverable_products?.length
            ) {
              setConflictModal({
                visible: true,
                nonDeliverableProducts: res.non_deliverable_products,
                requestedDelivery: res.requested_delivery || dateStr,
                suggestion: res.suggestion || '',
              });
            } else {
              onCheckout(dateStr);
            }
          },
          onError: (error: any) => {
            console.log('[CalendarScreen] validateCheckout onError:', error);
            const res = error?.data;
            console.log('[CalendarScreen] validateCheckout onError parsed res:', res);
            if (
              res &&
              !res.success &&
              res.error_code === 'PREPARATION_TIME_CONFLICT' &&
              res.non_deliverable_products?.length
            ) {
              setConflictModal({
                visible: true,
                nonDeliverableProducts: res.non_deliverable_products,
                requestedDelivery: res.requested_delivery || dateStr,
                suggestion: res.suggestion || '',
              });
            } else {
              // On network/server error, allow user to proceed
              onCheckout(dateStr);
            }
          },
        },
      );
    }
  };

  const canCheckout =
    selectedDate !== null && selectedHour !== null && selectedMinute !== null;

  if (loadingLimit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Calendar"
          onBack={onBack}
          containerStyle={{
            backgroundColor: colors.background,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: sh(120) }}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <Header
        title="Calendar"
        onBack={onBack}
        containerStyle={{
          backgroundColor: colors.background,
          paddingBottom: sh(16),
          paddingTop: insets.top + sh(12),
        }}
      />

      {/* Calendar Card */}
      <View style={[styles.calendarCard, { borderColor: colors.borderSubtle }]}>
        {/* Month Navigation */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navArrow}>
            <Text style={[styles.navArrowText, { color: colors.darkBrown }]}>
              {'<'}
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.monthTitle,
              { color: colors.darkBrown, fontFamily: colors.fontSemiBold },
            ]}
          >
            {monthNames[currentMonth]}, {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navArrow}>
            <Text style={[styles.navArrowText, { color: colors.darkBrown }]}>
              {'>'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day of Week Headers */}
        <View style={styles.weekRow}>
          {DAYS_OF_WEEK.map(day => (
            <View key={day} style={styles.dayCell}>
              <Text
                style={[
                  styles.weekDayText,
                  { color: colors.darkBrown, fontFamily: colors.fontSemiBold },
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        {renderCalendarDays()}

        {/* Clear / Today */}
        <View style={styles.clearTodayRow}>
          <TouchableOpacity onPress={handleClear}>
            <Text
              style={[
                styles.clearText,
                { color: colors.primary, fontFamily: colors.fontRegular },
              ]}
            >
              Clear
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToday}>
            <Text
              style={[
                styles.todayText,
                { color: colors.darkBrown, fontFamily: colors.fontRegular },
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Order / Delivery Info */}
      <View style={styles.infoRow}>
        <View>
          <Text
            style={[
              styles.infoLabel,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
            Ordered on:
          </Text>
          <Text
            style={[
              styles.infoDate,
              { color: colors.darkBrown, fontFamily: colors.fontSemiBold },
            ]}
          >
            {formatShortDate(today)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={[
              styles.infoLabel,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
            Delivery:
          </Text>
          <Text
            style={[
              styles.infoDate,
              { color: colors.darkBrown, fontFamily: colors.fontSemiBold },
            ]}
          >
            {formatShortDate(selectedDate)}
          </Text>
        </View>
      </View>

      {/* Time Picker — only shown after date selected */}
      {selectedDate && (
        <View
          style={[styles.timePickerCard, { borderColor: colors.borderSubtle }]}
        >
          <Text
            style={[
              styles.timePickerTitle,
              { color: colors.darkBrown, fontFamily: colors.fontSemiBold },
            ]}
          >
            Select Time
          </Text>

          {/* Hour selector */}
          <Text
            style={[
              styles.timeLabel,
              { color: colors.textMuted, fontFamily: colors.fontRegular },
            ]}
          >
            Hour
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeRow}
          >
            {availableHours.map(h => {
              const active = selectedHour === h.value;
              return (
                <TouchableOpacity
                  key={h.value}
                  style={[
                    styles.timeChip,
                    {
                      borderColor: active
                        ? colors.primary
                        : colors.borderSubtle,
                    },
                    active && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSelectedHour(h.value)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      {
                        color: active ? '#FFFFFF' : colors.darkBrown,
                        fontFamily: active
                          ? colors.fontSemiBold
                          : colors.fontRegular,
                      },
                    ]}
                  >
                    {h.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Minute selector — only shown after hour selected */}
          {selectedHour !== null && (
            <>
              <Text
                style={[
                  styles.timeLabel,
                  {
                    color: colors.textMuted,
                    fontFamily: colors.fontRegular,
                    marginTop: sh(12),
                  },
                ]}
              >
                Minute
              </Text>
              <View style={styles.minuteRow}>
                {availableMinutes.map(m => {
                  const active = selectedMinute === m.value;
                  return (
                    <TouchableOpacity
                      key={m.value}
                      style={[
                        styles.minuteChip,
                        {
                          borderColor: active
                            ? colors.primary
                            : colors.borderSubtle,
                        },
                        active && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setSelectedMinute(m.value)}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          {
                            color: active ? '#FFFFFF' : colors.darkBrown,
                            fontFamily: active
                              ? colors.fontSemiBold
                              : colors.fontRegular,
                          },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Selected time summary */}
          {selectedHour !== null && selectedMinute !== null && (
            <Text
              style={[
                styles.selectedTimeSummary,
                { color: colors.primary, fontFamily: colors.fontSemiBold },
              ]}
            >
              Selected: {formatShortDate(selectedDate)} at{' '}
              {formatSelectedTime()}
            </Text>
          )}
        </View>
      )}

      {/* Checkout Button — only when both date and time selected */}
      {canCheckout && (
        <View
          style={[
            styles.checkoutRow,
            { paddingBottom: insets.bottom + sh(16) },
          ]}
        >
          <Text
            style={[
              styles.totalLabel,
              { color: colors.darkBrown, fontFamily: colors.fontRegular },
            ]}
          >
            Total amount:{' '}
            <Text style={{ fontFamily: colors.fontBold }}>
              {totalAmount} QAR
            </Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              { backgroundColor: colors.primary },
              validating && { opacity: 0.6 },
            ]}
            onPress={handleCheckout}
            disabled={validating}
          >
            {validating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[styles.checkoutText, { fontFamily: colors.fontSemiBold }]}
              >
                Checkout
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>

    {/* Preparation Time Conflict Modal */}
    <Modal
      visible={conflictModal.visible}
      transparent
      animationType="fade"
      onRequestClose={() => setConflictModal(prev => ({ ...prev, visible: false }))}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          {/* Warning icon + title */}
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalWarningIcon}>⚠️</Text>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: colors.fontSemiBold }]}>
              Delivery Not Available
            </Text>
          </View>

          <Text style={[styles.modalSubtitle, { color: colors.textMuted, fontFamily: colors.fontRegular }]}>
            The following items need more preparation time and cannot be
            delivered at your selected time:
          </Text>

          {/* Product list */}
          {conflictModal.nonDeliverableProducts.map((p, i) => (
            <View
              key={i}
              style={[styles.conflictItem, { borderColor: colors.borderSubtle, backgroundColor: colors.background || '#FAF6F2' }]}
            >
              <Text style={[styles.conflictProductName, { color: colors.text, fontFamily: colors.fontSemiBold }]}>
                {p.product_name}
              </Text>
              <View style={styles.conflictDetailRow}>
                <Text style={[styles.conflictDetailLabel, { color: colors.textMuted }]}>Prep time:</Text>
                <Text style={[styles.conflictDetailValue, { color: colors.darkBrown || colors.text, fontFamily: colors.fontSemiBold }]}>
                  {p.preparation_time}
                </Text>
              </View>
              <View style={styles.conflictDetailRow}>
                <Text style={[styles.conflictDetailLabel, { color: colors.textMuted }]}>Earliest delivery:</Text>
                <Text style={[styles.conflictDetailValue, { color: colors.primary, fontFamily: colors.fontSemiBold }]}>
                  {p.earliest_delivery}
                </Text>
              </View>
            </View>
          ))}

          {/* Divider */}
          <View style={[styles.modalDivider, { backgroundColor: colors.borderSubtle }]} />

          {/* Requested time */}
          <View style={styles.conflictDetailRow}>
            <Text style={[styles.conflictDetailLabel, { color: colors.textMuted }]}>Your selected time:</Text>
            <Text style={[styles.conflictDetailValue, { color: colors.text, fontFamily: colors.fontSemiBold }]}>
              {conflictModal.requestedDelivery}
            </Text>
          </View>

          {/* Suggestion */}
          {!!conflictModal.suggestion && (
            <Text style={[styles.modalSuggestion, { color: colors.primary, fontFamily: colors.fontRegular }]}>
              💡 {conflictModal.suggestion}
            </Text>
          )}

          {/* Action button */}
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: colors.primary }]}
            onPress={() => setConflictModal(prev => ({ ...prev, visible: false }))}
            activeOpacity={0.8}
          >
            <Text style={[styles.modalBtnText, { fontFamily: colors.fontSemiBold }]}>
              Choose a Later Time
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarCard: {
    marginHorizontal: sw(20),
    marginTop: sh(16),
    borderWidth: 1,
    borderRadius: sw(12),
    padding: sw(16),
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sh(16),
  },
  navArrow: {
    padding: sw(8),
  },
  navArrowText: {
    fontSize: fs(18),
    fontWeight: '500',
  },
  monthTitle: {
    fontSize: fs(16),
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: sh(8),
  },
  weekDayText: {
    fontSize: fs(13),
    textAlign: 'center',
  },
  dayCell: {
    width: sw(36),
    height: sw(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sw(8),
  },
  dayText: {
    fontSize: fs(14),
  },
  selectedDay: {
    borderRadius: sw(8),
  },
  clearTodayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: sh(12),
    paddingHorizontal: sw(4),
  },
  clearText: {
    fontSize: fs(14),
  },
  todayText: {
    fontSize: fs(14),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: sw(20),
    marginTop: sh(24),
  },
  infoLabel: {
    fontSize: fs(13),
    marginBottom: sh(4),
  },
  infoDate: {
    fontSize: fs(20),
  },
  timePickerCard: {
    marginHorizontal: sw(20),
    marginTop: sh(20),
    borderWidth: 1,
    borderRadius: sw(12),
    padding: sw(16),
  },
  timePickerTitle: {
    fontSize: fs(15),
    marginBottom: sh(12),
  },
  timeLabel: {
    fontSize: fs(12),
    marginBottom: sh(8),
  },
  timeRow: {
    flexDirection: 'row',
  },
  timeChip: {
    borderWidth: 1,
    borderRadius: sw(20),
    paddingVertical: sh(7),
    paddingHorizontal: sw(12),
    marginRight: sw(8),
  },
  timeChipText: {
    fontSize: fs(13),
  },
  minuteRow: {
    flexDirection: 'row',
    gap: sw(10),
  },
  minuteChip: {
    borderWidth: 1,
    borderRadius: sw(20),
    paddingVertical: sh(7),
    paddingHorizontal: sw(16),
  },
  selectedTimeSummary: {
    marginTop: sh(14),
    fontSize: fs(14),
    textAlign: 'center',
  },
  checkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: sw(20),
    marginTop: sh(24),
  },
  totalLabel: {
    fontSize: fs(14),
  },
  checkoutBtn: {
    borderRadius: sw(30),
    paddingVertical: sh(14),
    paddingHorizontal: sw(40),
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: fs(16),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sw(20),
  },
  modalCard: {
    width: '100%',
    borderRadius: sw(20),
    padding: sw(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sh(8),
  },
  modalWarningIcon: {
    fontSize: fs(22),
    marginRight: sw(8),
  },
  modalTitle: {
    fontSize: fs(18),
  },
  modalSubtitle: {
    fontSize: fs(13),
    lineHeight: sh(20),
    marginBottom: sh(16),
  },
  conflictItem: {
    borderWidth: 1,
    borderRadius: sw(12),
    padding: sw(12),
    marginBottom: sh(10),
  },
  conflictProductName: {
    fontSize: fs(14),
    marginBottom: sh(6),
  },
  conflictDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sh(2),
  },
  conflictDetailLabel: {
    fontSize: fs(12),
  },
  conflictDetailValue: {
    fontSize: fs(12),
  },
  modalDivider: {
    height: 1,
    marginVertical: sh(14),
  },
  modalSuggestion: {
    fontSize: fs(13),
    marginTop: sh(10),
    lineHeight: sh(20),
  },
  modalBtn: {
    marginTop: sh(20),
    borderRadius: sw(30),
    paddingVertical: sh(14),
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
  },
});

export default CalendarScreen;
