import React, { useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw, sh } from '../../utils/responsive';
import { Department } from '../../services/api/department';
import { BASE_URL } from '../../constants/api';

interface CategoriesSectionProps {
  departments: Department[];
  onCategoryPress?: (index: number) => void;
  selectedDepartmentId?: number;
}

const COLORS = [
  '#FF8A00',
  '#FF6B00',
  '#FF7B00',
  '#FF9500',
  '#FF8A00',
  '#FF6B00',
  '#FF7B00',
  '#FF9500',
];

function CategoriesSection({
  departments,
  onCategoryPress,
  selectedDepartmentId,
}: CategoriesSectionProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const scrollToItem = (index: number) => {
    const itemWidth = sw(82);
    const screenWidth = sw(375);
    const scrollPosition = index * itemWidth - screenWidth / 2 + itemWidth / 2;
    scrollRef.current?.scrollTo({
      x: Math.max(0, scrollPosition),
      y: 0,
      animated: true,
    });
  };

  const handlePress = (index: number) => {
    scrollToItem(index);
    onCategoryPress?.(index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('home.whatYouFeelLikeOrdering')}
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        <View style={styles.categoryRow}>
          {departments.map((dept, i) => {
            const isSelected = selectedDepartmentId === dept.id;
            return (
              <TouchableOpacity
                key={dept.id}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePress(i)}
              >
                <View
                  style={[
                    styles.categoryImage,
                    { backgroundColor: COLORS[i % COLORS.length] },
                  ]}
                >
                  <Image
                    source={{ uri: `${BASE_URL}${dept.image}` }}
                    style={styles.categoryImageImg}
                    resizeMode="cover"
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelSelected,
                  ]}
                >
                  {dept.name_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingTop: sh(20),
    },
    sectionTitle: {
      fontSize: fs(18),
      marginBottom: sh(14),
      color: colors.text,
      fontFamily: colors.fontBold,
      paddingHorizontal: sw(20),
    },
    scrollContent: {
      paddingVertical: sh(4),
      paddingLeft: sw(20),
    },
    scrollView: {
      paddingRight: sw(20),
    },
    categoryRow: {
      flexDirection: 'row',
      gap: sw(24),
      marginRight: sw(20),
    },
    categoryCard: {
      alignItems: 'center',
      width: sw(70),
    },
    categoryCardSelected: {
      opacity: 0.8,
    },
    categoryImage: {
      width: sw(70),
      height: sw(70),
      borderRadius: sw(35),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sh(6),
      overflow: 'hidden',
    },
    categoryImageImg: {
      width: '100%',
      height: '100%',
    },
    categoryLabel: {
      fontSize: fs(12),
      textAlign: 'center',
      color: colors.text,
      fontFamily: colors.fontSemiBold,
    },
    categoryLabelSelected: {
      // color: '#FF7B00',
      fontFamily: colors.fontSemiBold,
      fontWeight: '800',
    },
    spacer: {
      width: sw(60),
    },
  });

export default CategoriesSection;
