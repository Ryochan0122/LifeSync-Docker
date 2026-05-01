import * as Notifications from 'expo-notifications';

export default class NotificationService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async scheduleNotification(title: string, body: string, date: Date) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { date } as Notifications.NotificationTriggerInput, //
    });
  }
}