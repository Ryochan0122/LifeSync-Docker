import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { PremiumProvider } from './src/context/PremiumContext';

export default function App() {
  return (
    <NavigationContainer linking={undefined}>
      <ScheduleProvider>
        <PremiumProvider>
          <AppNavigator />
        </PremiumProvider>
      </ScheduleProvider>
    </NavigationContainer>
  );
}