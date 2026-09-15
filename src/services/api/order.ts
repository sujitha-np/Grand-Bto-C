import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface OrderProduct {
  id: number;
  name_en: string;
  name_ar: string;
  image: string;
  department: {
    id: number;
    name_en: string;
    name_ar: string;
  };
}

export interface OrderItem {
  id: number;
  product_id: number;
  item_name: string;
  item_unit: string;
  item_rate: string;
  item_quantity: number;
  item_sub_total: string;
  item_discount: string;
  item_grand_total: string;
  product: OrderProduct;
}

export interface Order {
  id: number;
  unique_id: string;
  order_date: string;
  sub_total: string;
  discount: string;
  tax: string;
  shipping_charge: string;
  grand_total: string;
  payment_type: number;
  payment_status: number;
  payment_status_text: string;
  tracking_status: number;
  tracking_status_text: string;
  payment_mode: string;
  items: OrderItem[];
  created_at: string;
  formatted_date: string;
}

export interface OrdersResponse {
  success: boolean;
  data: {
    customer_id: string;
    order_date: string;
    total_orders: number;
    total_amount: number;
    orders: Order[];
  };
  message?: string;
}

export interface OrderHistoryResponse {
  success: boolean;
  data: {
    customer_id: string;
    filter_date: string | null;
    total_orders: number;
    total_amount: number;
    orders: Order[];
  };
  message?: string;
}

export const orderService = {
  getOrdersByDate: async (
    customerId: string,
    orderDate: string,
  ): Promise<OrdersResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('date', orderDate);

    const response = await fetch(`${BASE_URL}/api/customer/orders/history`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `bearer ${token}`,
        bearer: `${token}`,
        token: `${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data?.message || 'Failed to fetch orders');
    }

    return data;
  },

  getOrderHistory: async (
    customerId: string,
  ): Promise<OrderHistoryResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('customer_id', customerId);

    const response = await fetch(`${BASE_URL}/api/customer/orders/history`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `bearer ${token}`,
        bearer: `${token}`,
        token: `${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data?.message || 'Failed to fetch order history');
    }

    return data;
  },

  cancelOrder: async (cancelData: {
    order_id: string | number;
    customer_id: string | number;
    cancel_reason?: string;
    refund_type?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> => {
    const token = await AsyncStorage.getItem('userToken');
    const url = `${BASE_URL}/api/customer/cancel-order`;

    console.log('==============================================');
    console.log('🚫 [Cancel Order API] Initiating Request:');
    console.log('URL:', url);
    console.log('Payload:', cancelData);
    console.log('Token:', token || 'NOT FOUND');

    const formData = new FormData();
    formData.append('order_id', String(cancelData.order_id));
    formData.append('customer_id', String(cancelData.customer_id));
    formData.append(
      'cancel_reason',
      cancelData.cancel_reason || 'Cancelled by user',
    );
    if (cancelData.refund_type && cancelData.refund_type.trim() !== '') {
      formData.append('refund_type', String(cancelData.refund_type));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `bearer ${token}`,
        bearer: `${token}`,
        token: `${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log('🚫 [Cancel Order API] Response Status:', response.status);
    console.log(
      '🚫 [Cancel Order API] Response Data:',
      JSON.stringify(data, null, 2),
    );
    console.log('==============================================');

    if (!response.ok || data?.success === false) {
      let errorMsg = data?.reason || data?.message || 'Failed to cancel order';
      if (data?.errors) {
        const firstErrorKey = Object.keys(data.errors)[0];
        if (firstErrorKey && Array.isArray(data.errors[firstErrorKey])) {
          errorMsg = data.errors[firstErrorKey][0];
        }
      }
      throw new Error(errorMsg);
    }

    return data;
  },
};

