import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';

interface FoodItem {
  name: string;
  price: string;
  emoji: string;
}

interface PrebookFoodSectionProps {
  onItemPress?: (index: number) => void;
}

const FOOD_ITEMS: FoodItem[] = [
  { name: 'Chicken Burger', price: '15.00 QAR', emoji: '🍔' },
  { name: 'Pizza Margherita', price: '25.00 QAR', emoji: '🍕' },
  { name: 'French Fries', price: '8.00 QAR', emoji: '🍟' },
  { name: 'Pasta', price: '18.00 QAR', emoji: '🍝' },
];

function PrebookFoodSection({ onItemPress }: PrebookFoodSectionProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('home.preBook')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FOOD_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.foodCard}
            activeOpacity={0.8}
            onPress={() => onItemPress?.(i)}
          >
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodPrice}>{item.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: sw(20),
      paddingTop: sh(20),
    },
    sectionTitle: {
      fontSize: fs(18),
      marginBottom: sh(14),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
    },
    scrollContent: {
      gap: sw(12),
    },
    foodCard: {
      width: sw(140),
      borderRadius: sw(16),
      backgroundColor: colors.surface,
      padding: sw(12),
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    emojiContainer: {
      width: sw(70),
      height: sw(70),
      borderRadius: sw(12),
      backgroundColor: '#FFF5E6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sh(8),
    },
    emoji: {
      fontSize: fs(32),
    },
    foodName: {
      fontSize: fs(14),
      color: colors.text,
      fontFamily: colors.fontMedium,
      marginBottom: sh(4),
    },
    foodPrice: {
      fontSize: fs(13),
      color: '#FF7B00',
      fontFamily: colors.fontSemiBold,
    },
  });

export default PrebookFoodSection;
