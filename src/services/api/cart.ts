import apiClient from './client';

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
    carts: Cart[];
  };
}

export interface AddToCartResponse {
  success: boolean;
  message: string;
  data: any;
}

export const cartService = {
  getCart: async (customerId: string, preorderDate: string): Promise<CartResponse> => {
    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('preorder_date', preorderDate);

    const response = await apiClient.post<CartResponse>(
      '/customer/cart/get',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  addToCart: async (
    customerId: string,
    productId: string,
    quantity: string,
    preorderDate: string
  ): Promise<AddToCartResponse> => {
    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('product_id', productId);
    formData.append('quantity', quantity);
    formData.append('preorder_date', preorderDate);

    const response = await apiClient.post<AddToCartResponse>(
      '/customer/cart/add',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
