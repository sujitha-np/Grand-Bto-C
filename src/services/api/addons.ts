import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Addon {
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
  is_addon: number;
  offer_price: string;
  preparation_time_formatted: string;
  department_id: number;
}

export interface AddonsResponse {
  success: boolean;
  data: Addon[];
}

export const addonsService = {
  async getAddons(): Promise<AddonsResponse> {
    try {
      const customerId = await AsyncStorage.getItem('customerId');
      console.log('Addons Service - Customer ID:', customerId);
      console.log('Addons Service - Calling API: POST /products/addons');

      const response = await apiClient.post<AddonsResponse>(
        '/products/addons',
        {
          customer_id: customerId || '',
        },
      );

      console.log(
        'Addons Service - Full Response:',
        JSON.stringify(response, null, 2),
      );
      console.log('Addons Service - Response Data:', response.data);
      console.log('Addons Service - Data Array:', response.data?.data);
      console.log(
        'Addons Service - Array Length:',
        response.data?.data?.length,
      );

      return response.data;
    } catch (error) {
      console.error('Addons Service - Error:', error);
      throw error;
    }
  },
};
