import AsyncStorage from '@react-native-async-storage/async-storage';

type Callback = () => void;
const listeners = new Set<Callback>();

export const authEvents = {
  subscribe(listener: Callback) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async emitUnauthorized() {
    console.log('authEvents - emitUnauthorized called. Clearing credentials...');
    try {
      await AsyncStorage.removeItem('customerId');
      await AsyncStorage.removeItem('userToken');
    } catch (e) {
      console.error('Error clearing storage on unauthorized event:', e);
    }

    listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error executing unauthorized listener:', e);
      }
    });
  }
};
