import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface PointHistory {
  id: number;
  customer_id: number;
  points: number;
  type: string; // 'credit' or 'debit'
  description: string;
  created_at: string;
  formatted_date: string;
}

export interface LoyaltyPointsResponse {
  success: boolean;
  data: {
    customer_id: string;
    total_loyalty_points: number;
    points_history: PointHistory[];
  };
  message?: string;
}

export const loyaltyService = {
  getLoyaltyPoints: async (
    customerId: string,
  ): Promise<LoyaltyPointsResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(
      `${BASE_URL}/api/customer/loyalty-points/${customerId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `bearer ${token}`,
          bearer: `${token}`,
          token: `${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data?.message || 'Failed to fetch loyalty points');
    }

    return data;
  },
};
