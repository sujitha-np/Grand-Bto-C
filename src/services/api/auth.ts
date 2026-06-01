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
    const MAX_RETRIES = 2;
    let lastError: any;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Register - Retry attempt ${attempt}/${MAX_RETRIES}`);
          // Exponential backoff: 1s, 2s
          await new Promise(resolve =>
            setTimeout(resolve, attempt * 1000),
          );
        }

        console.log('Register - Params:', params);

        const { data } = await apiClient.post(
          '/customer/register',
          {
            name_en: params.name_en,
            mobile: params.mobile,
            email: params.email,
            gender: params.gender,
            dob: params.dob,
            password: params.password,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30s timeout per attempt
          },
        );

        console.log('Register - Response:', data);

        if (data?.success === false || data?.error) {
          throw new Error(extractError(data, 'Registration failed'));
        }

        return data;
      } catch (error: any) {
        lastError = error;

        // If it's a server response error (4xx/5xx), don't retry
        if (error.response?.data) {
          console.error('Register - Server Error:', error.response?.data);
          throw new Error(
            extractError(error.response.data, 'Registration failed'),
          );
        }

        // Network error — log details and retry
        const isNetworkError =
          error.message === 'Network Error' ||
          error.code === 'ERR_NETWORK' ||
          error.code === 'ECONNABORTED' ||
          !error.response;

        if (isNetworkError) {
          console.error(
            `Register - Network Error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
            {
              code: error.code,
              message: error.message,
              config_url: error.config?.url,
              config_baseURL: error.config?.baseURL,
            },
          );

          // If we still have retries left, continue the loop
          if (attempt < MAX_RETRIES) {
            continue;
          }
        }

        // No more retries or non-network error
        break;
      }
    }

    // All retries exhausted
    if (
      lastError?.message === 'Network Error' ||
      lastError?.code === 'ERR_NETWORK' ||
      !lastError?.response
    ) {
      throw new Error(
        'Unable to connect to the server. Please check your internet connection and try again.',
      );
    }

    throw lastError;
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
