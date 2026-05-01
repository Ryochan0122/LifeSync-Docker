import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import FeedScreen           from '../screens/FeedScreen';
import NewPostScreen        from '../screens/NewPostScreen';
import CalendarScreen       from '../screens/CalendarScreen';
import AddScheduleScreen    from '../screens/AddScheduleScreen';
import EditScheduleScreen   from '../screens/EditScheduleScreen';
import HistoryScreen        from '../screens/HistoryScreen';
import CommunityFeedScreen  from '../screens/CommunityFeedScreen';
import FriendSearchScreen   from '../screens/FriendSearchScreen';
import SettingsScreen       from '../screens/SettingsScreen';
import QuestionScreen       from '../screens/QuestionScreen';
import { RootStackParamList } from '../types';

const C = {
  card: '#111120', border: '#1C1C30',
  accent: '#7C3AED', muted: '#4A4A6A', text: '#EEEEFF',
};

const headerOpts = {
  headerStyle:      { backgroundColor: C.card },
  headerTitleStyle: { color: C.text, fontSize: 17, fontWeight: '700' as const },
  headerTintColor:  C.accent,
};

// ─── フィードスタック ──────────────────────────────────────────

const FeedStack = createNativeStackNavigator<RootStackParamList>();
function FeedStackNav() {
  return (
    <FeedStack.Navigator id={undefined} screenOptions={headerOpts}>
      <FeedStack.Screen name="Feed"    component={FeedScreen}    options={{ title: 'フィード' }} />
      <FeedStack.Screen name="NewPost" component={NewPostScreen} options={{ title: '投稿する', presentation: 'modal' }} />
    </FeedStack.Navigator>
  );
}

// ─── カレンダースタック ────────────────────────────────────────

const CalStack = createNativeStackNavigator<RootStackParamList>();
function CalStackNav() {
  return (
    <CalStack.Navigator id={undefined} screenOptions={headerOpts}>
      <CalStack.Screen name="Calendar"      component={CalendarScreen}    options={{ title: 'カレンダー' }} />
      <CalStack.Screen name="AddSchedule"   component={AddScheduleScreen} options={{ title: '予定を追加' }} />
      <CalStack.Screen name="EditSchedule"  component={EditScheduleScreen}options={{ title: '予定を編集' }} />
      <CalStack.Screen name="History"       component={HistoryScreen}     options={{ title: '履歴' }} />
      <CalStack.Screen name="Question"      component={QuestionScreen}    options={{ title: 'ヘルプ' }} />
    </CalStack.Navigator>
  );
}

// ─── コミュニティスタック ──────────────────────────────────────

const CommStack = createNativeStackNavigator<RootStackParamList>();
function CommStackNav() {
  return (
    <CommStack.Navigator id={undefined} screenOptions={headerOpts}>
      <CommStack.Screen
        name="CommunityFeed"
        component={CommunityFeedScreen}
        options={{ title: 'コミュニティ' }}
      />
      <CommStack.Screen
        name="FriendSearch"
        component={FriendSearchScreen}
        options={{ title: 'フレンドを探す' }}
      />
    </CommStack.Navigator>
  );
}

// ─── BottomTab ─────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          paddingBottom:   Platform.OS === 'ios' ? 20 : 8,
          paddingTop:      8,
          height:          Platform.OS === 'ios' ? 82 : 60,
        },
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, marginTop: 2 },
        tabBarIcon: ({ color }) => {
          const icons: Record<string, string> = {
            FeedTab:     'home',
            CalendarTab: 'calendar',
            CommTab:     'users',
            SettingsTab: 'settings',
          };
          return <Icon name={icons[route.name] ?? 'circle'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="FeedTab"     component={FeedStackNav}   options={{ title: 'フィード' }} />
      <Tab.Screen name="CalendarTab" component={CalStackNav}    options={{ title: 'カレンダー' }} />
      <Tab.Screen name="CommTab"     component={CommStackNav}   options={{ title: 'コミュニティ' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: '設定', headerShown: false }} />
    </Tab.Navigator>
  );
}