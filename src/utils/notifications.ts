import AsyncStorage from '@react-native-async-storage/async-storage';

const READ_NOTIFS_KEY = 'read_notification_ids';

export const getReadNotificationIds = async (): Promise<number[]> => {
  try {
    const raw = await AsyncStorage.getItem(READ_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const markNotificationsAsRead = async (
  notificationIds: number[],
): Promise<number[]> => {
  try {
    const existing = await getReadNotificationIds();
    const combined = Array.from(new Set([...existing, ...notificationIds]));
    await AsyncStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(combined));
    return combined;
  } catch (e) {
    console.error('Error marking notifications as read:', e);
    return [];
  }
};
