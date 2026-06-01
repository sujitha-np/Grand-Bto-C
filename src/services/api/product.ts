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
  preparation_time_minutes?: number;
  preparation_time_formatted?: string;
}

export interface ProductDetail extends Product {
  item_code: string | null;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  pcs_unit_id: number | null;
  no_of_pcs_per_pack: number | null;
  unit_id: number | null;
  brand_id: number | null;
  manufacturing_date: string | null;
  shelf_life_days: number | null;
  destination: string | null;
  barcode: string | null;
  auto_barcode: string;
  min_order_quantity: number;
  hide_quantity: number;
  preparation_time_minutes: number;
  reserved_stock: number;
  inventory_type: string;
  is_complimentary: number;
  is_addon: number;
  is_manufactured: number;
  manufacturing_capacity_per_day: number | null;
  production_lead_time_hours: number;
  is_featured: number;
  product_status: number;
  type: string | null;
  coupon_code: string | null;
  no_of_coupons: number | null;
  quantity: number;
  status: number;
  created_by: number;
  updated_by: number;
  last_sync_on: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  ingredients: string | null;
  allergens: string | null;
  calories: string | null;
  nutritional_info: string | null;
  portion_grammage: string | null;
  expiry_date: string | null;
  tags: string | null;
  department_info: {
    id: number;
    name_en: string;
    name_ar: string;
  };
  subcategory: {
    id: number;
    name_en: string;
    url_slug: string;
    name_ar: string;
    image: string | null;
    category_type: number;
    parent_id: number;
    department_id: number | null;
    order_no: number;
    combo_meal: number;
    status: number;
  };
  images: any[];
  offer: any | null;
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
  searchProducts: async (searchTerm: string) => {
    try {
      const { data } = await apiClient.post('/customer/products/search', {
        search_term: searchTerm,
      });
      console.log('Raw search products API response:', data);

      if (data?.success === false || data?.error) {
        console.log('API returned success:false or error:', data);
        throw new Error('Failed to search products');
      }

      return data;
    } catch (error: any) {
      console.log('Search products API error:', error);
      if (error.response?.data) {
        console.log('Error response data:', error.response.data);
        throw new Error(
          error.response.data?.message || 'Failed to search products',
        );
      }
      throw error;
    }
  },
};
