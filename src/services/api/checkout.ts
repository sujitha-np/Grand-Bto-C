import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface CheckoutRequest {
  customer_id: string;
  cart_id: string;
  address_id: string;
  use_wallet?: number;
  payment_type: number; // 1 = cash on delivery, 2 = online
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  requires_payment?: boolean;
  data: {
    order_id: number;
    unique_id: string;
    remaining_amount: number;
    wallet_used: number;
    payment_url?: string;
  };
}

export interface NonDeliverableProduct {
  product_name: string;
  preparation_time: string;
  earliest_delivery: string;
}

export interface CartCheckoutResponse {
  success: boolean;
  message: string;
  error_code?: string;
  non_deliverable_products?: NonDeliverableProduct[];
  requested_delivery?: string;
  suggestion?: string;
}

export interface CartCheckoutRequest {
  customer_id: string;
  cart_id: string;
  delivery_date: string;
  delivery_time: string;
}

export const checkoutService = {
  placeOrder: async (
    checkoutData: CheckoutRequest,
  ): Promise<CheckoutResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('customer_id', checkoutData.customer_id);
    formData.append('cart_id', checkoutData.cart_id);
    formData.append('address_id', checkoutData.address_id);
    formData.append('payment_type', String(checkoutData.payment_type));
    if (checkoutData.use_wallet !== undefined) {
      formData.append('use_wallet', String(checkoutData.use_wallet));
    }

    const response = await fetch(`${BASE_URL}/api/customer/place-order`, {
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

    if (!response.ok) {
      throw new Error(
        data?.message || `Request failed with status ${response.status}`,
      );
    }

    return data;
  },

  cartCheckout: async (
    payload: CartCheckoutRequest,
  ): Promise<CartCheckoutResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('customer_id', payload.customer_id);
    formData.append('cart_id', payload.cart_id);
    formData.append('delivery_date', payload.delivery_date);
    formData.append('delivery_time', payload.delivery_time);

    const response = await fetch(`${BASE_URL}/api/customer/checkout`, {
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
    return data;
  },
};
