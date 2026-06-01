import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      console.log('About to call offers API...');

      // Get token manually
      const token = await AsyncStorage.getItem('userToken');
      console.log(
        'Offers - Token:',
        token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
      );

      // Use 'bearer' header instead of 'Authorization'
      const { data } = await apiClient.post('/products/offers', undefined, {
        headers: {
          bearer: token, // Header name is 'bearer', not 'Authorization'
        },
        transformRequest: [
          (data, headers) => {
            delete headers['Content-Type'];
            return data;
          },
        ],
      });
      console.log('Raw offers API response:', data);

      if (data?.success === false || data?.error) {
        console.log('API returned success:false or error:', data);
        throw new Error('Failed to fetch offers');
      }

      return data;
    } catch (error: any) {
      console.log('Offers API error:', error);
      console.log('Error details:', JSON.stringify(error));
      if (error.response?.data) {
        console.log(
          'Error response data:',
          JSON.stringify(error.response.data, null, 2),
        );
        console.log('Error response status:', error.response.status);
        console.log('Error response message:', error.response.data?.message);
        throw new Error(
          error.response.data?.message || 'Failed to fetch offers',
        );
      }
      throw error;
    }
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
