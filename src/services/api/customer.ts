import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface CustomerProfile {
  id: number;
  employee_code: string | null;
  name_en: string;
  name_ar: string | null;
  mobile: string;
  email: string;
  qid: string | null;
  gender: string;
  dob: string;
  photo: string | null;
  designation: string | null;
  status: number;
  wallet_balance: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder_name: string | null;
  bank_ifsc_code: string | null;
  bank_branch: string | null;
  cutoff_time: string | null;
  use_custom_settings: number;
  registration_source: string;
  is_approved: number;
  otp: string | null;
  otp_expiration: string | null;
  access_token: string | null;
  device_token: string | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  is_verified: number;
  verified_by: number | null;
  verified_at: string | null;
}

export interface CustomerProfileResponse {
  success: boolean;
  data: CustomerProfile;
  message?: string;
}

export const customerService = {
  getProfile: async (customerId: string): Promise<CustomerProfileResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Profile API - Token:', token ? 'Found' : 'NOT FOUND');
      console.log('Profile API - Customer ID:', customerId);

      const url = `${BASE_URL}/api/customer/profile/${customerId}`;
      console.log('Profile API - Making request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `bearer ${token}`,
          bearer: `${token}`,
          token: `${token}`,
        },
      });

      const data = await response.json();
      console.log('Profile API - Response:', data);
      console.log('Profile API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return data;
    } catch (error: any) {
      console.log('Profile API - Error:', error);
      console.log('Profile API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to fetch profile');
    }
  },

  updateProfile: async (
    customerId: string,
    profileData: Partial<CustomerProfile>,
  ): Promise<CustomerProfileResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}/api/customer/profile/update`;

      console.log('Update Profile API - Token:', token ? 'Found' : 'NOT FOUND');
      console.log('Update Profile API - URL:', url);
      console.log('Update Profile API - Data:', {
        customer_id: customerId,
        ...profileData,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `bearer ${token}`,
          bearer: `${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          ...profileData,
        }),
      });

      const data = await response.json();
      console.log('Update Profile API - Response:', data);
      console.log('Update Profile API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return data;
    } catch (error: any) {
      console.log('Update Profile API - Error:', error);
      console.log('Update Profile API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to update profile');
    }
  },
};
