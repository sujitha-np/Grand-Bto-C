import apiClient from './client';
import { BASE_URL } from '../../constants/api';

export interface Product {
  id: number;
  product_code: string;
  name_en: string;
  name_ar: string;
  url_slug: string;
  category_id: number;
  subcategory_id: number;
  image: string;
  price: string;
  discount: string;
  net_price: string;
  stock: number;
  department_id: number;
  department: {
    id: number;
    name_en: string;
    name_ar: string;
    url_slug: string;
    image: string;
    status: number;
  };
  category: {
    id: number;
    department_id: number;
    name_en: string;
    name_ar: string;
    url_slug: string;
    status: number;
  };
  is_wishlisted: boolean;
  offer_price: string;
}

export const productService = {
  getProducts: async () => {
    try {
      const { data } = await apiClient.post('/products');
      console.log('Raw products API response:', data);

      if (data?.success === false || data?.error) {
        console.log('API returned success:false or error:', data);
        throw new Error('Failed to fetch products');
      }

      return data;
    } catch (error: any) {
      console.log('Products API error:', error);
      if (error.response?.data) {
        console.log('Error response data:', error.response.data);
        throw new Error(
          error.response.data?.message || 'Failed to fetch products',
        );
      }
      throw error;
    }
  },
  getProductsByDepartment: async (departmentId: number) => {
    try {
      const { data } = await apiClient.post(
        `/products/department/${departmentId}`,
      );
      console.log(
        `Raw productsbyDepartment API response for ${departmentId}:`,
        data,
      );

      if (data?.success === false || data?.error) {
        console.log('API returned success:false or error:', data);
        throw new Error('Failed to fetch products by department');
      }

      return data;
    } catch (error: any) {
      console.log('ProductsByDepartment API error:', error);
      if (error.response?.data) {
        console.log('Error response data:', error.response.data);
        throw new Error(
          error.response.data?.message ||
            'Failed to fetch products by department',
        );
      }
      throw error;
    }
  },
};
