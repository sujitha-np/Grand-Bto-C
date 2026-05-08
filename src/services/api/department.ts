import apiClient from './client';
import { BASE_URL } from '../../constants/api';

export interface Department {
  id: number;
  name_en: string;
  name_ar: string;
  url_slug: string;
  image: string;
  status: number;
}

export const departmentService = {
  getDepartments: async () => {
    try {
      const { data } = await apiClient.get('/departments');

      if (data?.success === false || data?.error) {
        throw new Error('Failed to fetch departments');
      }

      return data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to fetch departments',
        );
      }
      throw error;
    }
  },
};
