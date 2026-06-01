import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WishlistItem {
  id: number;
  customer_id: number;
  product_id: number;
  added_at: string;
  product: {
    id: number;
    product_code: string;
    name_en: string;
    name_ar: string;
    image: string;
    price: string;
    discount: string;
    net_price: string;
    stock: number;
    department_id: number;
    offer_price: string;
  };
}

export const wishlistService = {
  addToWishlist: async (customerId: string, productId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const { data } = await apiClient.post(
        '/customer/wishlist/add',
        {
          customer_id: customerId,
          product_id: productId,
        },
        {
          headers: {
            bearer: token,
          },
        },
      );

      if (data?.success === false || data?.error) {
        throw new Error(data?.message || 'Failed to add to wishlist');
      }

      return data;
    } catch (error: any) {
      console.log('Add to wishlist error:', error);
      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to add to wishlist',
        );
      }
      throw error;
    }
  },

  removeFromWishlist: async (customerId: string, productId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const { data } = await apiClient.post(
        '/customer/wishlist/remove',
        {
          customer_id: customerId,
          product_id: productId,
        },
        {
          headers: {
            bearer: token,
          },
        },
      );

      if (data?.success === false || data?.error) {
        throw new Error(data?.message || 'Failed to remove from wishlist');
      }

      return data;
    } catch (error: any) {
      console.log('Remove from wishlist error:', error);
      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to remove from wishlist',
        );
      }
      throw error;
    }
  },

  getWishlist: async (customerId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const { data } = await apiClient.get(`/customer/wishlist/${customerId}`, {
        headers: {
          bearer: token,
        },
      });

      console.log('Get wishlist raw response:', JSON.stringify(data, null, 2));

      if (data?.success === false || data?.error) {
        throw new Error(data?.message || 'Failed to fetch wishlist');
      }

      return data;
    } catch (error: any) {
      console.log('Get wishlist error:', error);
      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to fetch wishlist',
        );
      }
      throw error;
    }
  },
};
