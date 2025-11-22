import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WatchlistScreen } from '../screens/tabs/WatchlistScreen';
import { SearchScreen } from '../screens/tabs/SearchScreen';
import { FamilyScreen } from '../screens/tabs/FamilyScreen';
import { SettingsScreen } from '../screens/tabs/SettingsScreen';

export type TabParamList = {
  Watchlist: undefined;
  Search: undefined;
  Family: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          tabBarLabel: 'Watchlist',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarLabel: 'Family',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};
