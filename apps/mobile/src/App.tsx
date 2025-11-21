import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import { AuthProvider } from '@/contexts/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { theme } from '@/theme';

export default function App() {
  return (
    <NativeBaseProvider theme={theme}>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </NativeBaseProvider>
  );
}
