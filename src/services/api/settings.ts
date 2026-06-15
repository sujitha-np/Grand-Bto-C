import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface PreorderLimitResponse {
  success: boolean;
  preorder_limit_days: number;
  max_preorder_date: string;
}

export const settingsService = {
  getPreorderLimit: async (): Promise<PreorderLimitResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get<PreorderLimitResponse>(
        `${BASE_URL}/api/settings/preorder-limit`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `bearer ${token}`,
            bearer: token || '',
            token: token || '',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('getPreorderLimit error:', error);
      throw error;
    }
  },
};
