import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface PointHistory {
  id: number;
  customer_id: number;
  order_id?: number;
  order_amount?: string;
  points_earned: number;
  is_qualified?: number;
  is_expired?: number;
  expired_at?: string | null;
  transaction_type?: string;
  notes: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  order?: {
    id: number;
    unique_id?: string;
    [key: string]: any;
  } | null;
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
