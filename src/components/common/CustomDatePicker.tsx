import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateString: string) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePicker({ visible, onClose, onSelect }: CustomDatePickerProps) {
  const colors = useTheme();
  
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  // Default to 20 years ago for DOB, or maxDate if 20 years ago is somehow invalid
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear() - 20, 0, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

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
    return new Date(year, month, d) > maxDate;
  };

  const isNextMonthDisabled = new Date(year, month + 1, 1) > maxDate;
  const isNextYearDisabled = new Date(year + 1, month, 1) > maxDate;

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextYear = () => setCurrentDate(new Date(year + 1, month, 1));
  const prevYear = () => setCurrentDate(new Date(year - 1, month, 1));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={prevYear} style={styles.navBtn}>
              <Text style={[styles.navText, { color: colors.textMuted }]}>{'<<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Text style={[styles.navText, { color: colors.textMuted }]}>{'<'}</Text>
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                {MONTHS[month]} {year}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={nextMonth} 
              style={[styles.navBtn, isNextMonthDisabled && { opacity: 0.3 }]}
              disabled={isNextMonthDisabled}
            >
              <Text style={[styles.navText, { color: colors.textMuted }]}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={nextYear} 
              style={[styles.navBtn, isNextYearDisabled && { opacity: 0.3 }]}
              disabled={isNextYearDisabled}
            >
              <Text style={[styles.navText, { color: colors.textMuted }]}>{'>>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {DAYS.map((d, i) => (
              <Text key={i} style={[styles.weekDayText, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day !== null && (
                  <TouchableOpacity
                    style={[styles.dayButton, isDayDisabled(day) && { opacity: 0.3 }]}
                    onPress={() => handleDayPress(day)}
                    disabled={isDayDisabled(day)}
                  >
                    <Text style={[styles.dayText, { color: colors.text }]}>{day}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
