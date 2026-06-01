import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

export interface FeedbackData {
  customer_id: string;
  product_id?: string;
  feedback: string;
  rating: string;
  feedback_type: string;
  feedback_date: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const feedbackService = {
  submitFeedback: async (
    feedbackData: FeedbackData,
  ): Promise<FeedbackResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}/api/customer/feedback/save`;

      console.log('Feedback API - Token:', token ? 'Found' : 'NOT FOUND');
      console.log('Feedback API - URL:', url);
      console.log('Feedback API - Data:', feedbackData);

      // Prepare request body - exclude product_id if not provided
      const requestData = { ...feedbackData };
      if (!requestData.product_id) {
        delete requestData.product_id;
      }

      const requestBody = JSON.stringify(requestData);
      console.log('Feedback API - Request Body (raw):', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          bearer: `${token}`,
        },
        body: requestBody,
      });

      const data = await response.json();
      console.log('Feedback API - Response:', data);
      console.log('Feedback API - Status:', response.status);
      console.log(
        'Feedback API - Response Body:',
        JSON.stringify(data, null, 2),
      );

      // Log validation errors if present
      if (data?.errors || data?.error) {
        console.log(
          'Feedback API - Validation Errors:',
          JSON.stringify(data.errors || data.error, null, 2),
        );
      }

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;

        // Check for validation errors in 'error' field (Laravel format)
        if (data?.error && typeof data.error === 'object') {
          const validationErrors = Object.entries(data.error)
            .map(([field, msgs]: [string, any]) => {
              const message = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${field}: ${message}`;
            })
            .join('; ');
          errorMessage = validationErrors;
        }
        // Check for validation errors in 'errors' field
        else if (data?.errors && typeof data.errors === 'object') {
          const validationErrors = Object.entries(data.errors)
            .map(([field, msgs]: [string, any]) => {
              const message = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${field}: ${message}`;
            })
            .join('; ');
          errorMessage = validationErrors;
        }
        // Check for simple message field
        else if (data?.message) {
          errorMessage = data.message;
        }
        // Check for string error field
        else if (data?.error && typeof data.error === 'string') {
          errorMessage = data.error;
        }

        console.log('Feedback API - Error Details:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      console.log('Feedback API - Error:', error);
      console.log('Feedback API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to submit feedback');
    }
  },
};
