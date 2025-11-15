import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Spinner, Center } from 'native-base';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center flex={1} bg="white">
        <Spinner size="lg" color="primary.600" />
      </Center>
    );
  }

  return <NavigationContainer>{isAuthenticated ? <AppTabs /> : <AuthStack />}</NavigationContainer>;
}
