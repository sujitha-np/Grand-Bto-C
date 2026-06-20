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
};
