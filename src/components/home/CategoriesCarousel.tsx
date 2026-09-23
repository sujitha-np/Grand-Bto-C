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
import { Images } from '../../assets/images';

interface CategoriesCarouselProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - sw(40); // Full width with padding
const AUTO_SCROLL_INTERVAL = 3500; // 3.5 seconds

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

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current && categories.length > 0) {
      const offset = index * (CAROUSEL_ITEM_WIDTH + sw(12));
      scrollViewRef.current.scrollTo({ x: offset, animated: true });
      setActiveIndex(index);
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CAROUSEL_ITEM_WIDTH + sw(12)));
    if (index >= 0 && index < categories.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CAROUSEL_ITEM_WIDTH + sw(12)));
    setActiveIndex(index);
    resetAutoScroll();
  };

  const handlePrev = () => {
    if (categories.length <= 1) return;
    const nextIndex = activeIndex === 0 ? categories.length - 1 : activeIndex - 1;
    scrollToIndex(nextIndex);
    resetAutoScroll();
  };

  const handleNext = () => {
    if (categories.length <= 1) return;
    const nextIndex = (activeIndex + 1) % categories.length;
    scrollToIndex(nextIndex);
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
        <View
          style={[
            styles.carouselItem,
            styles.skeletonItem,
            { backgroundColor: colors.card },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.carouselWrapper}>
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

        {/* Left Arrow Button */}
        {categories.length > 1 && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.leftArrow]}
            activeOpacity={0.8}
            onPress={handlePrev}
          >
            <Image
              source={Images.backArrow1}
              style={[styles.arrowIcon, { tintColor: colors.darkBrown || '#3B2B20' }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {/* Right Arrow Button */}
        {categories.length > 1 && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.rightArrow]}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Image
              source={Images.backArrow1}
              style={[
                styles.arrowIcon,
                {
                  tintColor: colors.darkBrown || '#3B2B20',
                  transform: [{ rotate: '180deg' }],
                },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      position: 'relative',
    },
    carouselWrapper: {
      position: 'relative',
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
    arrowButton: {
      position: 'absolute',
      top: '50%',
      marginTop: -sw(18),
      width: sw(36),
      height: sw(36),
      borderRadius: sw(18),
      backgroundColor: 'rgba(255, 255, 255, 0.88)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 5,
      elevation: 4,
      zIndex: 10,
    },
    leftArrow: {
      left: sw(10),
    },
    rightArrow: {
      right: sw(10),
    },
    arrowIcon: {
      width: sw(14),
      height: sw(14),
    },
    skeletonContainer: {
      paddingHorizontal: 0,
    },
    skeletonItem: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default CategoriesCarousel;
