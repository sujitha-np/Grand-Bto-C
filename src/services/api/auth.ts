import apiClient from './client';

function extractError(data: any, fallback: string): string {
  let errorMsg = data?.message || fallback;
  if (data?.error) {
    if (typeof data.error === 'object') {
      errorMsg = Object.values(data.error).flat().join('\n');
    } else if (typeof data.error === 'string') {
      errorMsg = data.error;
    }
  }
  return errorMsg;
}

export interface RegisterParams {
  name_en: string;
  mobile: string;
  email: string;
  gender: string;
  dob: string;
  password: string;
}

export const authService = {
  register: async (params: RegisterParams) => {
    try {
      const formData = new FormData();
      formData.append('name_en', params.name_en);
      formData.append('mobile', params.mobile);
      formData.append('email', params.email);
      formData.append('gender', params.gender);
      formData.append('dob', params.dob);
      formData.append('password', params.password);

      const { data } = await apiClient.post('/customer/register', formData);

      if (data?.success === false || data?.error) {
        throw new Error(extractError(data, 'Registration failed'));
      }

      return data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(
          extractError(error.response.data, 'Registration failed'),
        );
      }
      throw error;
    }
  },

  sendOtp: async (login_id: string, password?: string) => {
    try {
      const payload: any = { login_id };
      if (password) payload.password = password;

      const { data } = await apiClient.post('/customer/send-otp', payload);

      if (data?.success === false || data?.error) {
        throw new Error(extractError(data, 'Login failed'));
      }

      return data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(extractError(error.response.data, 'Login failed'));
      }
      throw error;
    }
  },

  verifyOtp: async (customer_id: number | string, otp: string) => {
    try {
      const { data } = await apiClient.post('/customer/verify-otp', {
        customer_id,
        otp,
      });

      if (data?.success === false || data?.error) {
        throw new Error(extractError(data, 'OTP Verification failed'));
      }

      return data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(
          extractError(error.response.data, 'OTP Verification failed'),
        );
      }
      throw error;
    }
  },
};
