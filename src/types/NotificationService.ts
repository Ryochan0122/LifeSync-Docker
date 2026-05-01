// utils/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: true },
      });
      return status === 'granted';
    }
    return false;
  }

  static async scheduleNotification(title: string, body: string, date: Date) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { type: 'date', date } as any,
    });
  }
}

export default NotificationService;