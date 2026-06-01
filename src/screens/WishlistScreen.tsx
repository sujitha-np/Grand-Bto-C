import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { useWishlist, useRemoveFromWishlist } from '../hooks/queries';
import { fs, sw, sh } from '../utils/responsive';
import { BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Images } from '../assets/images';
import Header from '../components/common/Header';

interface WishlistItem {
  product_id: number;
  product_name: string;
  product_name_ar: string;
  price: string;
  image: string;
  added_at: string;
}

interface WishlistScreenProps {
  onBack: () => void;
  onShowProductDetail: (productId: number) => void;
}

function WishlistScreen({ onBack, onShowProductDetail }: WishlistScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [customerId, setCustomerId] = useState<string | undefined>();

  const { data: wishlistData, isLoading, error } = useWishlist(customerId);
  const { mutateAsync: removeFromWishlist } = useRemoveFromWishlist();

  const wishlistItems: WishlistItem[] = wishlistData?.data?.items || [];

  useEffect(() => {
    const getCustomerId = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) setCustomerId(id);
    };
    getCustomerId();
  }, []);

  const handleRemove = async (productId: number) => {
    if (!customerId) return;

    try {
      await removeFromWishlist({
        customerId,
        productId: productId.toString(),
      });
    } catch (error) {
      console.log('Remove from wishlist error:', error);
    }
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
    const imageUrl = `${BASE_URL}${item.image}`;
    return (
      <TouchableOpacity
        style={styles.itemCard}
        activeOpacity={0.8}
        onPress={() => onShowProductDetail(item.product_id)}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.product_name}
          </Text>
          <Text style={styles.itemPrice}>{item.price} QAR</Text>
          <Text style={styles.itemDate}>
            Added: {new Date(item.added_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.product_id)}
          activeOpacity={0.7}
        >
          <Image
            source={Images.heart}
            style={styles.heartIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Wishlist" onBack={onBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Wishlist" onBack={onBack} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load wishlist</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Wishlist" onBack={onBack} />

      <FlatList
        data={wishlistItems}
        renderItem={renderWishlistItem}
        keyExtractor={item => item.product_id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image
              source={Images.heart}
              style={styles.emptyIcon}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptyText}>
              Add products you love to your wishlist
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: sh(30),
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      padding: sw(20),
      paddingBottom: sh(20),
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: sw(12),
      marginBottom: sh(15),
      padding: sw(12),
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    itemImage: {
      width: sw(80),
      height: sw(80),
      borderRadius: sw(8),
      backgroundColor: '#f5f5f5',
    },
    itemInfo: {
      flex: 1,
      marginLeft: sw(12),
      justifyContent: 'space-between',
    },
    itemName: {
      fontSize: fs(15),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
      marginBottom: sh(4),
    },
    itemPrice: {
      fontSize: fs(16),
      color: colors.primary,
      fontFamily: colors.fontBold,
    },
    itemDate: {
      fontSize: fs(12),
      color: colors.textSecondary,
      fontFamily: colors.fontRegular,
    },
    removeButton: {
      width: sw(40),
      height: sw(40),
      justifyContent: 'center',
      alignItems: 'center',
    },
    heartIcon: {
      width: sw(24),
      height: sw(24),
      tintColor: colors.primary,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sh(60),
      paddingHorizontal: sw(40),
    },
    emptyIcon: {
      width: sw(80),
      height: sw(80),
      tintColor: colors.textMuted,
      marginBottom: sh(20),
    },
    emptyTitle: {
      fontSize: fs(20),
      color: colors.text,
      fontFamily: colors.fontBold,
      marginBottom: sh(8),
      textAlign: 'center',
    },
    emptyText: {
      fontSize: fs(14),
      color: colors.textSecondary,
      fontFamily: colors.fontRegular,
      textAlign: 'center',
    },
    errorText: {
      fontSize: fs(16),
      color: colors.error,
      fontFamily: colors.fontMedium,
      textAlign: 'center',
    },
  });

export default WishlistScreen;
