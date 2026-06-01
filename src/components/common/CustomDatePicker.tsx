import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateString: string) => void;
  mode?: 'dob' | 'any'; // 'dob' for date of birth with 18+ restriction, 'any' for any date
  minDate?: Date; // Optional minimum date
  maxDate?: Date; // Optional maximum date
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePicker({
  visible,
  onClose,
  onSelect,
  mode = 'dob',
  minDate,
  maxDate: customMaxDate,
}: CustomDatePickerProps) {
  const colors = useTheme();

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  // For DOB mode, default to 18+ years restriction
  const maxDate =
    mode === 'dob'
      ? new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      : customMaxDate || new Date(today.getFullYear() + 1, 11, 31); // Allow up to next year for orders

  const minDateRestriction =
    mode === 'dob'
      ? new Date(today.getFullYear() - 100, 0, 1) // 100 years ago for DOB
      : minDate || new Date(1900, 0, 1); // Allow past dates for order history when no minDate specified

  // Default to 20 years ago for DOB, or today for other modes
  const [currentDate, setCurrentDate] = useState(
    mode === 'dob' ? new Date(today.getFullYear() - 20, 0, 1) : new Date(),
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) =>
    new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDayPress = (day: number) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSelect(`${yyyy}-${mm}-${dd}`);
  };

  const isDayDisabled = (d: number) => {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    return date > maxDate || date < minDateRestriction;
  };

  const isToday = (d: number) => {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isNextMonthDisabled = () => {
    const nextMonthDate = new Date(year, month + 1, 1);
    nextMonthDate.setHours(0, 0, 0, 0);
    return nextMonthDate > maxDate;
  };

  const isNextYearDisabled = () => {
    const nextYearDate = new Date(year + 1, month, 1);
    nextYearDate.setHours(0, 0, 0, 0);
    return nextYearDate > maxDate;
  };

  const isPrevMonthDisabled = () => {
    const prevMonthLastDay = new Date(year, month, 0);
    prevMonthLastDay.setHours(0, 0, 0, 0);
    return prevMonthLastDay < minDateRestriction;
  };

  const isPrevYearDisabled = () => {
    const prevYearDate = new Date(year - 1, month + 1, 0);
    prevYearDate.setHours(0, 0, 0, 0);
    return prevYearDate < minDateRestriction;
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextYear = () => setCurrentDate(new Date(year + 1, month, 1));
  const prevYear = () => setCurrentDate(new Date(year - 1, month, 1));

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.card || '#FFFFFF',
              borderColor: colors.border || '#E0E0E0',
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={prevYear}
              style={[styles.navBtn, isPrevYearDisabled() && { opacity: 0.3 }]}
              disabled={isPrevYearDisabled()}
            >
              <Text style={[styles.navText, { color: colors.textMuted }]}>
                {'<<'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={prevMonth}
              style={[styles.navBtn, isPrevMonthDisabled() && { opacity: 0.3 }]}
              disabled={isPrevMonthDisabled()}
            >
              <Text style={[styles.navText, { color: colors.textMuted }]}>
                {'<'}
              </Text>
            </TouchableOpacity>

            <View style={styles.headerTitle}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                {MONTHS[month]} {year}
              </Text>
            </View>

            <TouchableOpacity
              onPress={nextMonth}
              style={[styles.navBtn, isNextMonthDisabled() && { opacity: 0.3 }]}
              disabled={isNextMonthDisabled()}
            >
              <Text style={[styles.navText, { color: colors.textMuted }]}>
                {'>'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextYear}
              style={[styles.navBtn, isNextYearDisabled() && { opacity: 0.3 }]}
              disabled={isNextYearDisabled()}
            >
              <Text style={[styles.navText, { color: colors.textMuted }]}>
                {'>>'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {DAYS.map((d, i) => (
              <Text
                key={i}
                style={[styles.weekDayText, { color: colors.textMuted }]}
              >
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day !== null && (
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      isToday(day) && styles.todayButton,
                      isDayDisabled(day) && { opacity: 0.3 },
                    ]}
                    onPress={() => handleDayPress(day)}
                    disabled={isDayDisabled(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        isToday(day) && styles.todayText,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  container: {
    width: '85%',
    borderRadius: sw(16),
    padding: sw(20),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sh(16),
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: fs(16),
    fontFamily: 'Inter-SemiBold',
  },
  navBtn: {
    padding: sw(8),
  },
  navText: {
    fontSize: fs(16),
    fontFamily: 'Inter-Bold',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: sh(8),
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: fs(13),
    fontFamily: 'Inter-Medium',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sw(8),
  },
  dayText: {
    fontSize: fs(14),
    fontFamily: 'Inter-Regular',
  },
  todayButton: {
    backgroundColor: '#FF8C42',
  },
  todayText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  cancelBtn: {
    marginTop: sh(16),
    alignItems: 'center',
    paddingVertical: sh(8),
  },
  cancelText: {
    fontSize: fs(15),
    fontFamily: 'Inter-SemiBold',
  },
});
