import apiClient from './client';

export interface Category {
  id: number;
  department_id: number;
  name_en: string;
  url_slug: string;
  name_ar: string;
  image: string;
  status: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  department: {
    id: number;
    name_en: string;
    url_slug: string;
    name_ar: string;
    image: string;
    status: number;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export const categoryService = {
  getCategories: async () => {
    try {
      const { data } = await apiClient.get('/categories');
      console.log('Raw categories API response:', data);

      if (data?.success === false || data?.error) {
        console.log('API returned success:false or error:', data);
        throw new Error('Failed to fetch categories');
      }

      return data;
    } catch (error: any) {
      console.log('Categories API error:', error);
      if (error.response?.data) {
        console.log('Error response data:', error.response.data);
        throw new Error(
          error.response.data?.message || 'Failed to fetch categories',
        );
      }
      throw error;
    }
  },
};
