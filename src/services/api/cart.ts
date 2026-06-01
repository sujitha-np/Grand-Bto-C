import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface CartItem {
  product_id: string;
  product_name: string;
  product_name_ar: string;
  price: string;
  quantity: string;
  total: number;
  image: string;
  department: {
    id: number;
    name_en: string;
    name_ar: string;
  };
}

export interface Cart {
  cart_id: number;
  preorder_date: string;
  items: CartItem[];
  subtotal: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  success: boolean;
  data: {
    customer_id: string;
    cart: Cart;
  };
}

export interface AddToCartResponse {
  success: boolean;
  message: string;
  data: any;
}

export const cartService = {
  getCart: async (
    customerId: string,
    preorderDate: string,
  ): Promise<CartResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('preorder_date', preorderDate);

    const response = await fetch(`${BASE_URL}/api/customer/cart/get`, {
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

  addToCart: async (
    customerId: string,
    productId: string,
    quantity: string,
    preorderDate: string,
  ): Promise<AddToCartResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('product_id', productId);
    formData.append('quantity', quantity);
    formData.append('preorder_date', preorderDate);

    const response = await fetch(`${BASE_URL}/api/customer/cart/add`, {
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

  updateCartQuantity: async (
    customerId: string,
    cartId: string,
    productId: string,
    quantity: string,
  ): Promise<AddToCartResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('cart_id', cartId);
    formData.append('product_id', productId);
    formData.append('quantity', quantity);

    const response = await fetch(`${BASE_URL}/api/customer/cart/update`, {
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

  removeFromCart: async (
    customerId: string,
    cartId: string,
    productId: string,
  ): Promise<AddToCartResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    console.log('Removing from cart:', { customerId, cartId, productId });

    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('cart_id', cartId);
    formData.append('product_id', productId);

    const response = await fetch(`${BASE_URL}/api/customer/cart/remove`, {
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
    console.log('Remove from cart response:', data);

    // Check if API returned errors (either via HTTP status or success flag)
    if (!response.ok || !data.success) {
      // Extract error messages from API response
      let errorMessage = data?.message || 'Failed to remove item';
      if (data?.error) {
        const errors = Object.values(data.error).flat();
        errorMessage = errors.join(', ');
      }
      throw new Error(errorMessage);
    }

    return data;
  },

  specialRequest: async (
    cartId: string,
    customerId: string,
    specialRequest: string,
  ): Promise<AddToCartResponse> => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('cart_id', cartId);
    formData.append('customer_id', customerId);
    formData.append('special_request', specialRequest);

    const response = await fetch(
      `${BASE_URL}/api/customer/cart/special-request`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `bearer ${token}`,
          bearer: `${token}`,
          token: `${token}`,
        },
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || `Request failed with status ${response.status}`,
      );
    }

    return data;
  },
};
