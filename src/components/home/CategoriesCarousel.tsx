import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { sw, sh } from '../../utils/responsive';
import { BASE_URL } from '../../constants/api';
import { Category } from '../../services/api/category';
import { prefetchCategoriesImages } from '../../utils/imagePrefetch';

interface CategoriesCarouselProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - sw(40); // Full width with padding
const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

function CategoriesCarousel({
  categories,
  onCategoryPress,
}: CategoriesCarouselProps) {
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prefetch all banner images whenever categories change
  useEffect(() => {
    if (categories && categories.length > 0) {
      prefetchCategoriesImages(categories);
    }
  }, [categories]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CAROUSEL_ITEM_WIDTH + sw(12)));
    setActiveIndex(index);
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current && categories.length > 0) {
      const offset = index * (CAROUSEL_ITEM_WIDTH + sw(12));
      scrollViewRef.current.scrollTo({ x: offset, animated: true });
    }
  };

  const resetAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }

    if (categories.length > 1) {
      autoScrollTimer.current = setInterval(() => {
        setActiveIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % categories.length;
          scrollToIndex(nextIndex);
          return nextIndex;
        });
      }, AUTO_SCROLL_INTERVAL);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CAROUSEL_ITEM_WIDTH + sw(12)));
    setActiveIndex(index);
    resetAutoScroll();
  };

  useEffect(() => {
    if (categories.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      setActiveIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % categories.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [categories.length]);

  if (!categories || categories.length === 0) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={[styles.carouselItem, styles.skeletonItem, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={CAROUSEL_ITEM_WIDTH + sw(12)}
        decelerationRate="fast"
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category.id}
            activeOpacity={0.9}
            onPress={() => onCategoryPress?.(category)}
            style={[
              styles.carouselItem,
              index === 0 && { marginLeft: 0 },
              index === categories.length - 1 && { marginRight: 0 },
            ]}
          >
            <Image
              source={{
                uri: `${BASE_URL}${category.image}`,
                cache: 'force-cache',
              }}
              style={styles.categoryImage}
              resizeMode="cover"
              fadeDuration={0}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {categories.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 0,
    },
    carouselItem: {
      width: CAROUSEL_ITEM_WIDTH,
      height: sh(200),
      borderRadius: sw(20),
      overflow: 'hidden',
      marginRight: sw(12),
      backgroundColor: colors.card || '#F5F5F5',
    },
    categoryImage: {
      width: '100%',
      height: '100%',
      borderRadius: sw(20),
      backgroundColor: colors.card || '#F5F5F5',
    },
    skeletonContainer: {
      paddingHorizontal: 0,
    },
    skeletonItem: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sh(16),
      gap: sw(8),
    },
    dot: {
      width: sw(10),
      height: sw(10),
      borderRadius: sw(5),
    },
    activeDot: {
      backgroundColor: '#FF8A00',
      width: sw(24),
      borderRadius: sw(5),
    },
    inactiveDot: {
      backgroundColor: '#D9D9D9',
    },
  });

export default CategoriesCarousel;
