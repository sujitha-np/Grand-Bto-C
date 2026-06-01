import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Promocode {
  id: number;
  name_en: string;
  name_ar: string;
  promo_code: string;
  offer_type: number;
  offer_value: string;
  min_product_price: string;
  start_date: string;
  end_date: string;
}

export const promocodeService = {
  getPromocodes: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const { data } = await apiClient.get('/promocodes', {
        headers: {
          bearer: token,
        },
      });

      if (data?.success === false || data?.error) {
        throw new Error(data?.message || 'Failed to fetch promocodes');
      }

      return data;
    } catch (error: any) {
      console.log('Get promocodes error:', error);
      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to fetch promocodes',
        );
      }
      throw error;
    }
  },

  applyPromocode: async (
    grandTotal: string | number,
    customerId: string,
    promoCode: string,
  ) => {
    const token = await AsyncStorage.getItem('userToken');
    const formData = new FormData();
    formData.append('grand_total', String(grandTotal));
    formData.append('customer_id', customerId);
    formData.append('promo_code', promoCode);

    try {
      const { data } = await apiClient.post(
        '/customer/validate-promo-code',
        formData,
        {
          headers: {
            bearer: token,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (data?.success === false) {
        throw new Error(data?.message);
      }

      return data;
    } catch (error: any) {
      // Axios HTTP error (4xx/5xx) — extract message from response body
      const apiMessage = error.response?.data?.message;
      if (apiMessage) {
        throw new Error(apiMessage);
      }
      // Re-throw as-is (already a plain Error from the success===false check above)
      throw error;
    }
  },
};
