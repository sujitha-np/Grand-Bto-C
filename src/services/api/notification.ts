import apiClient from './client';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  order_id?: number | null;
  read_at?: string | null;
  is_read: boolean;
  created_at: string;
  created_time?: string;
}

export interface NotificationData {
  customer_id: string;
  total_notifications: number;
  unread_count: number;
  notifications: NotificationItem[];
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationData;
}

export const notificationService = {
  getNotifications: async (customerId: string | number): Promise<NotificationResponse> => {
    try {
      const { data } = await apiClient.get<NotificationResponse>(
        `/customer/notifications/${customerId}`,
      );
      console.log('Raw notifications API response:', data);

      if (data?.success === false) {
        console.log('API returned success:false:', data);
        throw new Error('Failed to fetch notifications');
      }

      return data;
    } catch (error: any) {
      console.log('Notifications API error:', error);
      if (error.response?.data) {
        console.log('Error response data:', error.response.data);
        throw new Error(
          error.response.data?.message || 'Failed to fetch notifications',
        );
      }
      throw error;
    }
  },
};
