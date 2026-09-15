import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { prefetchOffersImages } from '../../utils/imagePrefetch';

const OFFERS_CACHE_KEY = '@cache_home_offers';

export interface OfferProduct {
  id: number;
  offer_id: number;
  product_id: number;
  offer_price: string;
  custom_price: string;
  status: number;
  product: {
    id: number;
    product_code: string;
    name_en: string;
    name_ar: string;
    url_slug: string;
    category_id: number;
    subcategory_id: number;
    image: string;
    price: string;
    discount: string;
    net_price: string;
    stock: number;
    department_id: number;
    offer_price: string;
    preparation_time_minutes: number;
    preparation_time_value: number;
    preparation_time_unit: string;
  };
}

export interface Offer {
  id: number;
  name_en: string;
  url_slug: string;
  name_ar: string;
  image_en: string;
  image_ar: string;
  offer_type: number;
  offer_value: number;
  min_product_price: string;
  start_date: string;
  end_date: string;
  category_id: number;
  status: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  products: OfferProduct[];
}

export const offerService = {
  getOffers: async () => {
    try {
      // Get token manually
      const token = await AsyncStorage.getItem('userToken');

      // Use 'bearer' header instead of 'Authorization'
      const { data } = await apiClient.post('/products/offers', {}, {
        headers: {
          bearer: token,
        },
      });

      if (data?.success === false || data?.error) {
        throw new Error('Failed to fetch offers');
      }

      if (data?.data && Array.isArray(data.data)) {
        AsyncStorage.setItem(OFFERS_CACHE_KEY, JSON.stringify(data)).catch(() => {});
        prefetchOffersImages(data.data);
      }

      return data;
    } catch (error: any) {
      console.log('Offers API error:', error);
      // Fallback to cached offers on failure
      try {
        const cached = await AsyncStorage.getItem(OFFERS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.data?.length) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore
      }

      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to fetch offers',
        );
      }
      throw error;
    }
  },

  getCachedOffers: async () => {
    try {
      const cached = await AsyncStorage.getItem(OFFERS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }
    return null;
  },

  getOfferedProducts: async (offerId: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const { data } = await apiClient.get(`/products/offer/${offerId}`, {
        headers: {
          bearer: token,
        },
      });

      if (data?.success === false || data?.error) {
        throw new Error('Failed to fetch offered products');
      }

      return data;
    } catch (error: any) {
      console.log('Offered products API error:', error);
      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to fetch offered products',
        );
      }
      throw error;
    }
  },
};
