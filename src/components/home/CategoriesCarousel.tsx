import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { sw, sh } from '../../utils/responsive';
import { BASE_URL } from '../../constants/api';
import { Category } from '../../services/api/category';

interface CategoriesCarouselProps {
  categories: Category[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - sw(40); // Full width with padding
const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
    // Clear existing timer
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }

    // Restart auto-scroll after user interaction
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
    resetAutoScroll(); // Restart auto-scroll after manual scroll
  };

  useEffect(() => {
    if (categories.length <= 1) return;

    // Start auto-scroll
    autoScrollTimer.current = setInterval(() => {
      setActiveIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % categories.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    // Cleanup timer on unmount
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [categories.length]);

  if (!categories || categories.length === 0) {
    return null;
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
          <View
            key={category.id}
            style={[
              styles.carouselItem,
              index === 0 && { marginLeft: 0 },
              index === categories.length - 1 && { marginRight: 0 },
            ]}
          >
            <Image
              source={{ uri: `${BASE_URL}${category.image}` }}
              style={styles.categoryImage}
              resizeMode="cover"
            />
          </View>
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
    },
    categoryImage: {
      width: '100%',
      height: '100%',
      borderRadius: sw(20),
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
