import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSchedules } from '../context/ScheduleContext';
import MainTabNavigator from './MainTabNavigator';
import AuthScreen from '../screens/AuthScreen';

export default function AppNavigator() {
  const { user, loading } = useSchedules();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07070F' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // 認証状態で自動切り替え。ログイン成功/失敗でリレンダーされる
  return user ? <MainTabNavigator /> : <AuthScreen />;
}